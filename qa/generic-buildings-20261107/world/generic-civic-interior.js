import { createKit, signFace } from './interior-kit.js';
import { Builder } from './builder.js';
import { PROPS } from './props.js';
import { GENERIC_PROFILES, genericProfileForSite } from './generic-business-fitouts.js';

// This builder is reached only AFTER every bespoke dispatcher has returned.
// Same door, bounds and staff/use contract as the previous fallback office.
export function buildGenericCivicInterior(site,makeLabel) {
  const key=genericProfileForSite(site);
  if(!key)return null;
  const profile=GENERIC_PROFILES[key],k=createKit(site,makeLabel,site.name),b=new Builder();
  k.shell({wall:profile.walls,floor:profile.floor,ceiling:0xf0ece2});
  const placements=[];
  function fixture(type,x,z,yaw=0,label=PROPS[type].label) {
    const p=PROPS[type],quarter=Math.abs(Math.sin(yaw))>.5;
    const w=quarter?p.d:p.w,d=quarter?p.w:p.d;
    b.at(x,0,z,yaw,()=>p.build(b,{}));
    if(p.solid)k.blocker(w,d,x,z);
    const record={type,label,room:0,x,z,w,d,yaw};placements.push(record);k.placedProps.push(record);
    k.sceneObjects.push({type,label,room:0,pos:{x,z},interactive:false});
    if(type==='chair'||type==='bench')k.seat('fixture:'+placements.length,type,x,z,Math.PI+yaw);
  }
  // Public and working areas have a real open passage, not a painted-on door.
  for(const x of [-4.2,4.2])k.solid(5.6,3.45,.14,x,1.725,-7.15,profile.walls);
  k.box(2.8,.45,.14,0,3.225,-7.15,profile.walls);
  k.box(13.6,.014,.13,0,.012,-7.15,0x817969);
  // Counter stays out of the central 2.8m circulation spine.
  fixture('cashRegister',3.8,2.7,0,'Reception and collection');
  const left=(type,z,label)=>fixture(type,-5.4,z,Math.PI/2,label);
  const right=(type,z,label)=>fixture(type,5.4,z,-Math.PI/2,label);
  if(key==='salon'){
    left('salonStation',2.7);left('salonStation',-3.9);
    right('salonWash',-1.1);right('salonWash',-4.5);
    fixture('foldingBench',-4.6,-10.3);fixture('washingMachine',4.8,-10.4);
    fixture('chair',-2.7,3.9,Math.PI/2,'Waiting chair');
  }else if(key==='beauty'){
    left('mirror',2.7);left('treatmentCouch',-3.9);
    right('treatmentCouch',-1.4);right('basin',-4.7);
    fixture('foldingBench',-4.6,-10.3);fixture('cabinet',4.8,-10.4);
  }else if(key==='clothing'){
    left('garmentRail',2.7);left('garmentRail',-3.9);
    right('garmentRail',-1.1);right('mirror',-4.7);
    fixture('foldingBench',-4.6,-10.3);fixture('shelf',4.8,-10.4);
    // Screened fitting nook with a clear opening toward the centre aisle.
    k.solid(2.1,2.5,.1,4.8,1.25,-5.8,0xa59b8a);
    k.box(.08,2.25,1.2,3.72,1.2,-6.0,0x657466);
  }else if(key==='laundry'){
    left('laundryStack',2.7);left('laundryStack',-3.9);
    right('laundryStack',-1.1);right('laundryStack',-4.5);
    fixture('foldingBench',-4.6,-10.3);fixture('foldingBench',4.6,-10.3);
    fixture('bench',-2.8,3.9,Math.PI/2,'Waiting bench');
  }else if(key==='rural'||key==='irrigation'){
    left(key==='rural'?'feedMerchandise':'irrigationStand',2.7);
    left('irrigationStand',-3.9);
    right(key==='rural'?'feedMerchandise':'partsBins',-1.1);
    right('partsBins',-4.5);
    fixture('workbench',-4.5,-10.3);fixture('feedMerchandise',4.7,-10.3);
  }else if(key==='employment'||key==='property'){
    left(key==='property'?'propertyDisplay':'noticeBoard',2.7);
    left(key==='property'?'propertyDisplay':'computer',-3.9);
    right('filingCabinet',-4.5);
    fixture('desk',-4.5,-10.3);fixture('chair',-4.5,-9.0);
    fixture('computer',4.7,-10.3);fixture('filingCabinet',4.7,-8.6);
    fixture('chair',-3.0,3.6,Math.PI/2);
    fixture('chair',-3.0,2.5,Math.PI/2);
  }else{
    left('shelf',2.7);left('cabinet',-3.9);
    right('foldingBench',-1.1);right('crockery',-4.5);
    fixture('workbench',-4.5,-10.3);fixture('crates',4.7,-10.3);
  }
  k.group.add(b.build());
  const rearTitle=key==='salon'?'LINEN & STAFF':key==='laundry'?'FOLDING & COLLECTION':
    ['employment','property'].includes(key)?'CONSULTATION & RECORDS':'STOCK & PREPARATION';
  signFace(k.THREE,k.group,rearTitle,3.7,.36,-4.1,2.5,-7.05,'#53675e');
  signFace(k.THREE,k.group,profile.title.toUpperCase(),3.7,.36,4.1,2.5,-7.05,'#53675e');
  k.text(site.name,0,3.8,-6.95,'room');
  k.add('counter','Reception and service','civic-ledger','Ask about '+site.name+'. Existing town services and transactions are unchanged.',3.8,3.9);
  k.add('fitout',profile.title+' fixtures','info','A type-specific fit-out for this fictional Repository Town business, with a clear public aisle and separate working/storage area.',-3.5,-1.7);
  return k.finish({genericFitout:{key,evidenceLevel:'fictional-gameplay',placements},
    staff:{pos:{x:3.8,z:1.5},use:{x:3.8,z:3.9}}});
}
