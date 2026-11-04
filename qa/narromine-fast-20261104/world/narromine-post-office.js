// Narromine's actual Post Office frontage is mapped from NSW Spatial Services and
// street photographs. The ground-floor postal retail room below is INTERPRETIVE:
// no public interior floor survey, staff roster, private mail or live Australia Post
// integration was used. Do not claim a certified floor plan or real transactions.
import * as THREE from 'three';
import { geoToWorld, DETAILED, polyRect, onTownStreet } from './narromine-layout.js';
import { buildPostInterior, POST_LAYOUT } from './post-interior.js';
import { makeDistinctPerson } from './npc-wardrobe.js';

export const NARROMINE_POST_OFFICE_ID = 'narromine-post-office';
export const NARROMINE_POST_OFFICE_SAVE_ID = 'NARROMINE-PO';
export const NARROMINE_POST_OFFICE_NAME = 'Narromine Post Office';
export const NARROMINE_POST_OFFICE_ADDRESS = '74 Dandaloo Street, Narromine NSW';

// Exterior approach under the north-side cantilevered awning, at the steps
// shown in the NSW-traced exterior. The step polygon's northern edge is near
// -32.231975, 148.239310. Both poses are *outside* the solid building and
// are deliberately separated so fast travel doesn't immediately auto-enter.
const [entryX, entryZ] = geoToWorld(-32.231961, 148.239304);
const [outsideX, outsideZ] = geoToWorld(-32.231944, 148.239304);
export const NARROMINE_POST_OFFICE_ENTRANCE = Object.freeze({
  x: entryX, z: entryZ, yaw: Math.PI,
  outside: Object.freeze({ x: outsideX, z: outsideZ, yaw: Math.PI }),
  returnPose: Object.freeze({ x: outsideX, z: outsideZ, yaw: 0 }),
  radius: 1.28,
});
export const nearNarrominePostOfficeDoor = (pos) =>
  !!pos && Math.hypot(pos.x - entryX, pos.z - entryZ) <= NARROMINE_POST_OFFICE_ENTRANCE.radius;

export function postOfficeExteriorGrounded() {
  const b = DETAILED.find(d => d.id === NARROMINE_POST_OFFICE_ID);
  if (!b) return false;
  const steps = b.props.find(p => p.kind === 'steps');
  if (!steps) return false;
  const rects = DETAILED.flatMap(d => d.parts.map(p => polyRect(p.pts)));
  const outsideClear = [NARROMINE_POST_OFFICE_ENTRANCE, NARROMINE_POST_OFFICE_ENTRANCE.outside].every(p =>
    !rects.some(r => p.x >= r.x0 - .45 && p.x <= r.x1 + .45 && p.z >= r.z0 - .45 && p.z <= r.z1 + .45));
  const stepCentre = steps.pts.reduce((acc,p) => ({x:acc.x+p[0]/steps.pts.length,z:acc.z+p[1]/steps.pts.length}),{x:0,z:0});
  return outsideClear && Math.hypot(entryX-stepCentre.x,entryZ-stepCentre.z)<4.0;
}

// Reuse the game's *existing* modelled postal interior (counter, scales,
// parcel collection, PO boxes, packing bench, back-of-house sorting).
// Its counter is Narromine-specific and never opens Repository Town's ledger.
export function buildNarrominePostOfficeInterior(makeLabel) {
  const site = { id: NARROMINE_POST_OFFICE_ID, name: NARROMINE_POST_OFFICE_NAME };
  const built = buildPostInterior(site, makeLabel, 'Narromine postal retail (illustrative)');
  const counter = built.interactables.find(i => i.key === NARROMINE_POST_OFFICE_ID + ':counter');
  if (!counter) throw new Error('Missing Narromine postal counter');
  counter.label = 'Speak with postal counter staff';
  counter.act = { do: 'narromine-postal-counter', title: 'Narromine Post Office · Service counter' };

  // Interpretive display: general postal services only, no real tracking,
  // employee names, purchases, PO box addresses or personal information.
  const pos = new THREE.Vector3(-2.8,0,2.2);
  const notice = {
    key: NARROMINE_POST_OFFICE_ID + ':heritage',
    type: 'civic',label:'Post Office history and model information',
    room:0,roomName:'Narromine postal retail (illustrative)',pos,
    act:{do:'info',title:'Narromine Post Office · History',
      text:'The Narromine Post Office opened as Narramine on 20 October 1882, when the railway reached town, and was renamed in 1900. The outside building reflects historic street photographs and the NSW cadastral footprint. This ground-floor retail space is an interpretive reconstruction, not a measured floor plan. Postal payments, collection IDs and private mail data are not simulated.'}
  };
  built.interactables.push(notice);
  built.sceneObjects.push({type:'civic',label:notice.label,room:0,pos:{x:pos.x,z:pos.z},interactive:true});
  const sign=makeLabel?.('NARROMINE POST OFFICE · 74 DANDALOO ST','room');
  if(sign){sign.position.set(0,3.55,-5.25);built.group.add(sign);}
  const board=makeLabel?.('INTERPRETIVE INTERIOR · NOT A SURVEY','interactive');
  if(board){board.position.set(-2.8,2.25,2.2);built.group.add(board);}

  // Use the EXACT same articulated, face-and-hair-enabled model maker as
  // Repository Town's indoor workers. This figure is an anonymous, illustrative
  // counter attendant, not a claim about real Narromine postal staff or rosters.
  const staff = makeDistinctPerson('narromine:post-office:illustrative-counter');
  staff.group.position.set(POST_LAYOUT.staff.x, 0, POST_LAYOUT.staff.z);
  staff.group.rotation.y = 0; // Look toward the customer on the public side.
  staff.group.name = 'Illustrative postal counter staff';
  built.group.add(staff.group);
  return { ...built, people:[], narrominePostal:true };
}
