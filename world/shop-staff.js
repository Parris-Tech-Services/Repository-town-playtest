// Shop NPCs are sourced from the existing TownLife roster, not a second
// disconnected set of random names. A volunteer host covers unstaffed places.
import * as THREE from 'three';
import { makePerson, Walker } from './npcs.js';

const SHIRTS={shop:0x557e9f,cafe:0x528c75,pub:0x9b6847,farm:0x71914e,clinic:0x77a7ac,school:0x6883b0,post:0x96745c};
const HOST_NAMES={square:'Market Guide',farmhouse:'Nell'};

export function populateShopStaff(site,life,interior,makeLabel){
  const workers=life.villagers.filter(v=>v.work===site.id);
  // Keep the worker's real name, role, and home available to the conversation.
  const worker=workers.find(v=>v.step?.kind==='work'&&v.step.at===site.id&&!v.path?.length)
    || workers[0] || null;
  const name=worker?.name||HOST_NAMES[site.id]||site.name+' Guide';
  const job=worker?.job||(site.id==='farmhouse'?'farmhouse resident':site.kind==='farm'?'farm guide':'visitor assistant');
  const home=site.id==='farmhouse';
  const pos=home?new THREE.Vector3(-5.20,0,-3.65):interior.staff?new THREE.Vector3(interior.staff.pos.x,0,interior.staff.pos.z):new THREE.Vector3(2.65,0,-8.25);
  const seed=[...site.id].reduce((x,ch)=>x+ch.charCodeAt(0),31);
  const model=makePerson(seed,SHIRTS[site.kind]||0x7297aa,0x303e4e);
  const npc=new Walker(model,pos,{name,speed:0.4});
  npc.heading=0; // Face towards the front door, behind the service counter.
  npc.group.rotation.y=0;
  npc.key='staff:'+site.id;
  npc.room=home?3:0;
  npc.activity=home?'at home organising family farm jobs':job+' at '+site.name;
  npc.v=worker;
  npc.workplace=site.name;
  // The counter blocks passage but not conversation: interaction hotspot
  // is on the customer's side, close enough to press E/✋ without clipping.
  const label=makeLabel(name+' · '+job,'interactive');
  label.position.set(0,2.28,0);
  label.userData.labelKind='interactive';
  npc.tag=label;
  npc.group.add(label);
  interior.group.add(npc.group);
  npc.plan=()=>[]; // Stay at the counter instead of walking through furniture.
  const posUse=home?new THREE.Vector3(-5.10,0,-3.10):interior.staff?new THREE.Vector3(interior.staff.use.x,0,interior.staff.use.z):new THREE.Vector3(2.6,0,-5.1);
  interior.interactables.push({
    key:npc.key,label:'Talk to '+name,type:'npc',person:true,room:npc.room,
    roomName:interior.rooms[npc.room].name,pos:posUse,
    act:{do:'npc',name,role:'villager',workplace:site.name,job},
  });
  interior.sceneObjects.push({type:'person',label:name+' ('+job+')',room:npc.room,
    pos:{x:pos.x,z:pos.z},interactive:true});
  return [npc];
}
