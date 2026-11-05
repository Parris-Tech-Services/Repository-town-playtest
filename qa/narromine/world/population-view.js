import {makeDistinctPerson} from './npc-wardrobe.js';
import {pose} from './npcs.js';
// Lazy allocation with a strict draw cap: population is not synonymous with street crowd.
export function createPopulationView(life,group,makeLabel){
  const models=new Map();
  return {models,update(dt,t,eye,overview){
    for(const p of models.values())p.fig.group.visible=false;
    if(overview)return;
    const visible=(life.population?.additional||[]).filter(v=>!v.inside&&Math.hypot(v.x-eye.x,v.z-eye.z)<65)
      .sort((a,b)=>Math.hypot(a.x-eye.x,a.z-eye.z)-Math.hypot(b.x-eye.x,b.z-eye.z)).slice(0,48);
    for(const v of visible){let p=models.get(v.id);
      if(!p){const fig=makeDistinctPerson(v.populationId+':'+v.name,v),label=makeLabel(v.name+' · '+v.age,'interactive');label.position.set(0,2.4,0);fig.group.add(label);group.add(fig.group);p={fig,label};models.set(v.id,p);}
      p.fig.group.visible=true;p.fig.group.position.set(v.x,0,v.z);p.fig.group.rotation.y=v.heading;
      p.label.visible=Math.hypot(v.x-eye.x,v.z-eye.z)<14;pose(p.fig,dt,t,v.path.length>0);
    }
  }};
}
