import { createKit, ROOM } from './interior-kit.js';

// The Merged Branch, laid out like an Australian country pub:
//   • A long timber bar at the back with beer taps, a glass-and-spirit back-bar, a till and bar stools.
//   • A bistro dining area with set tables, a lounge corner with a fireplace and armchairs on the left,
//     a pool table and dartboard on the right, a keno/TAB screen, a menu board and a cold room door behind the bar.
//   • A clear aisle down the middle from the door to the bar.
export const PUB_LAYOUT = Object.freeze({ counterZ: -5.6, staff: { x: 0.8, z: -6.75 }, staffUse: { x: 0.8, z: -4.4 } });

export function buildPubInterior(site, makeLabel, roomTitle = 'Country pub') {
  const k = createKit(site, makeLabel, roomTitle);
  const { THREE, group, box, cyl, ball, solid, text, add, blocker } = k;
  const { W, BACK, EDGE } = ROOM;
  const CZ = PUB_LAYOUT.counterZ;
  group.add(new THREE.HemisphereLight(0xffe4c0, 0x5a4636, 1.7));
  const warm = new THREE.PointLight(0xffc880, 1.2, 16, 1.5); warm.position.set(0, 3.4, -1); group.add(warm);

  const WOOD = 0x6d4a30, DARKW = 0x3f2b1c, BRASS = 0xc9a24a, GREEN = 0x2f5a3f, LEATHER = 0x7a3b2c, STEEL = 0xc4c8cc;
  k.shell({ wall: 0x8a6a4e, ceiling: 0x4d382a, floor: 0x5a4030 });
  for (let i = 0; i < 14; i++) box(0.96, 0.014, 17.4, -6.5 + i, 0.004, -3, i % 2 ? 0x573d2c : 0x634633);   // plank floor
  box(2.2, 0.03, 1.2, 0, 0.02, 5.0, 0x3a2a20);                                                              // door mat
  // dado panelling, ceiling beams, wall lights
  box(W - 0.5, 1.2, 0.06, 0, 0.6, BACK + 0.15, DARKW);
  for (const sx of [-EDGE + 0.15, EDGE - 0.15]) box(0.06, 1.2, 17.4, sx, 0.6, -3, DARKW);
  for (let z = -10; z <= 4; z += 3.5) box(W - 0.4, 0.22, 0.25, 0, 3.7, z, DARKW);
  for (const [x, z] of [[-4, 1], [4, 1], [-4, -3], [4, -7]]) { cyl(0.01, 0.01, 0.7, x, 3.5, z, 0x222222, {}, 4); cyl(0.06, 0.28, 0.24, x, 3.0, z, 0x2f5a3f, { e: 0xffc060 }, 12); }

  // ── bar ──
  solid(8.4, 1.1, 0.9, 0.0, 0.55, CZ, WOOD); box(8.6, 0.07, 1.1, 0.0, 1.13, CZ, DARKW); box(8.4, 0.08, 0.1, 0, 0.35, CZ + 0.5, BRASS);
  for (const x of [-3, -2.4, -1.8]) { cyl(0.025, 0.025, 0.3, x, 1.32, CZ + 0.15, BRASS, {}, 8); box(0.06, 0.1, 0.1, x, 1.5, CZ + 0.15, [0xc9a24a, 0x2f5a3f, 0x8a2f2f][Math.round((x + 3) / 0.6) % 3]); }
  for (let i = 0; i < 6; i++) cyl(0.05, 0.04, 0.12, -0.5 + i * 0.18, 1.2, CZ - 0.1, 0xe8e0c8, { a: 0.7 }, 10);
  box(0.46, 0.28, 0.42, 3.0, 1.28, CZ, 0x2d3036); box(0.38, 0.2, 0.02, 3.0, 1.33, CZ + 0.22, 0x8fc4e8, { e: 0x4f94c8 });
  for (let i = 0; i < 6; i++) { const x = -3.4 + i * 1.3; cyl(0.2, 0.2, 0.05, x, 0.72, CZ + 1.25, LEATHER, {}, 12); cyl(0.03, 0.03, 0.7, x, 0.35, CZ + 1.25, 0x2a2a2a, {}, 6); cyl(0.2, 0.2, 0.02, x, 0.02, CZ + 1.25, 0x2a2a2a, {}, 12); }
  // back-bar: mirror, shelves of bottles, glass rack, fridges
  box(7.6, 1.5, 0.06, 0, 2.2, BACK + 0.2, 0xcfd8dc, { a: 0.5 });
  for (const y of [1.4, 1.9, 2.4]) { box(7.6, 0.05, 0.3, 0, y, BACK + 0.35, WOOD); for (let i = 0; i < 18; i++) cyl(0.055, 0.055, 0.28, -3.6 + i * 0.42, y + 0.16, BACK + 0.35, [0x2f5a3f, 0x7a4a22, 0xc9a24a, 0x3a5a7a, 0x8a2f2f][(i + Math.round(y * 5)) % 5], { a: 0.9 }, 8); }
  solid(1.8, 0.95, 0.6, -3.0, 0.48, -10.5, 0xd9dde0); box(1.7, 0.8, 0.04, -3.0, 0.5, -10.18, 0xcfe8ee, { a: 0.4 });
  box(1.4, 2.2, 0.08, 5.0, 1.1, BACK + 0.12, 0x6a5a4a);                                    // cold-room door
  text(site.name, 0, 3.55, CZ - 0.5, 'room'); text('Bar · Meals · Keno', 0, 1.9, CZ - 0.1);

  // ── bistro tables (right-front) and lounge (left) ──
  const table = (x, z) => {
    blocker(1.0, 1.0, x, z); for (const [dx, dz] of [[-0.42, -0.42], [0.42, -0.42], [-0.42, 0.42], [0.42, 0.42]]) box(0.06, 0.76, 0.06, x + dx, 0.38, z + dz, DARKW); box(1.1, 0.05, 1.1, x, 0.78, z, 0xe9e0d0);
    cyl(0.05, 0.05, 0.14, x, 0.88, z, 0xcfe8ee, { a: 0.6 }, 8);
    for (const [dx, dz] of [[-0.8, 0], [0.8, 0], [0, 0.8], [0, -0.8]]) { box(0.4, 0.05, 0.4, x + dx, 0.46, z + dz, DARKW); box(0.4, 0.45, 0.05, x + dx, 0.7, z + dz + (dz ? Math.sign(dz) * 0.18 : 0), DARKW); }
  };
  for (const [x, z] of [[3.6, 3.0], [3.6, -0.4], [-3.6, 3.0]]) table(x, z);
  solid(2.0, 0.55, 0.9, -5.2, 0.28, -1.8, LEATHER); box(2.0, 0.5, 0.2, -5.2, 0.85, -2.2, LEATHER);          // lounge sofa
  for (const z of [0.2, 1.4]) { solid(0.9, 0.5, 0.9, -5.6, 0.25, z, LEATHER); box(0.2, 0.5, 0.9, -6.0, 0.7, z, LEATHER); }
  solid(0.9, 0.4, 0.9, -4.2, 0.2, -0.3, WOOD);                                                               // coffee table
  // fireplace on the left wall
  solid(0.7, 1.6, 2.0, -6.55, 0.8, -4.0, 0x7a5a48); box(0.1, 0.8, 1.2, -6.18, 0.5, -4.0, 0x1a1410); box(0.08, 0.3, 0.9, -6.14, 0.3, -4.0, 0xff7a2a, { e: 0xff5a10 });
  box(0.9, 0.08, 2.2, -6.5, 1.65, -4.0, DARKW);
  // pool table and dartboard on the right
  solid(1.5, 0.85, 2.6, 5.0, 0.43, -7.2, WOOD); box(1.3, 0.05, 2.4, 5.0, 0.87, -7.2, GREEN);
  for (const [px, pz] of [[4.35, -8.3], [5.65, -8.3], [4.35, -6.1], [5.65, -6.1]]) ball(0.07, px, 0.8, pz, 0x111111);
  ball(0.04, 5.0, 0.93, -6.8, 0xffffff); ball(0.04, 5.1, 0.93, -7.6, 0xd9453d);
  cyl(0.28, 0.28, 0.04, 6.94, 1.7, -3.2, 0x1a1a1a, { rz: Math.PI / 2 }, 20); cyl(0.14, 0.14, 0.05, 6.93, 1.7, -3.2, 0xd9453d, { rz: Math.PI / 2 }, 16);
  // keno / TAB screens, menu board, framed pictures
  box(1.4, 0.8, 0.08, 6.9, 2.4, -1.0, 0x1b1d22); box(1.3, 0.7, 0.04, 6.86, 2.4, -1.0, 0x2e6a94, { e: 0x1e4a74 });
  box(2.2, 1.2, 0.06, -6.9, 2.5, 3.0, 0x1f2a24); text('Parmi · Roast · Pie of the day', -6.8, 2.5, 3.1);
  for (const [x, y] of [[-5, 2.4], [-3.2, 2.5], [2.5, 2.5]]) { box(0.8, 0.6, 0.05, x, y, BACK + 0.2, DARKW); box(0.66, 0.46, 0.03, x, y, BACK + 0.23, 0xb8a98a); }

  // finishing detail: beer mats, bunting, bar towels, glass rack, ceiling fans, brass rail, pool cues, stools' footrests
  for (const [x, z] of [[3.6, 3.0], [3.6, -0.4], [-3.6, 3.0]]) for (let i = 0; i < 4; i++) { cyl(0.05, 0.05, 0.01, x - 0.3 + (i % 2) * 0.6, 0.81, z - 0.3 + Math.floor(i / 2) * 0.6, 0xd9c8a0, {}, 10); }
  for (let i = 0; i < 24; i++) box(0.18, 0.22, 0.01, -6.6 + i * 0.57, 3.3 - Math.sin(i / 24 * Math.PI) * 0.0, -11.7 + 0.02, [0xc9553d, 0xe3b04b, 0x2f5a3f, 0x4f7fa6][i % 4]);
  box(8.2, 0.05, 0.05, 0, 0.9, CZ + 0.55, BRASS);
  for (let i = 0; i < 10; i++) cyl(0.04, 0.03, 0.14, -1.6 + i * 0.16, 2.6, BACK + 0.36, 0xe8e0c8, { a: 0.6 }, 8);
  box(1.8, 0.04, 0.3, -1.1, 2.7, BACK + 0.36, WOOD);
  for (const [x, z] of [[-2.5, 0], [2.5, 0], [0, 2.5], [0, -2.5]]) { cyl(0.02, 0.02, 0.5, x, 3.55, z, 0x222222, {}, 4); for (let b = 0; b < 4; b++) box(0.7, 0.02, 0.12, x + Math.cos(b * Math.PI / 2) * 0.35, 3.3, z + Math.sin(b * Math.PI / 2) * 0.35, 0xb08a60, { ry: b * Math.PI / 2 }); }
  for (let i = 0; i < 4; i++) cyl(0.012, 0.012, 1.4, 4.6 + i * 0.2, 1.0, -5.0, 0x8a6a40, { rz: 0.12 }, 4);
  for (let i = 0; i < 6; i++) box(0.5, 0.35, 0.04, -3.4 + i * 1.3, 1.35, CZ + 0.5 + 0.0, 0x3f2b1c);
  for (const x of [-2.2, 1.6]) { box(0.5, 0.06, 0.4, x, 1.18, CZ + 0.2, 0x3a5a7a); }
  for (let i = 0; i < 8; i++) ball(0.07, -1.4 + i * 0.4, 1.3, CZ + 0.3, [0xd9453d, 0xe3b04b, 0x6f9a54][i % 3]);

  add('counter', 'Bar', 'civic-ledger', 'Pull up a stool. Order a meal or a drink at the bar, or open the Town Ledger.', PUB_LAYOUT.staffUse.x, PUB_LAYOUT.staffUse.z);
  add('taps', 'Beer taps', 'info', 'Four taps and a fridge of bottles. Licensed hours run from eleven in the morning to late; the publican serves responsibly.', -2.4, -4.4);
  add('menu', 'Menu board', 'info', 'Chicken parmi, the roast of the day and a pie with chips. The kitchen uses beef, chicken and vegies delivered from the farms and the butcher.', -5.4, 3.9);
  add('lounge', 'Lounge and fire', 'info', 'Leather chairs round a fireplace for a long yarn after work.', -3.2, -1.5);
  add('pool', 'Pool table and darts', 'info', 'A pool table, a dartboard and a keno screen: the Friday night regulars treat the room as their own.', 3.2, -3.4);
  return k.finish({ staff: { pos: PUB_LAYOUT.staff, use: PUB_LAYOUT.staffUse } });
}
