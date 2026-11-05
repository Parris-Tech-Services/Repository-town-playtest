// Narromine road traffic at realistic levels. Volumes come from the NSW "level crossings on public
// roads" register (Transport for NSW open data): Dandaloo Street 7,000 vehicles/day (crossing 717),
// Manildra Street 500/day (716), Derribong Street/Dandaloo Road 380/day (1109). Other streets use
// typical figures by road class. Cars drive on the left at the posted 50 km/h town limit (Mapillary
// speed signs), slow for turns, stop behind the player and each other, and wait at closed crossings.
// Only the area around the player (500 m) is simulated, so phones stay smooth.
import * as THREE from 'three';
import { STREETS } from './narromine-layout.js';
import { VEHICLE_MODELS, pickVehicle, pickPaint, loadVehicleModels } from './narromine-vehicle-models.js';

export const DAILY_VEHICLES = Object.freeze({ 'Dandaloo Street': 7000, 'Manildra Street': 500, 'Derribong Street': 380, 'Dandaloo Road': 380 });
const CLASS_VEHICLES = { trunk: 7000, primary: 4000, secondary: 3000, tertiary: 900, unclassified: 250, residential: 150, living_street: 50, service: 40, track: 15 };
// Share of the daily total in each hour (typical Australian country-town weekday profile; sums to 1).
const HOURLY = [.006, .004, .003, .003, .006, .016, .038, .066, .079, .068, .064, .066, .068, .066, .068, .074, .08, .072, .052, .036, .028, .022, .014, .008];
const SPEED = 50 / 3.6, RADIUS = 500;

function buildGraph() {
  const nodes = [], adj = new Map(), key = (p) => Math.round(p[0] * 2) + ',' + Math.round(p[1] * 2), index = new Map();
  const node = (p) => { const k = key(p); if (!index.has(k)) { index.set(k, nodes.length); nodes.push({ x: p[0], z: p[1] }); adj.set(nodes.length - 1, []); } return index.get(k); };
  for (const s of STREETS) {
    if (s.kind === 'track' || s.kind === 'service' || s.pts.length < 2) continue;
    const daily = DAILY_VEHICLES[s.name] ?? CLASS_VEHICLES[s.kind] ?? 150;
    let prev = node(s.pts[0]);
    for (let i = 1; i < s.pts.length; i++) {
      const id = node(s.pts[i]); if (id === prev) continue;
      const len = Math.hypot(nodes[id].x - nodes[prev].x, nodes[id].z - nodes[prev].z), e = { daily, width: s.width || 7, len, name: s.name };
      adj.get(prev).push({ to: id, ...e }); adj.get(id).push({ to: prev, ...e }); prev = id;
    }
  }
  return { nodes, adj };
}

const CAR_COLOURS = [0xe8e8e4, 0x9aa3ab, 0x2f3b4a, 0x7a1e1e, 0x1f3f6b, 0x3b3b3b, 0xd8d2c0, 0x5c6b52];
const MAX_CARS = 400;
export function createNarromineTraffic(parent, { blocked = () => false, models = typeof document !== 'undefined' } = {}) {
  // Real vehicle models load in the background; until then (and in Node tests) cars are drawn as
  // simple boxes: two instanced meshes, bodies and cabins.
  const bodies = new THREE.InstancedMesh(new THREE.BoxGeometry(1.8, 0.75, 4.4), new THREE.MeshLambertMaterial({ color: 0xffffff }), MAX_CARS);
  const cabins = new THREE.InstancedMesh(new THREE.BoxGeometry(1.6, 0.55, 2.0), new THREE.MeshLambertMaterial({ color: 0x9dc3d4 }), MAX_CARS);
  bodies.count = cabins.count = 0; bodies.frustumCulled = cabins.frustumCulled = false; bodies.name = 'Narromine traffic'; parent.add(bodies, cabins);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new THREE.Vector3(0, 1, 0), tint = new THREE.Color();
  let real = null;
  if (models) loadVehicleModels(parent).then(r => { real = r; bodies.visible = cabins.visible = false; }).catch(e => console.warn('Narromine vehicle models did not load; keeping simple cars', e));
  function draw() {
    if (real) { real.draw(cars); return; }
    const n = Math.min(cars.length, MAX_CARS);
    for (let i = 0; i < n; i++) {
      const c = cars[i]; q.setFromAxisAngle(up, c.yaw);
      m4.compose(new THREE.Vector3(c.x, 0.65, c.z), q, new THREE.Vector3(1, 1, 1)); bodies.setMatrixAt(i, m4); bodies.setColorAt(i, tint.setHex(c.colour));
      const back = c.ute ? 0.6 : 0.2;   // utes have a short cab
      m4.compose(new THREE.Vector3(c.x + Math.sin(c.yaw) * back, 1.28, c.z + Math.cos(c.yaw) * back), q, new THREE.Vector3(1, 1, c.ute ? 0.8 : 1.15)); cabins.setMatrixAt(i, m4);
    }
    bodies.count = cabins.count = n; bodies.instanceMatrix.needsUpdate = cabins.instanceMatrix.needsUpdate = true; if (bodies.instanceColor) bodies.instanceColor.needsUpdate = true;
  }
  const { nodes, adj } = buildGraph();
  const edges = []; for (const [from, list] of adj) for (const e of list) if (from < e.to) edges.push({ from, ...e });
  const cars = []; let serial = 0, seed = 1234567;
  const rand = () => (seed = (seed * 16807) % 2147483647) / 2147483647;     // deterministic, so tests repeat
  const posOf = (c) => { const a = nodes[c.from], b = nodes[c.to], t = c.s / c.len; return { x: a.x + (b.x - a.x) * t, z: a.z + (b.z - a.z) * t, ux: (b.x - a.x) / c.len, uz: (b.z - a.z) / c.len }; };
  function place(c) {
    const p = posOf(c), off = Math.min(c.width / 4, 1.9);            // keep left: left of travel is (uz, -ux)
    c.x = p.x + p.uz * off; c.z = p.z - p.ux * off; c.yaw = Math.atan2(-p.ux, -p.uz) + Math.PI; c.ux = p.ux; c.uz = p.uz;
  }
  function nextEdge(c) {
    const options = adj.get(c.to).filter(e => e.to !== c.from);
    if (!options.length) return adj.get(c.to)[0];                      // dead end: turn round
    // Busy roads attract through traffic: weight choices by daily volume.
    const total = options.reduce((s, e) => s + e.daily, 0); let r = rand() * total;
    for (const e of options) if ((r -= e.daily) <= 0) return e;
    return options[0];
  }
  function spawn(e, s, forward) {
    const from = forward ? e.from : e.to, to = forward ? e.to : e.from;
    const model = pickVehicle(rand), heavy = VEHICLE_MODELS[model].length > 6.5 || /tractor/.test(VEHICLE_MODELS[model].file);
    const c = { id: serial++, from, to, s, len: e.len, width: e.width, model, L: VEHICLE_MODELS[model].length, speed: SPEED * (heavy ? 0.7 : 0.85 + rand() * 0.2), v: SPEED * 0.8,
      colour: VEHICLE_MODELS[model].paint ? pickPaint(rand) : 0xffffff, ute: /truck/.test(VEHICLE_MODELS[model].file) };
    if (/tractor/.test(VEHICLE_MODELS[model].file)) { c.speed = 25 / 3.6; c.colour = rand() < 0.5 ? 0x2f6b2a : 0xb3262b; }
    cars.push(c); place(c); return c;
  }
  // Expected cars on an edge right now: vehicles per hour per metre at town speed, both directions.
  const expected = (e, hour) => e.daily * HOURLY[hour] / (SPEED * 3600) * e.len;
  function populate(player, hour) {
    // Count cars per edge once (an edge is the unordered node pair).
    const onEdge = new Map(); for (const c of cars) { const k = Math.min(c.from, c.to) + ':' + Math.max(c.from, c.to); onEdge.set(k, (onEdge.get(k) || 0) + 1); }
    for (const e of edges) {
      const a = nodes[e.from], b = nodes[e.to], mx = (a.x + b.x) / 2, mz = (a.z + b.z) / 2;
      if (Math.hypot(mx - player.x, mz - player.z) > RADIUS) continue;
      const have = onEdge.get(Math.min(e.from, e.to) + ':' + Math.max(e.from, e.to)) || 0;
      let want = expected(e, hour); want = Math.floor(want) + (rand() < want % 1 ? 1 : 0);
      for (let k = have; k < want; k++) {
        const s = rand() * e.len, fwd = rand() < 0.5, p = { x: a.x + (b.x - a.x) * s / e.len, z: a.z + (b.z - a.z) * s / e.len };
        if (Math.hypot(p.x - player.x, p.z - player.z) < 40) continue;          // never pop in beside the player
        spawn(e, fwd ? s : e.len - s, fwd);
      }
    }
  }
  let filled = false, refill = 0;
  function update(dt, player, minute) {
    if (!player) return;
    const hour = Math.floor(((minute ?? 600) % 1440) / 60);
    if (!filled || (refill -= dt) <= 0) { populate(player, hour); filled = true; refill = 4; }
    // Spatial buckets (20 m) so each car only checks its neighbours for the car ahead.
    const grid = new Map();
    for (const c of cars) for (const dx of [-1, 0, 1]) for (const dz of [-1, 0, 1]) { const k = (Math.floor(c.x / 20) + dx) + ',' + (Math.floor(c.z / 20) + dz); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(c); }
    for (let i = cars.length - 1; i >= 0; i--) {
      const c = cars[i];
      if (Math.hypot(c.x - player.x, c.z - player.z) > RADIUS + 100) { cars.splice(i, 1); continue; }
      // Stop for the player, the car ahead in the same direction, or a closed level crossing just ahead.
      const reach = c.L / 2 + 4.5, ax = c.x + c.ux * reach, az = c.z + c.uz * reach;
      const ahead = Math.hypot(player.x - ax, player.z - az) < 5 || (grid.get(Math.floor(ax / 20) + ',' + Math.floor(az / 20)) || []).some(o => o !== c && (o.ux * c.ux + o.uz * c.uz) > 0.7 && Math.hypot(o.x - ax, o.z - az) < o.L / 2 + 1.5) || blocked(ax, az);
      const remaining = c.len - c.s, turnSlow = remaining < 15 ? 0.55 : 1;
      const target = ahead ? 0 : c.speed * turnSlow;
      c.v += Math.max(-6 * dt, Math.min(2 * dt, target - c.v));
      c.s += c.v * dt;
      while (c.s > c.len) { const e = nextEdge(c); c.s -= c.len; c.from = c.to; c.to = e.to; c.len = e.len; c.width = e.width; }
      place(c);
    }
    draw();
  }
  // Solid boxes for vehicles near the player, so the player's car and the player can't drive through them.
  const colliders = (player) => cars.filter(c => Math.hypot(c.x - player.x, c.z - player.z) < 60).map(c => {
    const hl = c.L / 2, hw = 0.95, poly = [[hl, hw], [-hl, hw], [-hl, -hw], [hl, -hw]].map(([a, b]) => [c.x + c.ux * a - c.uz * b, c.z + c.uz * a + c.ux * b]);
    const xs = poly.map(p => p[0]), zs = poly.map(p => p[1]);
    return { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs), poly, traffic: true };
  });
  return { update, colliders, get count() { return cars.length; }, get modelsLoaded() { return !!real; }, cars, expected, edges };
}
