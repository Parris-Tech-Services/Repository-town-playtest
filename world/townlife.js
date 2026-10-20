import * as THREE from 'three';
import { Builder, GLASS } from './builder.js';
import { makePerson, pose } from './npcs.js';
import { TownLife, GOODS, RAIL_Z, trainX, FIELD_Z0, FIELD_Z1, SEC_PER_MIN, LOT_X } from './life.js';

// Draws the town simulation (src/world/life.js): the high street and farms on street 8,
// fields, livestock, the freight train, delivery trucks, villagers, doorstep parcels and
// the sky's day–night cycle. The simulation decides; this file only shows it.

const LOT8_Z = 7 * 46 - 3.5 * 46;          // centre z of the street-8 lots
const WOOD = 0x8a6545, DARK = 0x33363b, WHITE = 0xf2efe6, RED = 0xb8413a, ROOF = 0x5b6670;
const STORE = 'repository-town.life.v1';

// ── Goods on display ──────────────────────────────────────────────────────
// One instanced mesh per display; its visible count follows the stock.
const GOOD_GEO = {
  bread: [new THREE.BoxGeometry(0.34, 0.16, 0.18), [0xc98b4a, 0xb7773a, 0xd8a060]],
  pie: [new THREE.CylinderGeometry(0.15, 0.15, 0.08, 10), [0xd9a05b, 0xc88c48]],
  veg: [new THREE.SphereGeometry(0.13, 8, 6), [0x5aa040, 0xe07a2a, 0xc23b2b, 0x7a3f8a, 0x8fbf3a]],
  fruit: [new THREE.SphereGeometry(0.11, 8, 6), [0xc8302a, 0xf2c23a, 0xf28a2a, 0x9bc93a]],
  eggs: [new THREE.BoxGeometry(0.3, 0.09, 0.14), [0xf3ead8, 0xe8d9bf]],
  milk: [new THREE.CylinderGeometry(0.06, 0.06, 0.26, 8), [0xfafafa]],
  lamb: [new THREE.BoxGeometry(0.24, 0.09, 0.17), [0xb5414a, 0xc45a5a]],
  wool: [new THREE.BoxGeometry(0.34, 0.22, 0.28), [0xe9e1cf, 0xf2eee4]],
  hay: [new THREE.BoxGeometry(0.34, 0.2, 0.24), [0xc6a44b, 0xd4b65a]],
  coffee: [new THREE.BoxGeometry(0.2, 0.3, 0.12), [0x5a3a24, 0x6a4430]],
  tea: [new THREE.CylinderGeometry(0.08, 0.08, 0.18, 8), [0x2f7a5a, 0x7a2f3a, 0x2f4a7a]],
  grain: [new THREE.SphereGeometry(0.28, 8, 6), [0xc8a860, 0xbf9f55]],
  flour: [new THREE.SphereGeometry(0.28, 8, 6), [0xf0ece0, 0xe6e0d0]],
  parcel: [new THREE.BoxGeometry(0.36, 0.26, 0.3), [0xb08a5a, 0xa47c4c, 0xc29a68]],
};
GOOD_GEO.grain[0].scale(1, 0.7, 0.8); GOOD_GEO.flour[0].scale(1, 0.7, 0.8);
const goodMat = new THREE.MeshLambertMaterial({ color: 0xffffff });

function display(parent, good, slots, readStock, full) {
  const [geo, colours] = GOOD_GEO[good];
  const mesh = new THREE.InstancedMesh(geo, goodMat, slots.length);
  const m = new THREE.Matrix4(), c = new THREE.Color();
  slots.forEach((s, i) => { m.makeRotationY(s.r || 0).setPosition(s.x, s.y, s.z); mesh.setMatrixAt(i, m); mesh.setColorAt(i, c.set(colours[i % colours.length])); });
  parent.add(mesh);
  return { mesh, update() { const n = readStock() || 0; mesh.count = n <= 0 ? 0 : Math.max(1, Math.min(slots.length, Math.round((n / (full || slots.length)) * slots.length))); } };
}
// Rows of items on a table top or in crates: w × d area centred on (x, z) at height y.
function grid(x, y, z, w, d, cols, rows, layers = 1, lift = 0.1) {
  const out = [];
  for (let l = 0; l < layers; l++) for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) out.push({ x: x - w / 2 + (i + 0.5) * (w / cols), y: y + l * lift, z: z - d / 2 + (j + 0.5) * (d / rows), r: ((i * 7 + j * 3) % 5) * 0.2 });
  return out;
}

// ── Buildings ─────────────────────────────────────────────────────────────
// Every building is authored in its lot's frame: street side +z, front wall at z = +7.
function shopfront(b, w, d, h, wall, trim, stripes) {
  b.box(wall, w, h, d, 0, h / 2, 7 - d / 2);
  b.box(trim, w + 0.4, 0.6, d + 0.4, 0, h + 0.3, 7 - d / 2);
  for (const x of [-w * 0.28, w * 0.28]) { b.box(GLASS, w * 0.32, 1.9, 0.08, x, 1.65, 7.04); b.box(trim, w * 0.34, 0.12, 0.14, x, 0.65, 7.06); }
  b.box(0x3a2a1e, 1.5, 2.4, 0.06, 0, 1.2, 7.04);
  b.box(0x22252a, w * 0.62, 0.8, 0.12, 0, h - 0.55, 7.08);
  if (stripes) { const n = Math.round(w / 1.2); for (let i = 0; i < n; i++) b.add('box', stripes[i % 2], w / n, 0.08, 2.0, -w / 2 + (i + 0.5) * (w / n), 3.05, 7.95, 0.35, 0, 0); }
}
function table(b, x, z, w = 2.4, d = 0.9, top = WOOD) {
  b.solid(w, d, x, z);
  b.block(top, w, 0.08, d, x, 0.82, z);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.block(0x5a4030, 0.08, 0.82, 0.08, x + sx * (w / 2 - 0.1), 0, z + sz * (d / 2 - 0.1));
}
function crate(b, x, z, w = 0.9, d = 0.6, y = 0) { b.solid(w, d, x, z); b.block(0x9a7448, w, 0.3, d, x, y, z); }
function shed(b, w, d, h, wall, roof, z0 = 7) {
  b.box(wall, w, h, d, 0, h / 2, z0 - d / 2);
  const r = Math.hypot(w / 2 + 0.4, 1.6), ang = Math.atan2(1.6, w / 2 + 0.4);
  b.add('box', roof, r, 0.15, d + 0.8, -(w / 2 + 0.4) / 2, h + 0.8, z0 - d / 2, 0, 0, ang);
  b.add('box', roof, r, 0.15, d + 0.8, (w / 2 + 0.4) / 2, h + 0.8, z0 - d / 2, 0, 0, -ang);
  b.box(0x3a2a1e, 2.6, 2.8, 0.06, 0, 1.4, z0 + 0.03);
}
function tree(b, x, z, s = 1, leaf = 0x4e8a46) { b.solid(0.6 * s, 0.6 * s, x, z); b.cyl(0x6a4a2a, 0.22 * s, 2.4 * s, x, 1.2 * s, z); b.ball(leaf, 1.5 * s, x, 3.2 * s, z); }
function fence(b, x0, x1, z0, z1, gateX) {
  const rail = (ax, az, bx, bz) => { b.solid(Math.max(0.3, Math.abs(bx - ax)), Math.max(0.3, Math.abs(bz - az)), (ax + bx) / 2, (az + bz) / 2); const len = Math.hypot(bx - ax, bz - az), ry = Math.atan2(bx - ax, bz - az) + Math.PI / 2; for (const y of [0.45, 0.9]) b.box(0xd8cdb8, len, 0.08, 0.06, (ax + bx) / 2, y, (az + bz) / 2, ry); for (let s = 0; s <= len; s += 2.5) b.block(0xc8bca5, 0.1, 1.05, 0.1, ax + (bx - ax) * (s / len), 0, az + (bz - az) * (s / len)); };
  rail(x0, z1, x1, z1); rail(x0, z0, x0, z1); rail(x1, z0, x1, z1);
  if (gateX === undefined) rail(x0, z0, x1, z0); else { rail(x0, z0, gateX - 1.6, z0); rail(gateX + 1.6, z0, x1, z0); }
}

// Returns { w, d } of the solid front block so the town can collide with it.
const BUILD = {
  store(b) { shopfront(b, 14, 10, 5, 0xd9c8a0, 0x6a4a2e, [0x2f6b8c, WHITE]); table(b, -4.2, 8.6); table(b, 4.2, 8.6); return { w: 14, d: 10 }; },
  bakery(b) { shopfront(b, 12, 9, 4.6, 0xf0dcc0, 0x8a5a2a, [0xc8553d, 0xf2e2c2]); table(b, -3.6, 8.6); table(b, 3.6, 8.6); b.cyl(0x9a958c, 0.45, 2.2, 4.5, 5.6, 0.5); return { w: 12, d: 9 }; },
  cafe(b) {
    shopfront(b, 12, 9, 4.4, 0x2f5a4a, 0xe8d8b8, [0x2f5a4a, 0xe8d8b8]);
    for (const [x, z] of [[-4, 9.4], [4, 9.4]]) { b.cyl(WHITE, 0.5, 0.06, x, 0.78, z); b.cyl(DARK, 0.05, 0.78, x, 0.39, z); b.cyl(0xd04848, 0.05, 2.4, x, 1.2, z); b.cone(0xe86a4a, 1.5, 0.6, x, 2.5, z); for (const s of [-1, 1]) b.block(0x6a4a2e, 0.4, 0.45, 0.4, x + s * 0.8, 0, z); }
    return { w: 12, d: 9 };
  },
  greengrocer(b) {
    shopfront(b, 12, 9, 4.4, 0xe8e0c8, 0x3f7a3a, [0x3f7a3a, 0xf2efe6]);
    for (const x of [-4.2, -3.1, 3.1, 4.2]) for (const [z, y] of [[8.2, 0.55], [8.9, 0.25]]) { crate(b, x, z, 1.0, 0.65, y - 0.25); b.block(0x6a5030, 1.0, y - 0.25, 0.6, x, 0, z); }
    return { w: 12, d: 9 };
  },
  butcher(b) {
    shopfront(b, 11, 9, 4.4, 0xf2f2f2, 0xb8413a, [0xb8413a, WHITE]);
    for (const x of [-3.4, 3.4]) { b.block(0xe8e8e8, 2.4, 0.9, 0.9, x, 0, 8.4); b.box(GLASS, 2.4, 0.4, 0.9, x, 1.1, 8.4); }
    return { w: 11, d: 9 };
  },
  pub(b) {
    b.box(0x7a4a3a, 14, 7, 11, 0, 3.5, 1.5); b.box(0x3a2a22, 14.6, 0.8, 11.6, 0, 7.4, 1.5);
    for (let f = 0; f < 2; f++) for (const x of [-4.5, -1.6, 1.6, 4.5]) if (!(f === 0 && Math.abs(x) < 2)) b.box(GLASS, 1.2, 1.4, 0.08, x, 1.6 + f * 3.1, 7.04);
    b.box(0x2a1e18, 1.6, 2.5, 0.06, 0, 1.25, 7.04);
    b.block(DARK, 0.1, 3.4, 0.1, 6.4, 0, 8.2); b.box(DARK, 1.2, 0.08, 0.08, 5.9, 3.3, 8.2); b.box(0x2f5a3a, 0.9, 1.1, 0.08, 5.6, 2.6, 8.2);
    for (const x of [-5.2, -4.4]) b.cyl(0x7a5030, 0.4, 0.95, x, 0.48, 8.0);
    for (const x of [-2.8, 3.2]) { b.block(WOOD, 1.8, 0.08, 0.8, x, 0.75, 9.6); b.block(WOOD, 1.8, 0.45, 0.3, x, 0, 9.0); b.block(WOOD, 1.8, 0.45, 0.3, x, 0, 10.2); }
    return { w: 14, d: 11 };
  },
  post(b) {
    shopfront(b, 11, 9, 4.6, 0xe8d2b0, 0xb8413a, null);
    b.block(RED, 0.6, 1.2, 0.5, 4.6, 0, 8.2); b.ball(RED, 0.3, 4.6, 1.2, 8.2); b.box(DARK, 0.4, 0.05, 0.05, 4.6, 1.0, 8.47);
    return { w: 11, d: 9 };
  },
  hall(b) {
    b.box(0xd8d2c4, 18, 7, 12, 0, 3.5, 1); b.box(0xb8b2a4, 19, 0.8, 13, 0, 7.4, 1);
    for (let i = 0; i < 6; i++) b.cyl(WHITE, 0.35, 6.4, -6.25 + i * 2.5, 3.2, 7.6);
    b.box(0xc8c2b4, 16, 0.3, 2.4, 0, 0.15, 8.0); b.pyramid(0xb8b2a4, 16, 2.2, 3, 0, 8.9, 7.4);
    b.box(0xd8d2c4, 4, 6, 4, 0, 10.8, 1); b.pyramid(0x4a5560, 4.6, 3, 4.6, 0, 15.3, 1);
    b.box(0x2a1e18, 2.2, 3.2, 0.06, 0, 1.6, 7.05);
    for (const x of [-6, -3, 3, 6]) b.box(GLASS, 1.2, 2.2, 0.08, x, 2.0, 7.05);
    return { w: 18, d: 12 };
  },
  school(b) {
    b.box(0xd89a6a, 18, 5, 10, 0, 2.5, 2); b.box(0x8a3a2a, 18.6, 0.6, 11, 0, 5.3, 2);
    for (let i = 0; i < 6; i++) if (i !== 2 && i !== 3) b.box(GLASS, 1.6, 1.6, 0.08, -7.2 + i * 2.9, 2.2, 7.04);
    b.box(0x2a3a5a, 2.4, 2.6, 0.06, 0, 1.3, 7.04);
    b.block(0xb0b0b0, 0.12, 9, 0.12, 7.5, 0, 9); b.box(0x2f5aa8, 1.6, 1.0, 0.04, 8.3, 8.3, 9);
    for (const x of [-5.5, -3.5]) b.add('box', DARK, 0.08, 2.6, 0.08, x, 1.3, -6, 0, 0, 0); b.box(DARK, 2.2, 0.08, 0.08, -4.5, 2.6, -6);
    return { w: 18, d: 10 };
  },
  clinic(b) {
    shopfront(b, 12, 9, 4.6, WHITE, 0x7ab0c8, null);
    b.box(0xd03030, 1.4, 0.4, 0.06, 0, 4.0, 7.12); b.box(0xd03030, 0.4, 1.4, 0.06, 0, 4.0, 7.12);
    return { w: 12, d: 9 };
  },
  depot(b) {
    b.box(0xb88a5a, 14, 5, 8, 0, 2.5, 3); b.box(0x4a3a2a, 16, 0.4, 10, 0, 5.2, 3);
    b.box(0x2a1e18, 2, 2.6, 0.06, 0, 1.3, 7.04); for (const x of [-4.5, 4.5]) b.box(GLASS, 1.6, 1.6, 0.08, x, 2, 7.04);
    // The platform runs behind, along the railway line.
    b.box(0xb8b0a0, 24, 0.9, 3, 0, 0.45, RAIL_Z - LOT8_Z + 3.4); b.box(0x8a6545, 10, 0.2, 2.6, 0, 3.2, RAIL_Z - LOT8_Z + 3.4);
    for (const x of [-4.5, 4.5]) b.block(0x8a6545, 0.2, 2.3, 0.2, x, 0.9, RAIL_Z - LOT8_Z + 4.4);
    return { w: 14, d: 8 };
  },
  mill(b) {
    b.cyl(0xe8e0d0, 3, 10, 0, 5, 1); b.cone(0x5a4a3a, 3.4, 3, 0, 11.5, 1);
    b.box(0x2a1e18, 1.6, 2.4, 0.06, 0, 1.2, 4.0);
    b.box(0xc8bca5, 6, 3, 4, 6, 1.5, 4.5); b.box(0x7a6a5a, 6.4, 0.2, 4.4, 6, 3.1, 4.5);
    return { w: 7, d: 6, front: 4 };
  },
  farmhouse(b) {
    b.box(0xf0e6d0, 13, 4, 9, 0, 2, 2.5); const r = 7.2;
    b.add('box', 0x8a3a2a, r, 0.15, 10, -3.3, 5.3, 2.5, 0, 0, 0.5); b.add('box', 0x8a3a2a, r, 0.15, 10, 3.3, 5.3, 2.5, 0, 0, -0.5);
    b.box(0x9a8a72, 13, 0.15, 2.2, 0, 3, 8.1); for (const x of [-6, -2, 2, 6]) b.cyl(WHITE, 0.1, 3, x, 1.5, 9);
    for (const x of [-4, 4]) b.box(GLASS, 1.4, 1.4, 0.08, x, 1.8, 7.04); b.box(0x3a2a1e, 1.4, 2.4, 0.06, 0, 1.2, 7.04);
    b.cyl(0x8a8a8a, 1.6, 0.4, 8.5, 9, -4); b.block(0x9a958c, 0.25, 9, 0.25, 8.5, 0, -4);
    return { w: 13, d: 9, front: 7 };
  },
  square(b) {
    b.box(0xc9c0ac, 24, 0.05, 30, 0, 0.03, -4);
    b.cyl(0xbab6ae, 2.6, 0.7, 0, 0.35, -4); b.cyl(0x6fb8e0, 2.3, 0.1, 0, 0.66, -4); b.cyl(0xbab6ae, 0.35, 2, 0, 1, -4); b.ball(0xbab6ae, 0.6, 0, 2.1, -4);
    for (const [x, z, r] of [[-6, -4, Math.PI / 2], [6, -4, -Math.PI / 2], [0, 3, Math.PI], [0, -11, 0]]) b.at(x, 0, z, r, () => { b.solid(2, 0.7, 0, 0); b.block(WOOD, 2, 0.08, 0.6, 0, 0.45, 0); b.block(WOOD, 2, 0.5, 0.08, 0, 0.5, -0.3); b.block(DARK, 0.1, 0.45, 0.5, -0.9, 0, 0); b.block(DARK, 0.1, 0.45, 0.5, 0.9, 0, 0); });
    for (const [x, z] of [[-9, -14], [9, -14], [-9, 5], [9, 5], [-9, -4.5], [9, -4.5]]) tree(b, x, z, 1.1, 0x5a9a50);
    // Saturday-style market stalls along the back.
    for (const [x, c] of [[-5, 0xd85a4a], [0, 0x3a7ab8], [5, 0xe0b040]]) { b.solid(3, 1.2, x, -15); b.block(WOOD, 3, 0.9, 1.2, x, 0, -15); b.box(c, 3.4, 0.08, 1.8, x, 2.4, -15); for (const sx of [-1.5, 1.5]) b.block(DARK, 0.08, 2.4, 0.08, x + sx, 0, -14.4); }
    return null;
  },
};
// Civic sites across the road (authored like the rest: street side +z, front wall at z = +7).
Object.assign(BUILD, {
  hotel(b) {
    // Road-facing south-side hotel: two floors, reception, guest-room windows.
    b.box(0xd9b894,14,7,10,0,3.5,2);
    b.box(0x774b36,15,0.6,11,0,7.3,2);
    b.box(0x8b6549,15.2,0.25,11.2,0,7.65,2);
    for(const y of [2.2,5.2])for(const x of [-5,-2.8,2.8,5])
      b.box(GLASS,1.3,1.6,0.08,x,y,7.05);
    b.box(0x4e3528,2.2,2.7,0.08,0,1.35,7.08);
    b.box(0xf3dfb1,4.6,0.55,0.14,0,4.0,7.17);
    b.box(0x816044,2.5,0.17,1.7,0,0.15,8.0);
    return {w:14,d:10};
  },
  bank(b) {
    b.box(0xd8d0c0, 14, 6, 10, 0, 3, 2); b.box(0xa89a80, 15, 0.6, 11, 0, 6.3, 2);
    for (let i = 0; i < 4; i++) b.cyl(WHITE, 0.3, 5.2, -4.5 + i * 3, 2.6, 7.5);
    b.box(0x8a7a60, 13, 0.3, 2, 0, 0.15, 7.8); b.box(0x2a1e18, 1.8, 2.8, 0.06, 0, 1.4, 7.05);
    for (const x of [-5, 5]) b.box(GLASS, 1.4, 2, 0.08, x, 2.2, 7.05);
    return { w: 14, d: 10 };
  },
  power(b) {
    b.box(0x8a9098, 12, 6, 10, -2, 3, 2); b.cyl(0x6a6a70, 0.7, 14, -6, 7, 0); b.cyl(0xc8c4bc, 2.4, 9, 5, 4.5, 0);
    for (let i = 0; i < 6; i++) b.add('box', 0x23324a, 2.2, 0.08, 1.4, -6 + i * 2.4, 0.9, -5.5, -0.5, 0, 0);
    b.box(0x2a2a2a, 2, 2.6, 0.06, -2, 1.3, 7.05); b.box(0xe8c23a, 3, 0.4, 0.06, -2, 3.3, 7.05);
    return { w: 14, d: 10 };
  },
  waterworks(b) {
    b.cyl(0x8ab0c8, 4, 6, 3, 3, -1); b.cone(0x6a8aa8, 4.3, 1.2, 3, 6.6, -1); b.box(0xc8c0b0, 6, 3.5, 5, -4, 1.75, 3);
    b.box(0x2a2a2a, 1.4, 2.4, 0.06, -4, 1.2, 5.55); b.cyl(0x5a7a9a, 0.3, 4, -1, 2, 5);
    return { w: 14, d: 10 };
  },
  sewage(b) {
    for (const [x, z] of [[-3.5, 0], [3.5, 0]]) { b.cyl(0x9a9a92, 3, 1.2, x, 0.6, z); b.cyl(0x5a6a4a, 2.7, 0.05, x, 1.2, z); }
    b.box(0xb8b0a0, 5, 3, 4, 0, 1.5, 5); b.box(0x2a2a2a, 1.4, 2.2, 0.06, 0, 1.1, 7.05);
    return { w: 13, d: 8 };
  },
  fire(b) {
    b.box(0xb83a32, 13, 6, 10, 0, 3, 2); b.box(0x7a2a24, 13.6, 0.5, 10.6, 0, 6.25, 2);
    for (const x of [-3.2, 3.2]) { b.box(0xe8e4dc, 4.6, 4.2, 0.06, x, 2.1, 7.05); for (let i = 1; i < 5; i++) b.box(0xb0aca4, 4.6, 0.06, 0.08, x, i * 0.85, 7.08); }
    b.cyl(0xb83a32, 1.2, 9, 6.5, 4.5, -2); b.box(0xd0d0d0, 2.6, 0.5, 0.06, 0, 5.3, 7.06);
    return { w: 14, d: 10 };
  },
  recycling(b) {
    shed(b, 12, 8, 4, 0x6a9a5a, 0x4a5a4a);
    for (let i = 0; i < 4; i++) b.block([0x3a7ab8, 0xe0b040, 0x5aa040, 0xb8413a][i], 1.4, 1.3, 1.1, -4.5 + i * 3, 0, 8.4);
    return { w: 12, d: 8 };
  },
  landfill(b) {
    for (const [x, z, r] of [[-3, -1, 3.2], [3, 0, 2.6]]) b.ball(0x7a6a50, r, x, 0, z, 0.45);
    b.box(0xb8b0a0, 4, 2.6, 3, 0, 1.3, 5.2); fence(b, -6.5, 6.5, -6, 6.6);
    return { w: 13, d: 12 };
  },
  foundry(b) {
    b.box(0x6a5a50, 14, 7, 10, 0, 3.5, 2); b.box(0x4a4a4a, 14.6, 0.5, 10.6, 0, 7.25, 2);
    for (const x of [-4, 3]) b.cyl(0x4a4040, 0.6, 12, x, 6, -1);
    b.box(0x2a2a2a, 4, 4, 0.06, 0, 2, 7.05); b.box(0xff8a3a, 3.6, 0.3, 0.07, 0, 4.3, 7.06);
    return { w: 14, d: 10 };
  },
});

// Farm sheds on the lots, with the paddocks across the road.
const FARM_SHED = {
  sheep: [16, 9, 4, 0xa8a8a0, 0x7a8590], dairy: [16, 10, 4.2, WHITE, 0x5b6670], coop: [10, 7, 3, 0xd8c8a0, 0x8a5a3a],
  orchard: [12, 8, 3.6, 0xc8a878, 0x6a5040], garden: [10, 7, 3.2, 0x8aa070, 0x5a6a50], silo: [14, 10, 5, 0xa83a2a, 0x5a5a5a],
};

// What each farm grows in its field.
function buildField(p, group, statics, glass, life) {
  const f = p.field, cx = (f.x0 + f.x1) / 2, cz = (f.z0 + f.z1) / 2, w = f.x1 - f.x0, d = f.z1 - f.z0;
  const b = statics;
  b.box(0x7a5a3a, w, 0.03, d, cx, 0.015, cz);            // tilled soil or pasture base
  const dyn = { update() {} };
  if (p.id === 'silo' || p.id === 'garden') {
    const rows = p.id === 'silo' ? 10 : 8, per = p.id === 'silo' ? 1 : 14;
    const geo = p.id === 'silo' ? new THREE.BoxGeometry(w - 2, 1, 1.4) : new THREE.SphereGeometry(0.32, 8, 6);
    geo.translate(0, 0.5, 0);
    const mat = new THREE.MeshLambertMaterial({ color: 0xffffff });
    const crop = new THREE.InstancedMesh(geo, mat, rows * per);
    const m = new THREE.Matrix4(), c = new THREE.Color();
    const veg = [0x4f9a3a, 0x6fb84a, 0x3a7a3a, 0x8a5aa0, 0xe07a2a];
    for (let j = 0, k = 0; j < rows; j++) for (let i = 0; i < per; i++, k++) {
      m.makeTranslation(per === 1 ? cx : f.x0 + 1.4 + i * ((w - 2.8) / (per - 1)), 0.02, f.z0 + 2 + j * ((d - 4) / (rows - 1)));
      crop.setMatrixAt(k, m); crop.setColorAt(k, c.set(p.id === 'silo' ? 0xffffff : veg[j % veg.length]));
    }
    group.add(crop);
    const green = new THREE.Color(0x6aa83a), gold = new THREE.Color(0xe0c060);
    dyn.update = () => {
      const g = p.growth;
      crop.scale.y = p.id === 'silo' ? 0.1 + g * 1.0 : 0.3 + g * 0.9;
      if (p.id === 'silo') mat.color.copy(green).lerp(gold, Math.max(0, (g - 0.5) * 2));
    };
    if (p.id === 'garden') { for (let i = 0; i < 2; i++) b.block(0x6a8a5a, 0.3, 0.3, d - 3, f.x0 + 3 + i * (w - 6), 0, cz); }
  } else if (p.id === 'orchard') {
    b.box(0x5f9a4a, w, 0.03, d, cx, 0.02, cz);
    const trees = [];
    for (let j = 0; j < 4; j++) for (let i = 0; i < 4; i++) { const x = f.x0 + 2.8 + i * ((w - 5.6) / 3), z = f.z0 + 3 + j * ((d - 6) / 3); tree(b, x, z, 0.8, 0x3f7a3a); trees.push({ x, z }); }
    const slots = trees.flatMap((t, ti) => Array.from({ length: 7 }, (_, k) => ({ x: t.x + Math.cos(k * 0.9 + ti) * 1.0, y: 2.2 + (k % 3) * 0.45, z: t.z + Math.sin(k * 0.9 + ti) * 1.0 })));
    const fruit = display(group, 'fruit', slots, () => Math.round(p.growth * 100), 100);
    dyn.update = () => fruit.update();
  } else {
    // Livestock paddocks: pasture, a fence with a gate on the road side, a trough.
    b.box(0x6fae58, w, 0.03, d, cx, 0.02, cz);
    fence(b, f.x0 + 0.5, f.x1 - 0.5, f.z0 + 0.5, f.z1 - 0.5, cx);
    b.solid(2.4, 0.7, cx + 6, f.z1 - 3); b.block(0x8a8a8a, 2.4, 0.5, 0.7, cx + 6, 0, f.z1 - 3);
    const kind = { sheep: { n: 12, body: [0.9, 0.62, 1.2], bodyC: 0xf2efe6, head: 0x2a2420, y: 0.62 }, dairy: { n: 7, body: [1.1, 1.0, 2.0], bodyC: 0xf5f2ea, head: 0x2a2420, y: 1.0 }, coop: { n: 16, body: [0.3, 0.3, 0.38], bodyC: 0xa8582a, head: 0xd83a2a, y: 0.3 } }[p.id];
    if (p.id === 'coop') b.at(cx - 6, 0, f.z1 - 4, 0, () => { b.solid(3, 2.2, 0, 0); b.block(0xc89a5a, 3, 1.8, 2.2, 0, 0.4, 0); b.pyramid(0x8a4a2a, 3.6, 1, 2.8, 0, 2.7, 0); for (const sx of [-1.2, 1.2]) b.block(DARK, 0.12, 0.4, 0.12, sx, 0, 0); });
    const bodyGeo = new THREE.SphereGeometry(0.5, 10, 7), headGeo = new THREE.SphereGeometry(0.5, 8, 6);
    const bodies = new THREE.InstancedMesh(bodyGeo, new THREE.MeshLambertMaterial({ color: kind.bodyC }), kind.n);
    const heads = new THREE.InstancedMesh(headGeo, new THREE.MeshLambertMaterial({ color: kind.head }), kind.n);
    const patches = p.id === 'dairy' ? new THREE.InstancedMesh(new THREE.SphereGeometry(0.5, 6, 5), new THREE.MeshLambertMaterial({ color: 0x1d1d1d }), kind.n) : null;
    group.add(bodies, heads); if (patches) group.add(patches);
    const herd = Array.from({ length: kind.n }, (_, i) => ({ x: f.x0 + 2 + ((i * 37) % 17) / 17 * (w - 4), z: f.z0 + 2 + ((i * 53) % 13) / 13 * (d - 4), h: i, tx: 0, tz: 0, wait: i % 4 }));
    const animalRecords = life.civic.livestock?.herds?.[p.id]?.animals;
    const bodyColor = new THREE.Color();
    const poorCondition = new THREE.Color(0xb85b4a);
    const m = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(), v = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0);
    const place = (a, t) => {
      const bob = p.id === 'coop' && a.wait > 0 ? Math.max(0, Math.sin(t * 9 + a.h)) * 0.12 : 0;
      q.setFromAxisAngle(up, a.h);
      m.compose(v.set(a.x, kind.y, a.z), q, s.set(...kind.body)); bodies.setMatrixAt(a.i, m);
      const hx = Math.sin(a.h) * kind.body[2] * 0.55, hz = Math.cos(a.h) * kind.body[2] * 0.55;
      m.compose(v.set(a.x + hx, kind.y + kind.body[1] * 0.3 - bob * 3, a.z + hz), q, s.set(kind.body[0] * 0.5, kind.body[1] * 0.55, kind.body[0] * 0.55)); heads.setMatrixAt(a.i, m);
      if (patches) { m.compose(v.set(a.x + 0.2, kind.y + 0.25, a.z - 0.2), q, s.set(0.7, 0.6, 0.9)); patches.setMatrixAt(a.i, m); }
    };
    herd.forEach((a, i) => { a.i = i; a.tx = a.x; a.tz = a.z; place(a, 0); });
    const speed = p.id === 'coop' ? 0.8 : 0.35;
    dyn.update = (dt, t, near) => {
      if (!near) return;
      for (const a of herd) {
        const animal = animalRecords?.[a.i];
        if (animal) bodies.setColorAt(a.i, bodyColor.setHex(kind.bodyC).lerp(poorCondition, 1 - animal.health / 100));
        if (a.wait > 0) a.wait -= dt;
        else {
          const dx = a.tx - a.x, dz = a.tz - a.z, dd = Math.hypot(dx, dz);
          if (dd < 0.2) { a.tx = f.x0 + 2 + Math.random() * (w - 4); a.tz = f.z0 + 2 + Math.random() * (d - 4); a.wait = 2 + Math.random() * 8; }
          else { a.x += (dx / dd) * speed * dt; a.z += (dz / dd) * speed * dt; a.h = Math.atan2(dx, dz); }
        }
        place(a, t);
      }
      bodies.instanceMatrix.needsUpdate = true; if (animalRecords) bodies.instanceColor.needsUpdate = true;
      heads.instanceMatrix.needsUpdate = true; if (patches) patches.instanceMatrix.needsUpdate = true;
    };
  }
  return dyn;
}

// ── Vehicles ──────────────────────────────────────────────────────────────
const lightMat = new THREE.MeshLambertMaterial({ color: 0xfff6d8, emissive: 0xfff0c0, emissiveIntensity: 0 });
const tailMat = new THREE.MeshLambertMaterial({ color: 0x8a1a1a, emissive: 0xff2a1a, emissiveIntensity: 0 });
function makeTruck(colour) {
  const b = new Builder();
  b.block(colour, 2.1, 1.6, 2.0, 0, 0.55, 2.2);                    // cab, facing +z
  b.box(GLASS, 1.9, 0.7, 0.06, 0, 1.75, 3.21);
  b.block(0x5a5f66, 2.2, 0.25, 4.4, 0, 0.6, -1.2);                   // tray
  for (const x of [-1.08, 1.08]) b.block(0x5a5f66, 0.06, 0.5, 4.4, x, 0.85, -1.2);
  b.block(0x5a5f66, 2.2, 0.5, 0.06, 0, 0.85, -3.38);
  for (const z of [2.2, -0.4, -2.4]) for (const x of [-1.05, 1.05]) b.cyl(0x1d1d1d, 0.42, 0.3, x, 0.42, z, 0, Math.PI / 2);
  const g = b.build();
  const lights = new THREE.Mesh(new THREE.BoxGeometry(1.7, 0.2, 0.05), lightMat); lights.position.set(0, 1.0, 3.22); g.add(lights);
  const tails = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.15, 0.05), tailMat.clone()); tails.position.set(0, 0.9, -3.42); g.add(tails);
  const load = new THREE.InstancedMesh(new THREE.BoxGeometry(0.85, 0.6, 0.85), new THREE.MeshLambertMaterial({ color: 0x9a7448 }), 10);
  const m = new THREE.Matrix4();
  for (let i = 0; i < 10; i++) { m.makeTranslation(-0.48 + (i % 2) * 0.96, 1.15 + Math.floor(i / 6) * 0.62, 0.6 - Math.floor((i % 6) / 2) * 1.0 - (i >= 6 ? 0.5 : 0)); load.setMatrixAt(i, m); }
  load.count = 0; g.add(load);
  return { group: g, load, tails };
}
function makeTrain() {
  const b = new Builder();
  b.block(0x2a5a3a, 10, 3, 2.8, 0, 0.6, 0); b.box(0x1d1d1d, 2.6, 1.4, 2.4, 4.0, 4.3, 0); b.cyl(0x1d1d1d, 0.35, 1, -3.5, 4.1, 0);
  for (let i = 0; i < 4; i++) { const x = -11.5 - i * 11; b.block([0x8a4a2a, 0x5a6a7a, 0x8a7a4a, 0x6a3a3a][i], 10, 2.6, 2.8, x, 0.6, 0); }
  for (let x = 4; x > -56; x -= 2.5) for (const z of [-1.1, 1.1]) b.cyl(0x1d1d1d, 0.45, 0.25, x, 0.45, z, Math.PI / 2);
  return b.build();
}
// A simple bicycle for villagers riding across town.
function makeBike() {
  const b = new Builder();
  for (const z of [-0.55, 0.55]) b.add('torus', 0x1d1d1d, 0.68, 0.68, 0.68, 0, 0.34, z, 0, Math.PI / 2, 0); // wheels upright, along +z
  b.box(0x2f6bb8, 0.06, 0.06, 1.0, 0, 0.62, 0); b.box(0x2f6bb8, 0.06, 0.5, 0.06, 0, 0.6, -0.15); b.box(0x2a2a2a, 0.5, 0.05, 0.05, 0, 0.98, 0.5);
  return b.build();
}

// Shirts by job, so a baker looks like a baker from across the street.
const UNIFORM = { farmer: 0x5b7a3a, 'dairy hand': 0x3a6a8a, 'poultry keeper': 0x8a6a3a, shearer: 0x6a5a4a, miller: 0xd8d0c0, baker: 0xf4f0e8, barista: 0x2f5a4a, cook: 0xf4f0e8,
  grocer: 0x3f7a3a, shopkeeper: 0x2f6b8c, butcher: 0xb8413a, publican: 0x5a3a2a, postie: 0xc83a2a, 'truck driver': 0xe88a2a, teacher: 0x7a4a8a, nurse: 0x7ab0d8, mayor: 0x2a2a3a,
  'station master': 0x2a3a5a, programmer: 0x4a4a5a, retired: 0xa88a6a, student: 0x2f5aa8, artist: 0xd86a8a };

// ── Sky ───────────────────────────────────────────────────────────────────
const GREY = new THREE.Color(0x9aa3ad), DAY_SKY = new THREE.Color(0x96c9f0), NIGHT_SKY = new THREE.Color(0x0b1430), DUSK = new THREE.Color(0xf0a070);
function makeStars() {
  const n = 500, pos = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) { const a = Math.random() * Math.PI * 2, e = 0.15 + Math.random() * 1.3, r = 160; pos[i * 3] = Math.cos(a) * Math.cos(e) * r; pos[i * 3 + 1] = Math.sin(e) * r; pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * r; }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  return new THREE.Points(g, new THREE.PointsMaterial({ color: 0xffffff, size: 1.6, sizeAttenuation: false, fog: false, transparent: true, depthWrite: false }));
}

export function createTownLife({ scene, town, makeLabel, sky, hemi, sun, fog }) {
  const homes = [...town.lots.values()].map((l) => ({ coordinate: l.house.coordinate, name: l.house.name, door: { x: l.doorPos.x, z: l.doorPos.z } }));
  const life = new TownLife({ homes });
  let saved = null; try { saved = JSON.parse(localStorage.getItem(STORE)); } catch { /* blocked storage */ }
  // A save that is malformed or from a newer version is left untouched in storage rather than overwritten.
  let saveBlocked = false;
  if (saved) {
    if (saved.v === 1 && life.restore(saved.life)) life.speed = saved.speed || 1;
    else { saveBlocked = true; life.speed = 1; console.warn('[Repository Town] Saved town is unsupported or invalid; keeping it instead of overwriting it.'); }
  } else life.speed = 1;
  const save = () => { if (saveBlocked) return false; try { localStorage.setItem(STORE, JSON.stringify({ v: 1, life: life.snapshot(), speed: life.speed })); return true; } catch { return false; /* storage full or blocked */ } };

  const group = new THREE.Group(); town.group.add(group);
  const colliders = [], spots = [], displays = [], fields = [], labels = [];
  const statics = new Builder(); statics.glass = [];

  // Railway line behind street 8, with level crossings where it meets the avenues.
  const half = town.bounds.width / 2;
  for (const z of [RAIL_Z - 0.75, RAIL_Z + 0.75]) statics.box(0x6a6a70, half * 2 + 60, 0.12, 0.1, 0, 0.12, z);
  for (let x = -half - 30; x < half + 30; x += 1.4) statics.box(0x5a4030, 0.25, 0.08, 2.4, x, 0.05, RAIL_Z);
  statics.box(0x8a8478, half * 2 + 60, 0.03, 3.4, 0, 0.01, RAIL_Z);

  const shopGlassMat = new THREE.MeshLambertMaterial({ vertexColors: true, emissive: 0xffc070, emissiveIntensity: 0 });
  for (const p of life.places.values()) {
    // Each place builds its own mesh so its exterior shell can be hidden when the player is inside it.
    const pb = new Builder(); pb.glass = [];
    const b = pb;
    const kind = BUILD[p.id] ? p.id : p.kind === 'farm' ? 'farm' : p.kind === 'home' ? 'farmhouse' : p.kind === 'park' ? 'square' : p.id;
    let fp;
    // South-side civic sites face the street (−z) from across the road.
    if (p.side === 'south') {
      b.at(p.x, 0, FIELD_Z0 + 7, Math.PI, () => { fp = BUILD[p.id](b); });
      colliders.push({ x0: p.x - fp.w / 2, x1: p.x + fp.w / 2, z0: FIELD_Z0, z1: FIELD_Z0 + fp.d });
      // Keep the business name clear of the roofline and deep colonnades:
      // a freestanding, non-colliding sign just outside the south doorway.
      const sign = makeLabel(p.name, 'house');
      sign.position.set(p.x, 3.85, FIELD_Z0 - 4.6);
      group.add(sign); labels.push(sign);
      spots.push({ key: `place:${p.id}`, id: p.id, pos: new THREE.Vector3(p.x, 0, FIELD_Z0 - 2.4), label: `${p.name} — ${{ bank: 'your account', fire: 'station board', foundry: 'the works' }[p.id] || 'the plant'}` });
      const pMesh = pb.build(), pGlass = Builder.merge(pb.glass);
      if (pGlass) pMesh.add(new THREE.Mesh(pGlass, shopGlassMat));
      group.add(pMesh); colliders.push(...pb.solids); p.mesh = pMesh;
      continue;
    }
    b.at(p.x, 0, LOT8_Z, 0, () => {
      if (kind === 'farm') { const [w, d, h, wall, roof] = FARM_SHED[p.id]; shed(b, w, d, h, wall, roof); fp = { w, d }; if (p.id === 'silo') { for (const x of [9, 12]) { b.solid(2.6, 2.6, x, -1); b.cyl(0xc8c8c0, 1.4, 9, x, 4.5, -1); b.cone(0xa8a8a0, 1.6, 1.4, x, 9.7, -1); } } }
      else fp = BUILD[kind](b);
    });
    if (fp) colliders.push({ x0: p.x - fp.w / 2, x1: p.x + fp.w / 2, z0: LOT8_Z + (fp.front ?? 7) - fp.d, z1: LOT8_Z + (fp.front ?? 7) });
    if (kind === 'square') colliders.push({ x0: p.x - 2.7, x1: p.x + 2.7, z0: LOT8_Z - 6.7, z1: LOT8_Z - 1.3 });
    if (p.kind === 'farm' && p.makes !== 'grain') for (const x of [-6.2, -5.2, -4.2]) crate(pb, p.x + x, LOT8_Z + 8.4, 0.95, 1.0);
    const pMesh = pb.build(), pGlass = Builder.merge(pb.glass);
    if (pGlass) pMesh.add(new THREE.Mesh(pGlass, shopGlassMat));
    group.add(pMesh); colliders.push(...pb.solids); p.mesh = pMesh;
    // Name board over the door.
    // Place signs forward of awnings, pillars and the Town Hall portico,
    // rather than embedding the billboard behind the roof or facade.
    const sign = makeLabel(p.name, 'house');
    sign.position.set(p.x, kind === 'square' ? 3.2 : 3.85,
      LOT8_Z + (kind === 'square' ? 11 : 12.4));
    group.add(sign); labels.push(sign);
    // The place's counter: stand on the footpath in front and press E.
    spots.push({ key: `place:${p.id}`, id: p.id, pos: new THREE.Vector3(p.x, 0, LOT8_Z + 10.4), label: p.kind === 'farm' ? `${p.name} — see how it's farmed` : p.kind === 'park' ? 'Market Square notice board' : p.id === 'hall' ? 'Town Hall — the Town Ledger' : `${p.name} — ${p.kind === 'shop' || p.kind === 'cafe' || p.kind === 'pub' ? 'see what\'s on the shelves' : 'look inside'}` });
    // Field across the road.
    if (p.field) fields.push({ p, ...buildField(p, group, statics, statics.glass, life) });
    // Goods on display, following the stock.
    const add = (good, slots, read, full) => displays.push(display(pMesh, good, slots.map((s) => ({ ...s, x: s.x + p.x, z: s.z + LOT8_Z })), read, full));
    const st = (g) => () => p.stock[g], out = (g) => () => p.out[g];
    if (p.id === 'store') { add('eggs', grid(-4.8, 0.91, 8.6, 1.1, 0.7, 3, 3, 2), st('eggs'), 20); add('milk', grid(-3.6, 0.99, 8.6, 1.1, 0.7, 3, 3), st('milk'), 20); add('bread', grid(4.2, 0.95, 8.6, 2.2, 0.7, 5, 2), st('bread'), 10); add('flour', grid(-6.2, 0.18, 9.3, 0.6, 1.2, 1, 3, 2, 0.32), st('flour'), 10); add('coffee', grid(3.5, 1.25, 6.6, 2, 0.1, 6, 1), st('coffee'), 10); add('tea', grid(-3.5, 1.15, 6.6, 2, 0.1, 6, 1), st('tea'), 10); }
    if (p.id === 'bakery') { add('bread', grid(-3.6, 0.95, 8.6, 2.2, 0.7, 5, 3, 2, 0.16), out('bread'), 30); add('pie', grid(3.6, 0.9, 8.6, 2.2, 0.7, 5, 2), out('pie'), 12); add('flour', grid(-5.4, 0.18, 6.3, 0.1, 0.1, 1, 1).concat(grid(-5.4, 0.18, 5.6, 0.6, 1.2, 1, 3, 2, 0.32)), st('flour'), 12); }
    if (p.id === 'cafe') { add('pie', grid(-3.6, 1.0, 6.7, 2.4, 0.1, 6, 1), st('pie'), 6); add('bread', grid(3.6, 1.0, 6.7, 2.4, 0.1, 6, 1), st('bread'), 10); }
    if (p.id === 'greengrocer') { add('veg', [-4.2, -3.1].flatMap((x, i) => grid(x, i ? 0.42 : 0.42, 8.2, 0.85, 0.5, 3, 2).concat(grid(x, 0.12, 8.9, 0.85, 0.5, 3, 2))), st('veg'), 24); add('fruit', [3.1, 4.2].flatMap((x) => grid(x, 0.4, 8.2, 0.85, 0.5, 3, 2).concat(grid(x, 0.1, 8.9, 0.85, 0.5, 3, 2))), st('fruit'), 20); }
    if (p.id === 'butcher') add('lamb', [-3.4, 3.4].flatMap((x) => grid(x, 0.95, 8.4, 2.1, 0.7, 4, 2)), st('lamb'), 16);
    if (p.id === 'post') add('parcel', grid(-4.4, 0.13, 8.4, 1.2, 0.8, 2, 2, 3, 0.27), st('parcel'), 12);
    if (p.id === 'mill') { add('grain', grid(-4.6, 0.2, 5.6, 1.2, 1.6, 2, 3, 2, 0.32), st('grain'), 20); add('flour', grid(4.6, 0.2, 7.6, 2.4, 0.8, 4, 2, 2, 0.32), out('flour'), 20); }
    if (p.id === 'depot') { add('coffee', grid(-6, 1.05, RAIL_Z - LOT8_Z + 3.6, 1.6, 1, 4, 2, 2, 0.3), out('coffee'), 20); add('tea', grid(-3.6, 1.0, RAIL_Z - LOT8_Z + 3.6, 1.4, 1, 4, 2, 2, 0.18), out('tea'), 16); add('parcel', grid(5.5, 1.03, RAIL_Z - LOT8_Z + 3.6, 1.8, 1.2, 3, 2, 3, 0.27), out('parcel'), 18); }
    if (p.kind === 'farm') add(p.makes, grid(-5.2, p.makes === 'grain' ? 0.2 : 0.32, 8.4, 2.6, 1.0, 4, 2, 3, p.makes === 'grain' ? 0.32 : 0.14).map((s) => ({ ...s })), out(p.makes), 30);
  }
  // Dedicated rail-depot delivery-vehicle parking: the three buses/trucks
  // have marked off-road bays (not parked in the 30 km/h traffic lanes).
  // Paint sits barely above the ground and does not obstruct pedestrians.
  for (let i=0; i<life.trucks.length; i++) {
    const bay=life.depotBay(i), x=bay.x,z=bay.z;
    statics.box(0x59636b,7.4,0.03,3.2,x,0.018,z);
    for (const side of [-1,1])
      statics.box(0xf2ecd1,0.10,0.045,3.1,x+side*3.7,0.044,z);
    statics.box(0xf2ecd1,7.3,0.045,0.10,x,0.044,z-1.58);
    statics.box(0xe0c35b,1.2,0.046,0.15,x,0.045,z+1.52);
  }
  group.add(statics.build());
  colliders.push(...statics.solids);
  const shopGlass = Builder.merge(statics.glass);
  if (shopGlass) group.add(new THREE.Mesh(shopGlass, shopGlassMat));

  // Windmill sails turn while the miller works.
  const mill = life.place('mill');
  const sb = new Builder(); for (let i = 0; i < 4; i++) sb.add('box', 0xe8e0d0, 0.9, 5, 0.08, Math.sin(i * Math.PI / 2) * 2.6, Math.cos(i * Math.PI / 2) * 2.6, 0, 0, 0, -i * Math.PI / 2);
  const sails = sb.build(); sails.position.set(mill.x, 9.5, LOT8_Z + 4.2); (mill.mesh || group).add(sails);
  // The tractor works the wheat paddock when a farmer is at work there.
  const silo = life.place('silo');
  const tb = new Builder(); tb.block(0x3a8a3a, 1.6, 1.0, 2.6, 0, 0.6, 0); tb.block(0x3a8a3a, 1.2, 1.2, 1.2, 0, 1.6, -0.5); tb.box(GLASS, 1.0, 0.8, 1.0, 0, 2.2, -0.5);
  for (const [x, z, r] of [[-0.95, -0.8, 0.75], [0.95, -0.8, 0.75], [-0.85, 0.9, 0.45], [0.85, 0.9, 0.45]]) tb.cyl(0x1d1d1d, r, 0.35, x, r, z, 0, Math.PI / 2);
  const tractor = tb.build(); group.add(tractor);
  const field = silo.field; let tractorS = 0;
  // Freight train.
  const train = makeTrain(); train.visible = false; train.position.set(0, 0, RAIL_Z); group.add(train);
  const depot = life.place('depot');
  // Trucks.
  const trucks = life.trucks.map((t, i) => { const v = makeTruck([0xd8562a, 0x2a6ab8, 0xe0b030][i]); group.add(v.group); return { t, ...v }; });
  // Parcels waiting on doorsteps.
  const parcels = new THREE.InstancedMesh(GOOD_GEO.parcel[0], new THREE.MeshLambertMaterial({ color: 0xb08a5a }), 40);
  parcels.count = 0; group.add(parcels);
  let parcelSig = '';

  // Villagers.
  const people = life.villagers.map((v, i) => {
    const fig = makePerson(i * 13 + 5, UNIFORM[v.job] || 0x5a6a7a, [0x2f3440, 0x3a3a52, 0x4a3a2a, 0x2a4a5a][i % 4]);
    fig.phase = i * 1.7;
    const bike = makeBike(); bike.visible = false; fig.group.add(bike);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.32, 0.18), new THREE.MeshLambertMaterial({ color: [0x3a7a3a, 0xc8a878, 0x2a5a8a][i % 3] })); bag.position.set(0.36, 0.72, 0.05); bag.visible = false; fig.group.add(bag);
    const tag = makeLabel(v.name, 'interactive'); tag.position.set(0, 2.25, 0); fig.group.add(tag);
    fig.group.position.set(v.x, 0, v.z); group.add(fig.group);
    return { v, fig, bike, bag, tag, heading: 0, last: { x: v.x, z: v.z }, key: `villager:${i}`, pos: new THREE.Vector3(v.x, 0, v.z), talking: false };
  });

  // Sky dressing.
  const stars = makeStars(); scene.add(stars);
  // Rain falls in a box around the player on rainy days.
  const rainPos = new Float32Array(1500 * 3);
  for (let i = 0; i < 1500; i++) { rainPos[i * 3] = (Math.random() - 0.5) * 60; rainPos[i * 3 + 1] = Math.random() * 22; rainPos[i * 3 + 2] = (Math.random() - 0.5) * 60; }
  const rainGeo = new THREE.BufferGeometry(); rainGeo.setAttribute('position', new THREE.BufferAttribute(rainPos, 3));
  const rain = new THREE.Points(rainGeo, new THREE.PointsMaterial({ color: 0xaac4dd, size: 0.12, transparent: true, opacity: 0.6, depthWrite: false }));
  rain.visible = false; rain.frustumCulled = false; scene.add(rain);
  const moon = new THREE.Mesh(new THREE.SphereGeometry(5, 16, 12), new THREE.MeshBasicMaterial({ color: 0xf2efe0, fog: false })); scene.add(moon);
  const hemiDay = new THREE.Color(0xffffff), hemiNight = new THREE.Color(0x7a8ac0), bg = new THREE.Color();

  // Town clock face on the Town Hall: a little canvas updated once a town minute.
  const hall = life.place('hall');
  const clockCanvas = document.createElement('canvas'); clockCanvas.width = 128; clockCanvas.height = 128;
  const clockTex = new THREE.CanvasTexture(clockCanvas); clockTex.colorSpace = THREE.SRGBColorSpace;
  const clockFace = new THREE.Mesh(new THREE.CircleGeometry(1.4, 24), new THREE.MeshBasicMaterial({ map: clockTex }));
  clockFace.position.set(hall.x, 11.6, LOT8_Z + 3.02); (hall.mesh || group).add(clockFace);
  let clockMinute = -1;
  function drawClock(minute) {
    const c = clockCanvas.getContext('2d'); c.clearRect(0, 0, 128, 128);
    c.fillStyle = '#f6f1e2'; c.beginPath(); c.arc(64, 64, 62, 0, Math.PI * 2); c.fill(); c.lineWidth = 5; c.strokeStyle = '#2a2a2a'; c.stroke();
    for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; c.fillStyle = '#2a2a2a'; c.fillRect(64 + Math.sin(a) * 50 - 2, 64 - Math.cos(a) * 50 - 2, 4, 4); }
    const hand = (a, len, w) => { c.lineWidth = w; c.beginPath(); c.moveTo(64, 64); c.lineTo(64 + Math.sin(a) * len, 64 - Math.cos(a) * len); c.stroke(); };
    hand(((minute / 60) % 12) / 12 * Math.PI * 2, 30, 6); hand((minute % 60) / 60 * Math.PI * 2, 46, 4);
    clockTex.needsUpdate = true;
  }

  // Seconds of real time per town minute at speed 1: SEC_PER_MIN. speed multiplies it.
  let saveTimer = 0, tick = 0;
  const events = [];   // sounds for the ambience: { kind: 'bell'|'horn', n?, x, z }
  let lastHour = Math.floor(life.minute / 60), hornDone = -1;
  let currentConversation=null,conversationElapsed=0;
  function update(dt, t, { player, mode, overview, camera, talkingTo, inside }) {
    const inTown = mode === 'town';
    life.obstacles = inTown ? [player.pos] : [];
    // Proximity alone is NOT consent to an endless conversation. Only the
    // explicitly opened interaction panel pauses a resident, for at most
    // 15 real seconds. Work, dinner and sleep resume even if it stays open.
    if(talkingTo!==currentConversation){currentConversation=talkingTo;conversationElapsed=0;}
    if(currentConversation)conversationElapsed+=Math.max(0,dt);
    for(const p of people){
      const d=Math.hypot(p.v.x-player.pos.x,p.v.z-player.pos.z);
      p.v.engaged=inTown&&!p.v.inside&&talkingTo===p&&conversationElapsed<15&&d<4.2;
    }
    let minutes = Math.min(dt, 0.25) * life.speed / SEC_PER_MIN;
    while (minutes > 0) { const step = Math.min(minutes, 0.5); life.tick(step); minutes -= step; }
    if ((saveTimer += dt) > 10) { saveTimer = 0; save(); }
    const m = life.minute;
    if (Math.floor(m) !== clockMinute) { clockMinute = Math.floor(m); drawClock(m); }
    // The Town Hall bell strikes the hour; the freight train sounds its horn coming in.
    const hour = Math.floor(m / 60);
    if (hour !== lastHour) { lastHour = hour; if (hour >= 7 && hour <= 21) events.push({ kind: 'bell', n: hour % 12 || 12, x: hall.x, z: LOT8_Z }); }
    if (m >= 405 && m < 410 && hornDone !== life.day) { hornDone = life.day; events.push({ kind: 'horn', x: trainX(m, depot.x) ?? depot.x, z: RAIL_Z }); }

    // Sky and lights follow the clock everywhere; windows indoors look out onto the live town sky.
    const day = life.daylight(), dark = THREE.MathUtils.clamp((0.55 - day) / 0.45, 0, 1);
    const dusk = day > 0 && day < 0.6 ? Math.sin((day / 0.6) * Math.PI) * 0.55 : 0;
    bg.copy(NIGHT_SKY).lerp(DAY_SKY, day).lerp(DUSK, dusk);
    const weather = life.civic.weather, overcast = weather === 'rainy' ? 0.55 : weather === 'cloudy' ? 0.3 : 0;
    if (overcast) bg.lerp(GREY.clone().multiplyScalar(0.3 + 0.7 * day), overcast);
    if (!overview) { scene.background.copy(bg); fog.color.copy(bg); }
    else scene.background.copy(bg);
    hemi.intensity = (0.5 + 1.6 * day) * (1 - overcast * 0.35); hemi.color.copy(hemiNight).lerp(hemiDay, day);
    const a = ((m / 60 - 6) / 24) * Math.PI * 2;      // sun rises in the east (+x) at 6:00
    sun.position.set(Math.cos(a) * 130, Math.max(8, Math.sin(a) * 140), 50); sun.intensity = 2.0 * day;
    sun.color.setHex(dusk > 0.25 ? 0xffb070 : 0xffe7bf);
    stars.visible = moon.visible = dark > 0.2 && !overcast;
    rain.visible = inTown && !overview && weather === 'rainy';
    if (rain.visible) {
      rain.position.set(camera.position.x, 0, camera.position.z);
      const a2 = rain.geometry.attributes.position;
      for (let i = 0; i < a2.count; i++) { let y = a2.getY(i) - dt * 14; if (y < 0) y += 22; a2.setY(i, y); }
      a2.needsUpdate = true;
    }
    if (stars.visible) { stars.position.copy(camera.position); stars.material.opacity = Math.min(1, dark * 1.2); moon.position.set(camera.position.x - Math.cos(a) * 140, camera.position.y + Math.max(30, -Math.sin(a) * 120), camera.position.z - 60); }
    // A blackout puts out the windows and street lamps (src/world/life.js utilities).
    const powered = life.civic.powerGrid ? life.civic.powerGrid.served > 0 : life.civic.supply.ok; // a local fault must not darken every lamp
    town.setNight(powered ? dark : dark * 0.04, m);
    const anyOpenLate = dark > 0.2;
    shopGlassMat.emissiveIntensity = anyOpenLate && powered ? dark * 0.9 : 0;
    lightMat.emissiveIntensity = dark > 0.3 ? 1.4 : 0;  // vehicle headlights run on their own batteries

    // Moving things are updated around the player's town-space position so they remain visible through windows.
    const cos = Math.cos(town.group.rotation.y), sin = Math.sin(town.group.rotation.y);
    const rdx = player.pos.x - town.group.position.x, rdz = player.pos.z - town.group.position.z;
    const px = rdx * cos - rdz * sin, pz = rdx * sin + rdz * cos;
    const near = (x, z, r) => Math.abs(x - px) < r && Math.abs(z - pz) < r;
    const inActiveFootprint = (x, z) => {
      if (inTown || !inside?.bounds) return false;
      const ix = x * cos + z * sin + town.group.position.x;
      const iz = -x * sin + z * cos + town.group.position.z;
      return ix > inside.bounds.x0 - 0.6 && ix < inside.bounds.x1 + 0.6 && iz > inside.bounds.z0 - 0.6 && iz < inside.bounds.z1 + 0.6;
    };
    for (const p of people) {
      const v = p.v, moved = Math.hypot(v.x - p.last.x, v.z - p.last.z);
      p.last.x = v.x; p.last.z = v.z; p.pos.set(v.x, 0, v.z);
      const show = !v.inside && !overview && near(v.x, v.z, 95) && !inActiveFootprint(v.x, v.z);
      p.fig.group.visible = show;
      if (!show) continue;
      const moving = moved > 0.0005 && !v.engaged;
      if (v.engaged) { const want = Math.atan2(px - v.x, pz - v.z); p.heading += angleDiff(want, p.heading) * Math.min(1, dt * 4); }
      else if (moving) p.heading += angleDiff(v.heading ?? p.heading, p.heading) * Math.min(1, dt * 8);
      p.bike.visible = !!v.bike && !v.engaged && v.path.length > 0;
      p.bag.visible = !!v.carrying && !p.bike.visible;
      const riding=p.bike.visible;
      pose(p.fig, dt, t, moving&&!riding, moving || v.engaged);
      if(riding){
        const pedal=Math.sin(t*8+p.fig.phase)*0.38;
        p.fig.legs[0].rotation.x=0.32+pedal;
        p.fig.legs[1].rotation.x=0.32-pedal;
        p.fig.arms[0].rotation.x=-0.48;
        p.fig.arms[1].rotation.x=-0.48;
      }
      // Bicycle wheels already rest at y=.34; lifting the whole figure
      // another 32cm made the bikes hover visibly above the street.
      p.fig.group.position.set(v.x, riding ? 0 : moving ? Math.abs(Math.sin(t * 7 + p.fig.phase)) * 0.04 : 0, v.z);
      p.fig.group.rotation.y = p.heading;
      const dist = Math.hypot(v.x - px, v.z - pz);
      p.tag.visible = dist > 3 && !p.bubble;
      // A passing hello: a speech bubble for a few seconds, then quiet for a while.
      if (p.bubble && (p.bubbleT -= dt) <= 0) { p.fig.group.remove(p.bubble); p.bubble.material.map.dispose(); p.bubble.material.dispose(); p.bubble = null; }
      if (!p.bubble && inTown && dist < 7 && dist > 2.8 && t > (p.quietUntil || 0)) {
        p.bubble = makeLabel(`💬 ${greeting(v, m)}`, 'prop'); p.bubble.position.set(0, 2.35, 0); p.fig.group.add(p.bubble);
        p.bubbleT = 3.5; p.quietUntil = t + 40 + Math.random() * 40;
      }
    }
    for (const tr of trucks) {
      const t0 = tr.t;
      tr.group.visible = !overview && near(t0.x, t0.z, 120);
      tr.group.position.set(t0.x, 0, t0.z);
      tr.group.rotation.y = t0.heading;   // the simulation already turns at a realistic rate; smoothing would make the mesh lag its footprint
      tr.load.count = t0.load ? Math.min(10, Math.max(1, Math.round(t0.load.n / 2))) : 0;
      tr.tails.material.emissiveIntensity = t0.braking ? 1.6 : dark > 0.3 ? 0.7 : 0;
    }
    const tx = trainX(m, depot.x);
    train.visible = tx !== null && !overview; if (tx !== null) train.position.x = tx;
    // Sails spin while someone works the mill; the tractor drives up and down its paddock.
    if (life.villagers.some((v) => v.work === 'mill' && v.step?.kind === 'work' && !v.path.length)) sails.rotation.z -= dt * 0.9;
    const farming = life.villagers.some((v) => v.work === 'silo' && v.step?.kind === 'work' && !v.path.length);
    if (farming) tractorS += dt * 2.2;
    const lanes = 8, laneLen = field.x1 - field.x0 - 6, tot = lanes * laneLen, s = tractorS % (tot * 2), along = s % laneLen, lane = Math.floor(s / laneLen) % lanes, dir = lane % 2 ? -1 : 1;
    tractor.position.set(dir > 0 ? field.x0 + 3 + along : field.x1 - 3 - along, 0, field.z0 + 3 + lane * ((field.z1 - field.z0 - 6) / (lanes - 1)));
    tractor.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
    if ((tick = (tick + 1) % 10) === 0) for (const d of displays) d.update();
    for (const f of fields) f.update(dt, t, near(f.p.x, (FIELD_Z0 + FIELD_Z1) / 2, 70));
    const sig = life.parcels.map((p) => p.coordinate).join();
    if (sig !== parcelSig) {
      parcelSig = sig; const mm = new THREE.Matrix4();
      life.parcels.slice(0, 40).forEach((p, i) => { mm.makeRotationY(i).setPosition(p.x, 0.13, p.z); parcels.setMatrixAt(i, mm); });
      parcels.count = Math.min(40, life.parcels.length); parcels.instanceMatrix.needsUpdate = true;
    }
  }

  return { life, group, colliders, spots, people, update, save, events, placeFront: (id) => { const p = life.place(id); return p.side === 'south' ? { x: p.x, z: FIELD_Z0 - 4.4, yaw: Math.PI } : { x: p.x, z: LOT8_Z + 12.6, yaw: 0 }; } };
}

// What a villager calls out as the player passes, from the time of day and what they're up to.
const JOB_LINES = { baker: 'Fresh loaves out the front!', farmer: "Wheat's coming on nicely.", 'dairy hand': 'Cows were grumpy this morning.', 'poultry keeper': 'Chooks are laying well!',
  shearer: 'Sheep need a haircut.', miller: 'Mill\'s turning today.', barista: 'Flat white?', cook: 'Brekkie till eleven!', grocer: 'Pumpkins are cheap today.', shopkeeper: 'Milk just came in.',
  butcher: 'Lamb chops on special.', publican: 'Pub opens at eleven!', postie: 'Nothing for you today!', 'truck driver': 'Mind the trucks, love.', teacher: 'School run again…',
  nurse: 'Keep your fluids up!', mayor: 'Lovely town, isn\'t it?', 'station master': 'Train was on time!', programmer: 'Just one more bug…', retired: 'In my day…', student: 'Got homework.', artist: 'Look at that light!' };
function greeting(v, minute) {
  const h = minute / 60, pick = (a) => a[Math.floor(Math.random() * a.length)];
  if (v.step?.kind==='civic-speaker'&&!v.path.length) return pick(['Happy to answer questions about town services.', 'Council forum at the square today.']);
  if (v.step?.kind==='civic-audience'&&!v.path.length) return pick(['Just here to listen.', 'I have a few questions about local services.']);
  if (v.bike && v.path.length) return pick(['On your left!', 'Ding ding!', "Mornin'!"]);
  if (v.carrying) return pick(['Got the shopping!', 'Heavy bags, these.']);
  if (v.hunger > 70) return pick(['Starving, me.', "Can't wait for tea."]);
  if (Math.random() < 0.4) return JOB_LINES[v.job] || "G'day!";
  return h < 12 ? pick(["Mornin'!", "G'day!", 'Lovely morning.']) : h < 17 ? pick(["G'day!", 'Arvo!', 'Warm one today.']) : pick(["Evenin'!", 'Nearly tea time.', 'Night, love.']);
}

function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }
export { LOT_X, GOODS };
