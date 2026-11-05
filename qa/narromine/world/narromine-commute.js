// Turns Narromine residents' day plans into car trips on the real street network.
// Each car belongs to a household and is driven by one resident: it leaves home for work, school drop-off,
// Coles or a job out of town, parks there, and comes home. Out-of-town jobs (farms to the west; Dubbo and
// Repository Town to the east) drive to the edge of the mapped town and continue off-map.
// Routes are shortest paths: one Dijkstra tree per destination (a few dozen), shared by every home.
// Pure logic, deterministic, no three.js.
import { createNarrominePopulation, dayPlan, AWAY_WORK } from './narromine-population.js';
import { pickVehicle, pickPaint, VEHICLE_MODELS } from './narromine-vehicle-models.js';
import { PLACES } from './narromine-layout.js';

export const TOWN_SPEED = 50 / 3.6;

export function createNarromineCommute(graph, { seed = 20211810 } = {}) {
  const { nodes, adj } = graph, pop = createNarrominePopulation(seed);
  // Spatial index of graph nodes (40 m cells) for "nearest road point".
  const CELL = 40, cells = new Map(), ck = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  nodes.forEach((n, i) => { if (!adj.get(i)?.length) return; const k = ck(n.x, n.z); if (!cells.has(k)) cells.set(k, []); cells.get(k).push(i); });
  function nearestNode(x, z) {
    for (let r = 0; r < 12; r++) {
      let best = -1, bd = Infinity;
      for (let dx = -r; dx <= r; dx++) for (let dz = -r; dz <= r; dz++) for (const i of cells.get((Math.floor(x / CELL) + dx) + ',' + (Math.floor(z / CELL) + dz)) || []) { const d = Math.hypot(nodes[i].x - x, nodes[i].z - z); if (d < bd) { bd = d; best = i; } }
      if (best >= 0) return best;
    }
    return 0;
  }
  // Edges of town: the furthest-east and furthest-west road nodes carry traffic off the map.
  let east = 0, west = 0;
  nodes.forEach((n, i) => { if (!adj.get(i)?.length) return; if (n.x > nodes[east].x) east = i; if (n.x < nodes[west].x) west = i; });
  const coles = PLACES.find((p) => p.kind === 'supermarket'), station = PLACES.find((p) => p.kind === 'railway_station');
  const work = new Map(pop.workplaces.map((w) => [w.id, w]));
  const pointOf = (at, hh) => {
    if (at === 'home') { const h = pop.homes.find((x) => x.id === hh.home); return { x: h.x, z: h.z, kerb: h.kerb }; }
    if (at === 'coles') return { x: coles.x, z: coles.z };
    if (work.has(at)) { const w = work.get(at); return { x: w.x, z: w.z }; }
    const away = AWAY_WORK.find((a) => a.id === at);
    if (away?.direction === 'local') return { x: station.x, z: station.z };
    if (away) return { x: nodes[away.direction === 'west' ? west : east].x, z: nodes[away.direction === 'west' ? west : east].z, away: true };
    return null;
  };
  // Shortest-path trees, one per destination node, built on first use.
  const trees = new Map();
  function tree(target) {
    if (trees.has(target)) return trees.get(target);
    const dist = new Float64Array(nodes.length).fill(Infinity), next = new Int32Array(nodes.length).fill(-1), done = new Uint8Array(nodes.length);
    dist[target] = 0; const heap = [[0, target]];
    while (heap.length) {
      let bi = 0; for (let i = 1; i < heap.length; i++) if (heap[i][0] < heap[bi][0]) bi = i;
      const [d, u] = heap[bi]; heap[bi] = heap[heap.length - 1]; heap.pop();
      if (done[u]) continue; done[u] = 1;
      for (const e of adj.get(u) || []) { const nd = d + e.len; if (nd < dist[e.to]) { dist[e.to] = nd; next[e.to] = u; heap.push([nd, e.to]); } }
    }
    const t = { dist, next }; trees.set(target, t); return t;
  }
  function route(from, to) {
    const t = tree(to); if (!Number.isFinite(t.dist[from])) return null;
    const path = [from]; let n = from, guard = 0;
    while (n !== to && guard++ < 5000) { n = t.next[n]; if (n < 0) return null; path.push(n); }
    return { path, length: t.dist[from] };
  }
  // Each car's look is fixed by its id: model mix and paint as the rest of Narromine's traffic.
  pop.cars.forEach((c, i) => { let s = 1000 + i * 7919; const r = () => (s = (s * 16807) % 2147483647) / 2147483647; const m = pickVehicle(r); c.model = /police|ambulance|firetruck|garbage|delivery|tractor/.test(VEHICLE_MODELS[m].file) ? 0 : m; c.colour = pickPaint(r); c.length = VEHICLE_MODELS[c.model].length; });

  let planned = { key: null, trips: [] };
  // Trips for one day: every change of place by a resident who drives their own car.
  function trips(weekday) {
    if (planned.key === weekday) return planned.trips;
    const out = [];
    for (const car of pop.cars) {
      const p = car.driver && pop.people[+car.driver.slice(3)]; if (!p) continue;
      const hh = pop.households[+car.household.slice(3)], plan = dayPlan(p, hh, weekday, pop.workplaces);
      // The car is where it was last parked; a destination within 150 m of it is walked to (the car stays).
      let where = 'home', carAt = 'home';
      for (const step of plan) {
        if (step.at === where) continue;
        where = step.at;
        if (step.at === carAt) continue;
        const a = pointOf(carAt, hh), b = pointOf(step.at, hh); if (!a || !b) continue;
        const r = route(nearestNode(a.x, a.z), nearestNode(b.x, b.z));
        if (!r || r.length <= 150) continue;
        out.push({ id: car.id + '@' + step.from, car: car.id, person: p.id, from: carAt, to: step.at, depart: step.from, path: r.path, length: r.length, duration: r.length / TOWN_SPEED / 60, dest: b, purpose: step.kind });
        carAt = step.at;
      }
    }
    planned = { key: weekday, trips: out };
    return out;
  }
  // Where a car is at a given minute: driving (trip + metres along it), parked (point) or away off the map.
  function carState(carId, weekday, minute) {
    const list = trips(weekday).filter((t) => t.car === carId);
    let parkedAt = 'home', dest = null, last = null;
    for (const t of list) {
      if (minute < t.depart) break;
      if (minute < t.depart + t.duration) return { driving: t, s: (minute - t.depart) * 60 * TOWN_SPEED };
      parkedAt = t.to; dest = t.dest; last = t;
    }
    if (parkedAt === 'home') return { parked: 'home' };
    return dest?.away ? { away: parkedAt } : { parked: parkedAt, at: dest, trip: last };
  }
  return { population: pop, trips, carState, route, nearestNode, pointOf, exits: { east, west } };
}
