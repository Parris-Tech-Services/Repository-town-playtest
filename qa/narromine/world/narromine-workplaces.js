// Walk-in workplaces for Narromine's mapped businesses and services. Each is fitted out for the work done
// there (classrooms, wards, a bar, a counter and shelves…) and shows the residents whose shift it is,
// standing at their stations; schools also show the pupils in class. The building is the traced footprint
// nearest the mapped place, entered through the wall facing its street. Coles, the Post Office and
// St Mary's keep their own detailed interiors and are not rebuilt here.
import { buildInterior } from './interior.js';
import { makePerson } from './npcs.js';
import { NARROMINE_FOOTPRINTS } from './narromine-footprints-data.js';
import { BUILDINGS, DETAILED } from './narromine-layout.js';
import { segNearest, whoIsAt } from './narromine-population.js';
import { homeDoor, doorCandidates, pickDoor } from './narromine-homes.js';
import { INTERIOR_EVIDENCE } from './narromine-interior-evidence.js';

const S = (t, l) => [t, l, { do: 'info', title: l, text: 'Workstation.' , station: true }];   // a staffed station
const FIT = {
  school: [{ name: 'Classroom', w: 10, d: 9, props: [S('chalkboard', 'Teacher\'s board'), 'desk', 'desk', 'desk', 'chair', 'chair', 'bookshelf'] }, { name: 'Classroom', w: 10, d: 9, props: [S('chalkboard', 'Teacher\'s board'), 'desk', 'desk', 'desk', 'chair', 'chair', 'corkboard'] }, { name: 'Staff room', w: 8, d: 7, props: [S('table', 'Staff table'), 'coffeeMachine', 'fridge', 'chair'] }, { name: 'Front office', w: 8, d: 7, props: [S('counter', 'Front office counter'), 'computer', 'filingCabinet'] }],
  hospital: [{ name: 'Emergency and reception', w: 10, d: 8, props: [S('counter', 'Triage and reception'), 'chair', 'chair', 'waterCooler'] }, { name: 'Ward', w: 11, d: 9, props: [S('bed', 'Patient bed'), S('bed', 'Patient bed'), S('heartMonitor', 'Patient monitor'), 'medicineCabinet'] }, { name: 'Nurses\' station', w: 8, d: 7, props: [S('desk', 'Nurses\' station'), 'computer', 'medicineCabinet'] }],
  doctors: [{ name: 'Waiting room', w: 9, d: 7, props: [S('counter', 'Reception'), 'chair', 'chair', 'noticeBoard'] }, { name: 'Consulting room', w: 8, d: 7, props: [S('desk', 'Doctor\'s desk'), 'bed', 'medicineCabinet', 'scale'] }],
  townhall: [{ name: 'Customer service', w: 10, d: 8, props: [S('counter', 'Customer service and payments'), S('counter', 'Counter 2'), 'chair', 'noticeBoard'] }, { name: 'Offices', w: 10, d: 8, props: [S('desk', 'Desk'), S('desk', 'Desk'), S('desk', 'Desk'), 'computer', 'filingCabinet', 'printer3d'] }, { name: 'Meeting room', w: 10, d: 8, props: ['table', 'chair', 'chair', 'podium', 'flag'] }],
  government: [{ name: 'Front counter', w: 9, d: 7, props: [S('counter', 'Front counter'), 'chair', 'noticeBoard'] }, { name: 'Office', w: 8, d: 7, props: [S('desk', 'Desk'), 'computer', 'filingCabinet'] }],
  police: [{ name: 'Front counter', w: 9, d: 7, props: [S('counter', 'Police front counter'), 'chair', 'noticeBoard'] }, { name: 'Office', w: 9, d: 8, props: [S('desk', 'Desk'), S('desk', 'Desk'), 'computer', 'filingCabinet', 'radio'] }],
  pub: [{ name: 'Front bar', w: 11, d: 9, props: [S('counter', 'Bar'), 'barrel', 'stool', 'stool', 'table', 'tv'] }, { name: 'Dining room', w: 10, d: 8, props: ['table', 'table', 'chair', 'chair', S('counter', 'Bistro counter')] }, { name: 'Kitchen', w: 8, d: 7, props: [S('stove', 'Kitchen'), 'fridge', 'kitchenSink'] }],
  bar: [{ name: 'Club bar', w: 11, d: 9, props: [S('counter', 'Bar'), 'table', 'chair', 'chair', 'tv', 'pinball'] }, { name: 'Bistro', w: 10, d: 8, props: [S('stove', 'Bistro kitchen'), 'table', 'chair', 'fridge'] }],
  cafe: [{ name: 'Café', w: 10, d: 8, props: [S('counter', 'Coffee counter'), 'coffeeMachine', 'cafeTable', 'cafeTable', 'chair'] }, { name: 'Kitchen', w: 7, d: 6, props: [S('stove', 'Kitchen'), 'fridge', 'kitchenSink'] }],
  restaurant: [{ name: 'Dining room', w: 10, d: 8, props: [S('counter', 'Front counter'), 'table', 'table', 'chair', 'chair'] }, { name: 'Kitchen', w: 8, d: 7, props: [S('stove', 'Kitchen'), 'fridge', 'kitchenSink'] }],
  bakery: [{ name: 'Shop', w: 9, d: 7, props: [S('counter', 'Bakery counter'), 'cashRegister', 'shelf'] }, { name: 'Bakehouse', w: 9, d: 8, props: [S('stove', 'Ovens'), S('workbench', 'Bench'), 'crates'] }],
  butcher: [{ name: 'Shop', w: 9, d: 7, props: [S('counter', 'Butcher\'s counter'), 'cashRegister', 'freezer'] }, { name: 'Cutting room', w: 8, d: 7, props: [S('workbench', 'Cutting bench'), 'freezer'] }],
  bank: [{ name: 'Banking hall', w: 10, d: 8, props: [S('counter', 'Teller'), S('counter', 'Teller'), 'chair', 'noticeBoard'] }, { name: 'Office', w: 8, d: 7, props: [S('desk', 'Lending'), 'computer', 'safe'] }],
  pharmacy: [{ name: 'Pharmacy', w: 10, d: 8, props: [S('counter', 'Dispensary'), S('cashRegister', 'Front register'), 'shelf', 'shelf', 'medicineCabinet'] }],
  post_office: [{ name: 'Post office', w: 9, d: 7, props: [S('counter', 'Counter'), 'shelf'] }],
  fuel: [{ name: 'Service station shop', w: 9, d: 7, props: [S('cashRegister', 'Console'), 'shelf', 'shelf', 'fridge', 'coffeeMachine'] }],
  car_repair: [{ name: 'Workshop', w: 12, d: 10, props: [S('workbench', 'Bench'), S('workbench', 'Hoist bay'), 'toolWall', 'partsBins'] }, { name: 'Service desk', w: 7, d: 6, props: [S('counter', 'Service desk'), 'computer'] }],
  tyres: [{ name: 'Workshop', w: 12, d: 10, props: [S('workbench', 'Tyre machine'), 'toolWall', 'partsBins'] }, { name: 'Counter', w: 7, d: 6, props: [S('counter', 'Counter'), 'computer'] }],
  library: [{ name: 'Library', w: 11, d: 9, props: [S('counter', 'Loans desk'), 'bookshelf', 'bookshelf', 'bookshelf', 'table', 'computer'] }],
  sports_centre: [{ name: 'Reception', w: 8, d: 7, props: [S('counter', 'Reception'), 'bench'] }, { name: 'Gym', w: 10, d: 9, props: [S('treadmill', 'Instructor'), 'treadmill', 'dumbbells', 'yogaMat'] }],
  fire_station: [{ name: 'Station', w: 10, d: 9, props: [S('desk', 'Station office'), 'truck', 'toolWall'] }],
};
const SHOP = [{ name: 'Shop', w: 9, d: 8, props: [S('counter', 'Counter'), 'cashRegister', 'shelf', 'shelf', 'shelf'] }, { name: 'Back room', w: 7, d: 6, props: ['crates', 'shelf', 'desk'] }];
const OFFICE = [{ name: 'Reception', w: 8, d: 7, props: [S('counter', 'Reception'), 'chair', 'chair'] }, { name: 'Office', w: 9, d: 7, props: [S('desk', 'Desk'), S('desk', 'Desk'), 'computer', 'filingCabinet'] }];
const WORKSHOP = [{ name: 'Showroom and counter', w: 9, d: 7, props: [S('counter', 'Counter'), 'shelf', 'shelf'] }, { name: 'Workshop and yard', w: 11, d: 9, props: [S('workbench', 'Bench'), 'toolWall', 'partsBins', 'crates'] }];
const OFFICE_KINDS = ['employment_agency', 'estate_agent', 'social_facility', 'courthouse', 'coworking', 'educational_institution', 'physiotherapist', 'alternative', 'photographer', 'community_centre', 'museum', 'camp_site', 'guest_house', 'caravan', 'animal_shelter', 'golf_course', 'aerodrome', 'railway_station'];
const WORKSHOP_KINDS = ['agrarian', 'trade', 'hvac', 'car', 'car_wash'];
export const OWN_INTERIOR = new Set(['supermarket', 'post_office']);          // these keep their dedicated interiors
const fitFor = (kind) => FIT[kind] || (OFFICE_KINDS.includes(kind) ? OFFICE : WORKSHOP_KINDS.includes(kind) ? WORKSHOP : SHOP);

// The traced building for each workplace, with a front door on its street side.
export function createNarromineWorkplaceIndex(pop) {
  const list = [];
  for (const w of pop.workplaces) {
    if (OWN_INTERIOR.has(w.kind)) continue;
    const best = w.building ? { ...w.building } : null;
    if (!best) continue;
    const s = segNearest(best.x, best.z); if (!s) continue;
    best.kerb = { x: s.x, z: s.z };
    list.push({ workplace: w, building: best, door: homeDoor(best), doors: doorCandidates(best) });
  }
  return {
    list,
    // Keep only doors the player can walk up to (probe(x, z, r) → true when blocked), trying all four walls.
    resolve(probe) { for (let i = list.length - 1; i >= 0; i--) { const d = pickDoor(list[i].doors, probe); if (d) list[i].door = d; else list.splice(i, 1); } return list.length; },
    near(pos, reach = 1.4) { let b = null, bd = reach; for (const e of list) { const d = Math.hypot(pos.x - e.door.x, pos.z - e.door.z); if (d < bd) { bd = d; b = e; } } return b; },
  };
}

export function buildNarromineWorkplaceInterior(pop, entry, makeLabel, weekday, minute) {
  const w = entry.workplace, evidence = INTERIOR_EVIDENCE[w.name] || null, rooms = JSON.parse(JSON.stringify(evidence ? evidence.rooms : fitFor(w.kind)));
  // Each business is its own place: rooms sized for its building and staff, a station per worker on a
  // typical shift, its own colours, and its name over the front room.
  const H = (k) => { let h = 2166136261; for (const c of w.name + k) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
  const pickH = (k, list) => list[Math.floor(H(k) * list.length)];
  const onShift = Math.max(1, Math.ceil(w.staff / ((w.closes - w.opens) > 11 * 60 ? 3 : 1.4)));
  const stationCount = rooms.reduce((n, r) => n + r.props.filter((p) => Array.isArray(p) && p[2]?.station).length, 0);
  // Extra stations for bigger crews, in the room that has the first station (e.g. more counters or desks).
  const main = rooms.find((r) => r.props.some((p) => Array.isArray(p) && p[2]?.station));
  const proto = main.props.find((p) => Array.isArray(p) && p[2]?.station);
  for (let k = stationCount; k < Math.min(onShift, 10); k++) main.props.push([proto[0], proto[1] + ' ' + (k + 1), proto[2]]);
  if (/hair|clip/i.test(w.name)) main.props.push(['mirror', 'Styling mirror'], ['chair', 'Salon chair'], ['chair', 'Salon chair']);
  if (/beauty|belladonna/i.test(w.name)) main.props.push(['mirror', 'Mirror'], ['bed', 'Treatment bed']);
  const scale = w.area && w.area <= 800 ? Math.max(0.9, Math.min(1.6, Math.sqrt(w.area / 150))) : 1 + H('sz') * 0.3;
  for (const r of rooms) { r.w = Math.round(r.w * scale * (0.9 + H('w' + r.name) * 0.2) * 10) / 10; r.d = Math.round(r.d * scale * (0.9 + H('d' + r.name) * 0.2) * 10) / 10; }
  rooms[0].name = w.name + ' · ' + rooms[0].name.toLowerCase();
  const walls = pickH('wall', [0xf2f0ea, 0xe6e1d6, 0xdfe6e3, 0xe9dfd0, 0xd3dce2, 0xefe7d8, 0xcfd6cc]), floor = pickH('floor', [0xb9b2a7, 0x9c8f7d, 0x8a8f94, 0xc7bfae, 0x7b6a58, 0xa7a59e]);
  const spec = { layout: rooms.length > 2 ? pickH('lay', ['row', 'hub', 'L']) : 'row', height: pickH('h', [3, 3.3, 3.6]), walls, floor, rooms };
  let built = null;
  for (let tries = 0; tries < 14 && !built; tries++) {
    try { built = buildInterior({ repo: 'narromine-' + w.id, name: w.name, noBedroom: true, int: spec }, makeLabel); } catch (e) {
      const m = /no room for \w+ in "([^"]+)"/.exec(e.message); if (!m) throw e;
      const r = rooms.find((x) => x.name === m[1]); r.w = Math.round(r.w * 1.12 * 10) / 10; r.d = Math.round(r.d * 1.12 * 10) / 10;
    }
  }
  if (!built) throw new Error(w.name + ': could not fit the fit-out');
  const open = w.opens <= minute && minute < w.closes;
  const here = whoIsAt(pop, w.id, weekday, minute);
  // Staff at their stations, in order; extra staff stand beside the first stations.
  const stations = built.interactables.filter((o) => o.act?.station);
  const SHIRT = { school: 0x2f5f8a, hospital: 0x4a90a4, doctors: 0x4a90a4, police: 0x1c2f4a, fire_station: 0x9b2226, pub: 0x2b2b2b, bar: 0x2b2b2b, cafe: 0x3f3f3f, bakery: 0xf2f2ee, butcher: 0xf2f2ee, pharmacy: 0xf2f2ee, bank: 0x234a6b };
  const centre = (i) => { const r = built.rooms[i]; return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 }; };
  const put = (p, at, shirt) => {
    const f = makePerson(+p.id.slice(3) * 13 + 5, shirt, 0x2f3440).group; if (p.age < 12) f.scale.setScalar(0.72); else if (p.age < 16) f.scale.setScalar(0.88);
    f.position.set(at.x, 0, at.z); f.rotation.y = at.yaw; f.name = p.name; built.group.add(f);
    const l = makeLabel?.(p.first + ' ' + p.surname); if (l) { l.position.set(at.x, 2.25, at.z); built.group.add(l); }
  };
  here.staff.forEach((p, i) => {
    const s = stations[i % Math.max(1, stations.length)]; if (!s) return;
    const c = centre(s.room), dx = c.x - s.pos.x, dz = c.z - s.pos.z, D = Math.hypot(dx, dz) || 1, k = Math.floor(i / Math.max(1, stations.length));
    put(p, { x: s.pos.x + dx / D * 1.0 + k * 0.8, z: s.pos.z + dz / D * 1.0, yaw: Math.atan2(dx, dz) + Math.PI }, SHIRT[w.kind] ?? 0x5a6b7a);
  });
  // Pupils in class (schools): seated rows in the classrooms.
  let pupils = 0;
  if (w.kind === 'school') {
    const kids = pop.people.filter((p) => p.school === w.id && here && open && weekday > 0 && weekday < 6 && minute >= 8 * 60 + 50 && minute < 15 * 60);
    const rooms2 = built.rooms.map((r, i) => [r, i]).filter(([r]) => r.name === 'Classroom');
    kids.slice(0, 40).forEach((p, i) => { const [r] = rooms2[i % rooms2.length]; const row = Math.floor(i / rooms2.length); put(p, { x: r.x0 + 1.5 + (row % 5) * 1.3, z: r.z0 + 2.5 + Math.floor(row / 5) * 1.4, yaw: Math.PI }, 0x2f5f8a); pupils++; });
  }
  return { ...built, workplace: w, open, staff: here.staff, pupils, evidence };
}
