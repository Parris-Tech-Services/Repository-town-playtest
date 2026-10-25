import {CAFE_TABLES} from './work-recipes.js';
// The real TownLife roster drives visible civic visitors. This is presentation
// only: it never invents a customer, spends money, or advances the town clock.
import * as THREE from 'three';
import { makePerson, pose } from './npcs.js';

const RADIUS = 0.27, GRID = 0.55;
const length = (a,b) => Math.hypot(a.x-b.x,a.z-b.z);
const collision = (boxes,x,z,r=RADIUS) =>
  boxes.some(b=>x+r>b.x0 && x-r<b.x1 && z+r>b.z0 && z-r<b.z1);
const inBounds = (b,x,z,r=RADIUS)=> x>b.x0+r && x<b.x1-r && z>b.z0+r && z<b.z1-r;
const clear = (p,boxes,bounds,r=RADIUS) =>
  inBounds(bounds,p.x,p.z,r)&&!collision(boxes,p.x,p.z,r);
export function clearWalk(from,to,boxes,bounds,r=RADIUS){
  const n=Math.max(1,Math.ceil(length(from,to)/0.18));
  for(let i=1;i<=n;i++){
    const p={x:from.x+(to.x-from.x)*i/n,z:from.z+(to.z-from.z)*i/n};
    if(!clear(p,boxes,bounds,r))return false;
  }
  return true;
}
// Only called when a visitor changes destinations, never on each frame.
// Grid A* preserves furniture collisions, with no diagonal corner-cutting.
export function routeVisitor(start,end,boxes,bounds,r=RADIUS) {
  if(!clear(start,boxes,bounds,r)||!clear(end,boxes,bounds,r))return null;
  if(clearWalk(start,end,boxes,bounds,r))return [{...end}];
  const at=(i,j)=>({x:start.x+i*GRID,z:start.z+j*GRID});
  const key=(i,j)=>i+','+j;
  const open=[{i:0,j:0,g:0,f:length(start,end),prev:null}];
  const seen=new Map([[key(0,0),0]]);
  const limitX=Math.ceil((bounds.x1-bounds.x0)/GRID)+2;
  const limitZ=Math.ceil((bounds.z1-bounds.z0)/GRID)+2;
  const moves=[[1,0],[-1,0],[0,1],[0,-1]];
  let finish=null;
  for(let k=0;k<2400 && open.length;k++){
    open.sort((a,b)=>a.f-b.f||a.g-b.g);
    const n=open.shift(),p=at(n.i,n.j);
    if(n.g>seen.get(key(n.i,n.j))+1e-6)continue;
    if(length(p,end)<1.1&&clearWalk(p,end,boxes,bounds,r)){finish=n;break;}
    for(const [di,dj] of moves){
      const i=n.i+di,j=n.j+dj;
      if(Math.abs(i)>limitX||Math.abs(j)>limitZ)continue;
      const q=at(i,j);
      if(!clear(q,boxes,bounds,r)||!clearWalk(p,q,boxes,bounds,r))continue;
      const cost=n.g+GRID,k2=key(i,j);
      if(cost>= (seen.get(k2)??Infinity)-1e-6)continue;
      seen.set(k2,cost);
      open.push({i,j,g:cost,f:cost+length(q,end),prev:n});
    }
  }
  if(!finish)return null; // Not an excuse to walk through a wall.
  const points=[];
  for(let node=finish;node?.prev;node=node.prev)points.push(at(node.i,node.j));
  points.reverse();points.push({...end});
  const smooth=[],origin={...start};
  for(let i=0;i<points.length;){
    let j=points.length-1;
    while(j>i&&!clearWalk(origin,points[j],boxes,bounds,r))j--;
    const point=points[j];smooth.push(point);
    origin.x=point.x;origin.z=point.z;i=j+1;
  }
  return smooth;
}
const nearSeat=(seat,boxes,bounds)=>{
  for(const d of [0.78,1.05,1.35]){
    for(let i=0;i<12;i++){
      const a=i*Math.PI/6,pt={x:seat.pos.x+Math.cos(a)*d,z:seat.pos.z+Math.sin(a)*d};
      if(clear(pt,boxes,bounds))return pt;
    }
  }
  return null;
};
export function visitorsForSite(life,siteId,staffId=null){
  return life.villagers.filter(v=>v.inside&&!v.path?.length&&v.step?.at===siteId &&
    (['buy','eatout','snack'].includes(v.step.kind) ||
     (siteId==='pub'&&v.step.kind==='idle') ||
     (v.step.kind==='work'&&v.id!==staffId)));
}
export function createShopVisitors(site,life,interior,makeLabel,people){
  const entries=new Map(),group=interior.group,boxes=interior.colliders,bounds=interior.bounds;
  const entry={x:0,z:Math.min(bounds.z1-0.65,4.7)};
  const counter=site.id==='cafe'||site.id==='pub'
    ? {x:1.3,z:-3.7} : {x:2.7,z:-3.5};
  const inRoom=p=>clear(p,boxes,bounds);
  const firstClear=(options)=>options.find(inRoom)||entry;
  const positionAt=(p,target)=>{p.pos.x=target.x;p.pos.z=target.z;p.group.position.set(target.x,0,target.z);};
  const setDestination=(p,destination)=>{
    const path=routeVisitor(p.pos,destination,boxes,bounds);
    if(!path)return false;
    p.route=path;p.state='walking';return true;
  };
  const vacantSeats=(reserved,playerSeat)=> (interior.seats||[]).filter(s=>
    s.key!==playerSeat && !reserved.has(s.key) && !s.occupiedBy &&
    (['pub','cafe'].includes(site.id) ? ['chair','stool','sofa','armchair','bench'].includes(s.type) : true));
  const reserveSeat=(p,reserved,playerSeat)=>{
    const ticket=site.id==='cafe'?life.civic?.workplay?.cafe?.tickets.find(o=>o.id===p.v.step?.workTicket):null;
    const table=ticket&&CAFE_TABLES[ticket.table-1];
    const options=vacantSeats(reserved,playerSeat).filter(s=>!table||Math.hypot(s.pos.x-table[0],s.pos.z-table[1])<.85)
      .map(s=>({s,landing:nearSeat(s,boxes,bounds)})).filter(x=>x.landing)
      .sort((a,b)=>length(a.landing,p.pos)-length(b.landing,p.pos));
    for(const {s,landing} of options){
      if(routeVisitor(p.pos,landing,boxes,bounds)){
        p.seat=s;p.landing=landing;reserved.add(s.key);s.occupiedBy=p.v.name;return true;
      }
    }
    return false;
  };
  const wantsSeat=v=> ['cafe','pub'].includes(site.id) &&
    (v.step?.kind==='eatout'||v.step?.kind==='idle') && !v.step?.queue;
  const addPerson=(v,existing,reserved,playerSeat)=>{
    const seed=v.id*37+11,fig=makePerson(seed,0x587e88+((v.id%4)*0x100b03),0x333945);
    const pos=new THREE.Vector3(entry.x,0,entry.z);
    const tag=makeLabel(v.name,'interactive');tag.position.y=2.35;
    fig.group.add(tag);group.add(fig.group);
    const p={v,key:'visitor:'+v.id,name:v.name,pos,group:fig.group,fig,tag,room:0,
      activity:v.activity,route:[],state:'waiting',seat:null,talking:false,exit:false,
      phase:seed*.071,speed:v.bike?1.2:1.05};
    entries.set(v.id,p);people.push(p);
    // When entering a building that already has customers, display them at their
    // current activity instead of replaying their entrance from the beginning.
    if(wantsSeat(v)&&reserveSeat(p,reserved,playerSeat)){
      if(existing){positionAt(p,p.seat.pos);p.state='seated';}
      else if(!setDestination(p,counter)){setDestination(p,p.landing);}
      p.next='service';
    }else{
      const destination=firstClear([{x:counter.x+(v.id%3-1)*1.0,z:counter.z+0.35},
        {x:-2,z:-3.0},{x:0,z:-1}]);
      if(existing)positionAt(p,destination);
      else setDestination(p,destination);
      p.next='counter';
    }
    const hotspot={key:p.key,type:'npc',label:'Talk to '+v.name,person:true,
      room:0,roomName:interior.rooms[0]?.name||site.name,pos:p.pos,
      act:{do:'npc',name:v.name,role:'villager',job:v.job}};
    p.hotspot=hotspot;interior.interactables.push(hotspot);
    return p;
  };
  const advance=(p,dt,t,player)=>{
    const v=p.v;p.activity=p.exit?'leaving '+site.name:v.activity;
    if(p.talking){p.tag.visible=false;return;}
    let moved=false;
    if(p.state==='walking'&&p.route.length){
      const goal=p.route[0],dx=goal.x-p.pos.x,dz=goal.z-p.pos.z,d=Math.hypot(dx,dz);
      if(d<0.11)p.route.shift();
      else{
        const move=Math.min(d,dt*p.speed);
        p.pos.x+=dx/d*move;p.pos.z+=dz/d*move;
        p.group.rotation.y=Math.atan2(dx,dz);moved=true;
      }
    }
    if(p.state==='walking'&&!p.route.length){
      if(p.exit)p.state='gone';
      else if(p.seat&&p.next==='service'){
        // Queue by the counter first; once served, head to the reserved chair.
        p.state='service';p.serviceDelay=1.6;
      }else if(p.seat&&p.next==='seating'){
        positionAt(p,p.seat.pos);p.state='seated';
      }else p.state='standing';
    }
    if(p.state==='service'){
      p.serviceDelay-=dt;
      if(p.serviceDelay<=0&&!v.step?.queue){
        if(setDestination(p,p.landing))p.next='seating';
        else{positionAt(p,p.seat.pos);p.state='seated';}
      }
    }
    pose(p.fig,dt,t+p.phase,moved,false);
    if(p.state==='seated'){
      p.group.position.set(p.seat.pos.x,-0.38,p.seat.pos.z);
      p.fig.legs[0].rotation.x=-1.25;p.fig.legs[1].rotation.x=-1.25;
      p.fig.arms[0].rotation.x=-0.3;p.fig.arms[1].rotation.x=-0.3;
      p.group.rotation.y=p.seat.yaw-Math.PI;
    }else p.group.position.set(p.pos.x,moved?0.035*Math.abs(Math.sin(t*8+p.phase)):0,p.pos.z);
    if(p.state==='seated'){p.pos.x=p.seat.pos.x;p.pos.z=p.seat.pos.z;}
    p.tag.visible=length(p.pos,player.pos)>2.4&&p.state!=='gone';
  };
  let initial=true;
  function update(dt,t,player){
    const reserved=new Set(),playerSeat=player.seated?.key||null;
    for(const s of interior.seats||[])delete s.occupiedBy;
    for(const p of entries.values())if(p.seat&&!p.exit&&p.state!=='gone'){
      if(p.seat.key!==playerSeat){reserved.add(p.seat.key);p.seat.occupiedBy=p.v.name;}
      else{p.seat=null;p.state='standing';p.route=[];}
    }
    const visible=visitorsForSite(life,site.id,
      people.find(p=>p.key==='staff:'+site.id)?.v?.id);
    const active=new Set(visible.map(v=>v.id));
    for(const v of visible){
      if(!entries.has(v.id))addPerson(v,initial,reserved,playerSeat);
    }
    for(const p of entries.values()){
      if(!active.has(p.v.id)&&!p.exit){
        p.exit=true;
        if(p.seat){
          // The model stands up beside its former chair before walking away.
          // Starting a route inside a solid sofa would otherwise fail.
          if(p.landing)positionAt(p,p.landing);
          delete p.seat.occupiedBy;reserved.delete(p.seat.key);p.seat=null;
        }
        if(!setDestination(p,entry))p.state='gone';
      }
      // Customers who were waiting for actual counter service must take a
      // seat after being served, not stay motionless at the till.
      if(!p.exit&&!p.seat&&p.state==='standing'&&wantsSeat(p.v)&&
         reserveSeat(p,reserved,playerSeat)){
        if(setDestination(p,p.landing))p.next='seating';
        else{positionAt(p,p.seat.pos);p.state='seated';}
      }
      if(p.state==='standing'&&p.seat&&p.next==='service'&&!p.exit){
        if(setDestination(p,p.landing))p.next='seating';
      }
      const ticket=site.id==='cafe'?life.civic?.workplay?.cafe?.tickets.find(o=>o.id===p.v.step?.workTicket):null;
      if(ticket?.state==='queue'&&!p.exit){
        const line=life.civic.workplay.cafe.tickets.filter(o=>o.state==='queue').sort((a,b)=>a.created-b.created||a.id-b.id);
        const index=line.findIndex(o=>o.id===ticket.id),dest={x:1.2,z:-3.6+index*.75};
        if(p.queueSlot!==index){if(setDestination(p,dest))p.queueSlot=index;}
      }
      if(p.state!=='gone')advance(p,dt,t,player);
      if(p.state==='gone'){
        group.remove(p.group);
        const hotspotIndex=interior.interactables.indexOf(p.hotspot);
        if(hotspotIndex>=0)interior.interactables.splice(hotspotIndex,1);
        const personIndex=people.indexOf(p);
        if(personIndex>=0)people.splice(personIndex,1);
        entries.delete(p.v.id);
      }
    }
    initial=false;
  }
  return {update,entries};
}
