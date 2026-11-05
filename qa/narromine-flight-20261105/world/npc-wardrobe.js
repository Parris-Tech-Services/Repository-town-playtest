// Stable, lightweight resident styling. Shared meshes/materials keep this cheap on phones.
// Does not mutate the simulation, saved records, NPC keys or dialogue voices.
import * as THREE from 'three';
import { makePerson } from './npcs.js';

const BOX = new THREE.BoxGeometry(1, 1, 1);
const BALL = new THREE.SphereGeometry(1, 9, 7);
const CYL = new THREE.CylinderGeometry(.5, .5, 1, 10);
const materials = new Map();
const mat = c => {
  if (!materials.has(c)) materials.set(c, new THREE.MeshLambertMaterial({ color: c }));
  return materials.get(c);
};
function add(parent, geo, colour, size, pos) {
  const obj = new THREE.Mesh(geo, mat(colour));
  obj.scale.set(...size);
  obj.position.set(...pos);
  parent.add(obj);
  return obj;
}
export function residentSeed(identity) {
  const key = String(identity ?? 'resident');
  let hash = 2166136261;
  for (const ch of key) {
    hash ^= ch.codePointAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}
const ink = 0x252c3d;
const hairTones = [0x271c19, 0x503423, 0x8d552b, 0xbd8d4c, 0xdbbf84, 0x3c3236, 0xb5a9a1, 0x7c3132];
const trouserTones = [0x2b3648, 0x41404c, 0x3d4c38, 0x6e5142, 0x253b42, 0x6a594d, 0x464451];
const accessories = [0xe9d8ba, 0xf1aa76, 0xa6b9df, 0xdabb6b, 0xc9d7c2, 0xb4a2cd, 0xe9c3cb];
export function appearanceFor(identity) {
  const seed = residentSeed(identity);
  // Character-specific clothing hue: no sequential same-blue/uniform clones.
  const shirt = new THREE.Color().setHSL((seed % 360) / 360, .34 + ((seed >>> 9) % 25) / 100, .34 + ((seed >>> 14) % 22) / 100).getHex();
  return {
    seed,
    shirt,
    trousers: trouserTones[(seed >>> 3) % trouserTones.length],
    hair: hairTones[(seed >>> 5) % hairTones.length],
    accent: accessories[(seed >>> 12) % accessories.length],
    hairStyle: (seed >>> 8) % 8,
    clothing: (seed >>> 16) % 7,
    glasses: (seed >>> 21) % 5 === 0,
    facialHair: (seed >>> 23) % 5 === 0,
    build: (seed >>> 25) % 6,
  };
}
export function makeDistinctPerson(identity) {
  const look = appearanceFor(identity);
  const p = makePerson(look.seed, look.shirt, look.trousers);
  const head = p.head;
  const outfit = p.group.children.find(child => child.userData.isOutfit);
  const a = (parent, geo, colour, size, pos) => add(parent, geo, colour, size, pos);
  // Shape and height variations keep people distinguishable in silhouette.
  const widths = [.92, 1, 1.06, .96, 1.09, .98];
  const heights = [.95, 1.03, 1, 1.07, .97, 1.04];
  p.group.scale.set(widths[look.build], heights[look.build], widths[look.build]);
  // Eight recognisable hair/headwear silhouettes rather than just recoloured caps.
  switch (look.hairStyle) {
  case 0: // bun
    a(head, BALL, look.hair, [.18,.18,.18], [0,.27,-.13]);
    break;
  case 1: // long hair at the sides
    for (const side of [-1,1]) a(head, BALL, look.hair, [.08,.21,.16], [side*.20,-.075,-.05]);
    break;
  case 2: // beanie
    a(head, BALL, look.accent, [.245,.12,.22], [0,.215,0]);
    a(head, CYL, look.accent, [.49,.06,.46], [0,.16,0]);
    break;
  case 3: // brimmed hat
    a(head, CYL, look.hair, [.73,.05,.65], [0,.24,0]);
    a(head, CYL, look.hair, [.35,.21,.33], [0,.36,0]);
    break;
  case 4: // ponytail
    a(head, BALL, look.hair, [.13,.25,.12], [0,-.025,-.23]);
    a(head, BALL, look.accent, [.075,.04,.07], [0,.08,-.26]);
    break;
  case 5: // short spiked cut
    for (let n=-2;n<=2;n++) a(head, BALL, look.hair, [.067,.115,.09], [n*.077,.23-Math.abs(n)*.015,0]);
    break;
  case 6: // headband
    a(head, BOX, look.accent, [.415,.055,.33], [0,.17,.03]);
    break;
  default: // flat cap with a projecting peak
    a(head, BALL, look.hair, [.24,.105,.20], [0,.20,-.01]);
    a(head, BOX, look.accent, [.31,.03,.17], [0,.14,.19]);
  }
  if (look.glasses) {
    // Fine wire rims round each eye and a bridge, not heavy bars across the face.
    for (const side of [-1,1]) {
      a(head, BOX, ink, [.07,.007,.006], [side*.072,.052,.192]);
      a(head, BOX, ink, [.07,.007,.006], [side*.072,.008,.192]);
      a(head, BOX, ink, [.007,.05,.006], [side*.107,.03,.19]);
      a(head, BOX, ink, [.007,.05,.006], [side*.037,.03,.193]);
      a(head, BOX, ink, [.06,.006,.006], [side*.15,.04,.12]);   // arm to the ear
    }
    a(head, BOX, ink, [.03,.006,.006], [0,.04,.195]);           // bridge
  }
  if (look.facialHair) {
    a(head, BALL, look.hair, [.055,.013,.014], [0,-.07,.185]); // neat moustache above the lip
  }
  // Seven strongly legible garments: apron, vest, scarf, jacket, stripe, sash or buttons.
  switch(look.clothing) {
  case 0:
    a(outfit, BOX, look.accent, [.32,.48,.023], [0,1.19,.156]); // apron
    break;
  case 1:
    for (const side of [-1,1]) a(outfit, BOX, look.accent, [.088,.43,.028], [side*.155,1.22,.161]); // vest
    break;
  case 2:
    a(outfit, BOX, look.accent, [.45,.10,.09], [0,1.57,.075]); // scarf
    break;
  case 3:
    for (const side of [-1,1]) a(outfit, BOX, look.accent, [.12,.54,.027], [side*.19,1.22,.154]); // jacket
    break;
  case 4:
    a(outfit, BOX, look.accent, [.45,.11,.024], [0,1.27,.158]); // broad stripe
    break;
  case 5:
    a(outfit, BOX, look.accent, [.12,.58,.032], [0,1.24,.166]).rotation.z=-.60; // sash
    break;
  default:
    for (const y of [1.10,1.28,1.43]) a(outfit, BALL, look.accent, [.028,.028,.024], [0,y,.17]); // buttons
  }
  p.group.userData.residentAppearance = { ...look, identity: String(identity) };
  return p;
}
