import * as THREE from 'three';
import { containLabel } from '../ui/labels.js';

// Shared building blocks for the dedicated High Street interiors (bank, and future shops).
// Every walk-in room uses the same 14 m × 18 m shell, door gap, spawn point and exit zone so the
// game's entry, exit and door-sensor logic works identically for all of them; only the contents differ.
export const ROOM = Object.freeze({ W: 14, D: 18, FRONT: 6, BACK: -12, EDGE: 7, WALL: 0.24 });

export function createKit(site, makeLabel, roomTitle) {
  const { W, D, FRONT, BACK, EDGE, WALL } = ROOM;
  const group = new THREE.Group();
  group.name = 'Inside ' + site.name;
  const colliders = [], interactables = [], sceneObjects = [], placedProps = [];
  const mats = new Map(), geos = new Map();
  const mat = (c, o = {}) => {
    const k = c + '|' + (o.e ?? '') + '|' + (o.a ?? 1) + '|' + (o.side ?? 0);
    if (!mats.has(k)) mats.set(k, new THREE.MeshLambertMaterial({ color: c, emissive: o.e ?? 0x000000, emissiveIntensity: o.e ? 0.55 : 0, transparent: (o.a ?? 1) < 1, opacity: o.a ?? 1, depthWrite: (o.a ?? 1) >= 1, side: o.side ?? THREE.FrontSide }));
    return mats.get(k);
  };
  const geo = (k, make) => { if (!geos.has(k)) geos.set(k, make()); return geos.get(k); };
  const put = (g, c, x, y, z, o = {}) => {
    const m = new THREE.Mesh(g, mat(c, o));
    m.position.set(x, y, z);
    if (o.ry) m.rotation.y = o.ry; if (o.rx) m.rotation.x = o.rx; if (o.rz) m.rotation.z = o.rz;
    if (o.s) m.scale.set(...o.s);
    group.add(m); return m;
  };
  const box = (w, h, d, x, y, z, c, o) => put(geo(`b${w},${h},${d}`, () => new THREE.BoxGeometry(w, h, d)), c, x, y, z, o);
  const cyl = (rt, rb, h, x, y, z, c, o, seg = 12, open = false) => put(geo(`c${rt},${rb},${h},${seg},${open}`, () => new THREE.CylinderGeometry(rt, rb, h, seg, 1, open)), c, x, y, z, { side: open ? THREE.DoubleSide : undefined, ...o });
  const ball = (r, x, y, z, c, o) => put(geo(`s${r}`, () => new THREE.SphereGeometry(r, 10, 7)), c, x, y, z, o);
  const torus = (r, t, x, y, z, c, o) => put(geo(`t${r},${t}`, () => new THREE.TorusGeometry(r, t, 8, 20)), c, x, y, z, o);
  const blocker = (w, d, x, z) => colliders.push({ x0: x - w / 2, x1: x + w / 2, z0: z - d / 2, z1: z + d / 2 });
  const solid = (w, h, d, x, y, z, c, o) => { box(w, h, d, x, y, z, c, o); blocker(w, d, x, z); };
  const text = (label, x, y, z, kind = 'interactive') => {
    const s = makeLabel(label, kind); s.position.set(x, y, z); s.userData.labelKind = kind;
    containLabel(s, { x0:-EDGE, x1:EDGE, z0:BACK, z1:FRONT, y0:0, y1:4.6 });
    group.add(s);
  };
  const add = (key, label, doWhat, body, x, z) => {
    const pos = new THREE.Vector3(x, 0, z);
    interactables.push({ key: site.id + ':' + key, type: 'civic', label, room: 0, roomName: roomTitle, pos, act: { do: doWhat, title: label, text: body, civicId: site.id } });
    sceneObjects.push({ type: 'civic', label, room: 0, pos: { x, z }, interactive: true });
  };
  // Floor, ceiling, solid side/back walls and a front wall with a proper door gap (never a collider
  // across the doorway), plus a low decorative sill.
  const shell = ({ wall, ceiling = 0xf0e8d6, floor = 0xb9a88f }) => {
    box(W, 0.24, D, 0, -0.12, -3, floor);
    box(W, 0.27, D, 0, 4.7, -3, ceiling);
    solid(W, 4.6, WALL, 0, 2.3, BACK, wall);
    solid(WALL, 4.6, D, -EDGE, 2.3, -3, wall);
    solid(WALL, 4.6, D, EDGE, 2.3, -3, wall);
    for (const sx of [-1, 1]) {
      blocker(6, WALL, sx * 4, FRONT);
      box(6, 1.4, WALL, sx * 4, 0.7, FRONT, wall);
      box(6, 1.4, WALL, sx * 4, 3.9, FRONT, wall);
      box(1.2, 1.8, WALL, sx * 6.4, 2.3, FRONT, wall);
      box(1.0, 1.8, WALL, sx * 1.5, 2.3, FRONT, wall);
      box(3.9, 0.07, WALL + 0.08, sx * 3.9, 1.4, FRONT, 0x6f5343);
      box(3.9, 0.07, WALL + 0.06, sx * 3.9, 3.2, FRONT, 0x6f5343);
      for (const wx of [sx * 2.03, sx * 3.9, sx * 5.77]) box(0.05, 1.8, WALL + 0.04, wx, 2.3, FRONT, 0x6f5343);
      box(3.74, 1.74, 0.03, sx * 3.9, 2.3, FRONT, 0x9fd3ea, { a: 0.18, side: THREE.DoubleSide });
    }
    box(2.4, 0.2, WALL, 0, 3.1, FRONT, 0x6f5343);
    box(2.15, 0.06, 0.6, 0, 0.02, FRONT, 0xb9b8ae);
  };
  const finish = (extra = {}) => ({
    group, colliders, interactables, sceneObjects, placedProps,
    rooms: [{ name: roomTitle, x0: -EDGE, x1: EDGE, z0: BACK, z1: FRONT, w: W, d: D, parent: -1 }],
    windows: [{ axis: 'z', at: FRONT, c: -3.9, w: 3.8, y0: 1.4, y1: 3.2, win: true }, { axis: 'z', at: FRONT, c: 3.9, w: 3.8, y0: 1.4, y1: 3.2, win: true }],
    doors: [], dynamics: [], sight: [],
    bounds: { x0: -EDGE, x1: EDGE, z0: BACK, z1: FRONT },
    spawn: new THREE.Vector3(0, 0, FRONT - 2.25),
    exitZone: { x0: -1.05, x1: 1.05, z0: FRONT - 0.1, z1: FRONT + 1.2 },
    ...extra,
  });
  return { THREE, group, colliders, interactables, sceneObjects, placedProps, mat, geo, put, box, cyl, ball, torus, blocker, solid, text, add, shell, finish };
}
