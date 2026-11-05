// Narromine residents: a fictional population calibrated to the ABS 2021 Census QuickStats for the
// Narromine Urban Centre and Locality (UCL115111, https://www.abs.gov.au/census/find-census-data/quickstats/2021/UCL115111).
// Every person is invented; names are generated. Homes are real traced building footprints
// (Microsoft Global ML Building Footprints) next to residential streets, identified by street name only —
// never a house number — so no fictional person is attached to a real household's address.
// Workplaces are the town's mapped businesses and services (OpenStreetMap); staff numbers per workplace
// are estimates, calibrated where the census gives an industry count (schools, hospital, council, Coles,
// social assistance). Pure logic and deterministic: the same town every load. No three.js.
import { PLACES, STREETS } from './narromine-layout.js';
import { NARROMINE_FOOTPRINTS } from './narromine-footprints-data.js';

export const NARROMINE_CENSUS = Object.freeze({
  source: 'ABS 2021 Census QuickStats, Narromine UCL115111', population: 3507, medianAge: 39, privateDwellings: 1607,
  ageBins: [221, 261, 274, 204, 199, 192, 206, 204, 170, 168, 169, 186, 248, 205, 197, 177, 113, 111],   // 0-4 … 85+
  households: { family: 835, lone: 396, group: 35 },
  families: { coupleNoKids: 352, coupleKids: 283, oneParent: 198, other: 14 },
  vehicles: { none: 81, one: 502, two: 442, threePlus: 221 },        // per occupied dwelling (1.8 average)
  labour: { fullTime: 807, partTime: 394, away: 100, unemployed: 80 },
  travelToWork: { carDriver: 913, walked: 75, carPassenger: 72, truck: 17, workedAtHome: 77 },
  industryTop: { primaryEducation: 57, hospitals: 55, localGovernment: 48, supermarket: 37, socialAssistance: 37 },
});

// Deterministic random numbers (mulberry32) so the town is identical every load.
function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
// Largest-remainder apportionment: integer counts that sum exactly to total.
export function apportion(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0), raw = weights.map((w) => w / sum * total), out = raw.map(Math.floor);
  const order = raw.map((v, i) => [v - out[i], i]).sort((a, b) => b[0] - a[0] || a[1] - b[1]);
  for (let n = 0, left = total - out.reduce((a, b) => a + b, 0); n < left; n++) out[order[n][1]]++;
  return out;
}

const FIRST = { male: ['Jack', 'Noah', 'Oliver', 'William', 'Lachlan', 'Thomas', 'James', 'Cooper', 'Riley', 'Harrison', 'Ethan', 'Mason', 'Liam', 'Hamish', 'Angus', 'Tom', 'Matt', 'Ben', 'Sam', 'Luke', 'Daniel', 'Josh', 'Adam', 'Brett', 'Craig', 'Darren', 'Glenn', 'Scott', 'Shane', 'Wayne', 'Peter', 'Graham', 'Kevin', 'Ross', 'Bruce', 'Ian', 'Keith', 'Barry', 'Neville', 'Ken', 'Colin', 'Reg'],
  female: ['Charlotte', 'Olivia', 'Amelia', 'Isla', 'Mia', 'Ava', 'Grace', 'Matilda', 'Ruby', 'Chloe', 'Emily', 'Sophie', 'Jessica', 'Hannah', 'Sarah', 'Kate', 'Emma', 'Lauren', 'Rebecca', 'Megan', 'Kylie', 'Nicole', 'Lisa', 'Michelle', 'Tracey', 'Donna', 'Karen', 'Leanne', 'Julie', 'Debbie', 'Sharon', 'Wendy', 'Helen', 'Robyn', 'Jenny', 'Margaret', 'Judith', 'Lorraine', 'Beverley', 'Dorothy', 'Joan', 'Shirley'] };
const SURNAMES = ['Smith', 'Jones', 'Williams', 'Brown', 'Wilson', 'Taylor', 'Johnson', 'White', 'Martin', 'Anderson', 'Thompson', 'Walker', 'Harris', 'Lee', 'Ryan', 'Robinson', 'Kelly', 'King', 'Campbell', 'Clarke', 'Mitchell', 'Young', 'Hughes', 'Wright', "O'Brien", 'Murphy', 'Cooper', 'Ward', 'Morris', 'Edwards', 'Turner', 'Stewart', 'Hall', 'Wood', 'Baker', 'Green', 'Russell', 'Watson', 'Hill', 'Lewis', 'Bell', 'Kennedy', 'Moore', 'Scott', 'Graham', 'Bennett', 'Fraser', 'Reid', 'Hamilton', 'McDonald', 'Gordon', 'Sullivan', 'Mason', 'Hunter', 'Payne', 'Doyle', 'Byrne', 'Quinn', 'Nolan', 'Dwyer', 'Ferguson', 'Gibson', 'Lawson', 'Hayes', 'Carey', 'Barnes', 'Fisher', 'Webb', 'Kent', 'Dunn'];

// Staff estimates per mapped workplace kind: [staff, opens, closes, weekend?]. Hours are typical for the kind.
const WORK = {
  supermarket: [37, 7 * 60, 21 * 60, true], school: [0, 8 * 60, 15 * 60 + 30, false], hospital: [55, 0, 1440, true], townhall: [40, 8 * 60 + 30, 17 * 60, false],
  government: [8, 9 * 60, 16 * 60 + 30, false], social_facility: [22, 8 * 60, 16 * 60, false], doctors: [12, 8 * 60 + 30, 17 * 60, false], pharmacy: [6, 8 * 60 + 30, 17 * 60 + 30, true],
  police: [10, 0, 1440, true], post_office: [4, 9 * 60, 17 * 60, false], bank: [5, 9 * 60 + 30, 16 * 60, false], pub: [8, 10 * 60, 23 * 60, true], bar: [10, 10 * 60, 23 * 60, true],
  cafe: [6, 6 * 60 + 30, 15 * 60, true], bakery: [6, 5 * 60 + 30, 16 * 60, true], restaurant: [7, 11 * 60, 21 * 60, true], butcher: [5, 7 * 60, 17 * 60, false], fuel: [5, 6 * 60, 20 * 60, true],
  car_repair: [6, 7 * 60 + 30, 17 * 60, false], agrarian: [12, 7 * 60 + 30, 17 * 60, false], trade: [8, 7 * 60 + 30, 16 * 60 + 30, false], hvac: [6, 7 * 60 + 30, 16 * 60 + 30, false],
  library: [3, 9 * 60 + 30, 17 * 60, false], courthouse: [3, 9 * 60, 16 * 60, false], fire_station: [2, 8 * 60, 16 * 60, false], employment_agency: [4, 9 * 60, 17 * 60, false],
  estate_agent: [4, 9 * 60, 17 * 60, false], hairdresser: [3, 9 * 60, 17 * 60, false], beauty: [2, 9 * 60, 17 * 60, false], clothes: [3, 9 * 60, 17 * 60, false], fashion_accessories: [2, 9 * 60, 17 * 60, false],
  houseware: [3, 9 * 60, 17 * 60, false], tobacco: [2, 8 * 60, 18 * 60, true], alcohol: [3, 10 * 60, 20 * 60, true], charity: [3, 9 * 60, 16 * 60, false], second_hand: [2, 9 * 60, 16 * 60, false],
  jewelry: [2, 9 * 60, 17 * 60, false], laundry: [1, 7 * 60, 19 * 60, true], car: [6, 8 * 60, 17 * 60, false], tyres: [5, 7 * 60 + 30, 17 * 60, false], car_wash: [1, 8 * 60, 17 * 60, true],
  caravan: [4, 8 * 60, 17 * 60, false], camp_site: [3, 8 * 60, 18 * 60, true], guest_house: [3, 7 * 60, 19 * 60, true], museum: [2, 9 * 60, 16 * 60, true], physiotherapist: [3, 8 * 60, 17 * 60, false],
  alternative: [2, 9 * 60, 17 * 60, false], educational_institution: [3, 15 * 60, 19 * 60, false], photographer: [1, 9 * 60, 17 * 60, false], coworking: [2, 9 * 60, 17 * 60, false],
  animal_shelter: [3, 8 * 60, 16 * 60, true], sports_centre: [6, 6 * 60, 19 * 60, true], golf_course: [3, 7 * 60, 17 * 60, true], railway_station: [2, 7 * 60, 15 * 60, false],
  aerodrome: [3, 8 * 60, 17 * 60, true], community_centre: [1, 9 * 60, 15 * 60, false],
};
const SCHOOL_STAFF = { 'Narromine Public School': 30, 'Narromine High School': 38, 'St Augustines Parish School': 14, 'Narromine Christian School': 8 };
// Jobs outside the mapped town, reached by road (a share of workers drive out each day).
export const AWAY_WORK = Object.freeze([
  { id: 'farm', name: 'farms around Narromine', share: 0.20, opens: 6 * 60, closes: 16 * 60, weekend: true, direction: 'west' },
  { id: 'dubbo', name: 'Dubbo (about 40 km east)', share: 0.15, opens: 8 * 60, closes: 17 * 60, weekend: false, direction: 'east' },
  { id: 'repotown', name: 'Repository Town', share: 0.04, opens: 8 * 60, closes: 17 * 60, weekend: false, direction: 'east' },
  { id: 'graincorp', name: 'grain receival site and rail yard', share: 0.04, opens: 6 * 60, closes: 15 * 60, weekend: false, direction: 'local' },
]);

const segNearest = (x, z) => {
  let best = null, bd = Infinity;
  for (const s of STREETS) {
    if (!['residential', 'tertiary', 'unclassified', 'secondary', 'living_street'].includes(s.kind) || !s.name) continue;
    for (let i = 1; i < s.pts.length; i++) {
      const [ax, az] = s.pts[i - 1], [bx, bz] = s.pts[i], dx = bx - ax, dz = bz - az, L = dx * dx + dz * dz || 1;
      const t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz);
      if (d < bd) { bd = d; best = { street: s.name, kind: s.kind, d, x: px, z: pz }; }
    }
  }
  return best;
};

// Homes: footprints of house size next to a named street, away from mapped businesses.
export function residentialHomes() {
  const out = [];
  for (const [x, z, w, d, yaw, h] of NARROMINE_FOOTPRINTS) {
    const area = w * d;
    if (area < 70 || area > 420) continue;
    if (PLACES.some((p) => Math.hypot(p.x - x, p.z - z) < 30)) continue;
    const s = segNearest(x, z);
    if (!s || s.d > 40) continue;
    out.push({ id: 'home-' + out.length, x, z, w, d, yaw, height: h, area: Math.round(area), street: s.street, kerb: { x: s.x, z: s.z } });
  }
  return out;
}

export function buildWorkplaces() {
  const list = [];
  for (const p of PLACES) {
    const spec = WORK[p.kind]; if (!spec) continue;
    const staff = p.kind === 'school' ? SCHOOL_STAFF[p.name] || 8 : spec[0];
    if (!staff) continue;
    list.push({ id: 'work-' + list.length, name: p.name, kind: p.kind, x: p.x, z: p.z, staff, opens: spec[1], closes: spec[2], weekend: spec[3] });
  }
  return list;
}

export function createNarrominePopulation(seed = 20211810) {
  const r = rng(seed), pick = (a) => a[Math.floor(r() * a.length)];
  const C = NARROMINE_CENSUS, homes = residentialHomes(), workplaces = buildWorkplaces();
  const occupied = C.households.family + C.households.lone + C.households.group;
  // Use as many real homes as the census has occupied dwellings (or all suitable ones if fewer).
  const usable = homes.slice(0, Math.min(homes.length, occupied)), scale = usable.length / occupied;
  const people = [], households = [];
  // Ages: apportion the census age bins to the (scaled) population, then shuffle within households.
  const total = Math.round(C.population * scale), bins = apportion(total, C.ageBins), ages = [];
  bins.forEach((n, i) => { for (let k = 0; k < n; k++) ages.push(i === 17 ? 85 + Math.floor(r() * 8) : i * 5 + Math.floor(r() * 5)); });
  const adults = ages.filter((a) => a >= 18).sort((a, b) => a - b), kids = ages.filter((a) => a < 18).sort((a, b) => a - b);
  const takeAdult = (lo, hi) => { let i = adults.findIndex((a) => a >= lo && a <= hi); if (i < 0) i = adults.length ? Math.floor(r() * adults.length) : -1; return i < 0 ? 30 : adults.splice(i, 1)[0]; };
  const [nLone, nGroup] = [Math.round(C.households.lone * scale), Math.round(C.households.group * scale)];
  const fam = apportion(usable.length - nLone - nGroup, Object.values(C.families));
  const types = [...Array(nLone).fill('lone'), ...Array(nGroup).fill('group'), ...Array(fam[0]).fill('coupleNoKids'), ...Array(fam[1]).fill('coupleKids'), ...Array(fam[2]).fill('oneParent'), ...Array(fam[3]).fill('other')];
  // Spread household types across homes deterministically (larger houses get families with children first).
  const order = usable.map((h, i) => [h.area + r() * 60, i]).sort((a, b) => b[0] - a[0]).map((x) => x[1]);
  const typeOrder = [...types].sort((a, b) => ['coupleKids', 'oneParent', 'other', 'group', 'coupleNoKids', 'lone'].indexOf(a) - ['coupleKids', 'oneParent', 'other', 'group', 'coupleNoKids', 'lone'].indexOf(b));
  const person = (hh, age, role, gender) => {
    gender ??= r() < 0.489 ? 'male' : 'female';
    const p = { id: 'nr-' + people.length, first: pick(FIRST[gender]), surname: hh.surname, gender, age, role, home: hh.id, household: hh.id, job: null, workplace: null, school: null, drives: false, car: null };
    p.name = p.first + ' ' + p.surname; people.push(p); hh.members.push(p.id); return p;
  };
  order.forEach((homeIndex, k) => {
    const h = usable[homeIndex], type = typeOrder[k] || 'lone';
    const hh = { id: 'hh-' + households.length, home: h.id, street: h.street, type, surname: pick(SURNAMES), members: [], cars: [], fridge: { milk: 2, bread: 1, eggs: 6, meat: 2, veg: 4, fruit: 4, cereal: 1 }, lastShop: -1 };
    households.push(hh); h.household = hh.id;
    if (type === 'lone') person(hh, takeAdult(20, 95), 'adult');
    else if (type === 'group') { person(hh, takeAdult(18, 35), 'adult'); person(hh, takeAdult(18, 35), 'adult'); if (r() < 0.4) person(hh, takeAdult(18, 35), 'adult'); }
    else if (type === 'coupleNoKids') { const a = takeAdult(22, 95); person(hh, a, 'partner', 'male'); person(hh, Math.max(18, takeAdult(a - 8, a + 6)), 'partner', 'female'); }
    else if (type === 'other') { person(hh, takeAdult(30, 80), 'adult'); person(hh, takeAdult(18, 80), 'relative'); }
    else {
      const a = takeAdult(25, 55); person(hh, a, 'parent', type === 'oneParent' ? (r() < 0.84 ? 'female' : 'male') : 'male');
      if (type === 'coupleKids') person(hh, Math.max(22, takeAdult(a - 6, a + 4)), 'parent', 'female');
      const n = 1 + (r() < 0.55 ? 1 : 0) + (r() < 0.2 ? 1 : 0);     // ~2 children per family with children
      for (let c = 0; c < n && kids.length; c++) { let i = kids.findIndex((x) => x <= a - 18); if (i < 0) i = 0; person(hh, kids.splice(i, 1)[0], 'child'); }
    }
  });
  // Any remaining people join households as adult children or relatives so totals match the census.
  for (const age of [...kids, ...adults]) { const hh = households[Math.floor(r() * households.length)]; person(hh, age, age < 18 ? 'child' : 'relative'); }

  // Schools by age (public/high most, Catholic and Christian schools smaller shares).
  const schools = workplaces.filter((w) => w.kind === 'school');
  const sch = (name) => schools.find((s) => s.name === name);
  for (const p of people) {
    if (p.age >= 5 && p.age <= 11) p.school = (r() < 0.72 ? sch('Narromine Public School') : r() < 0.7 ? sch('St Augustines Parish School') : sch('Narromine Christian School'))?.id || null;
    else if (p.age >= 12 && p.age <= 17) p.school = (r() < 0.9 ? sch('Narromine High School') : sch('Narromine Christian School'))?.id || null;
  }
  // Employment: the census labour-force counts, given to working-age adults (older ones less often).
  const C15 = C.labour, employed = Math.round((C15.fullTime + C15.partTime + C15.away) * scale);
  const candidates = people.filter((p) => p.age >= 16 && p.age <= 74).map((p) => [p, (p.age < 20 ? 0.5 : p.age < 60 ? 1 : p.age < 67 ? 0.55 : 0.12) * (0.6 + r() * 0.8)]).sort((a, b) => b[1] - a[1]);
  const workers = candidates.slice(0, employed).map((x) => x[0]);
  const slots = [];
  for (const w of workplaces) for (let i = 0; i < w.staff; i++) slots.push(w.id);
  const awayTotal = Math.max(0, workers.length - slots.length);
  const awayCounts = apportion(awayTotal, AWAY_WORK.map((a) => a.share));
  AWAY_WORK.forEach((a, i) => { for (let k = 0; k < awayCounts[i]; k++) slots.push(a.id); });
  for (let i = slots.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [slots[i], slots[j]] = [slots[j], slots[i]]; }
  workers.forEach((p, i) => { p.workplace = slots[i] || 'farm'; p.partTime = r() < C15.partTime / (C15.fullTime + C15.partTime); });
  for (const p of people) if (!p.workplace && p.age >= 67) p.retired = true;

  // Cars per household from the census distribution; drivers are adults 18+ (most older adults still drive).
  const v = C.vehicles, carCounts = apportion(households.length, [v.none, v.one, v.two, v.threePlus]);
  const carsFor = [];
  carCounts.forEach((n, i) => { for (let k = 0; k < n; k++) carsFor.push(i === 3 ? 3 : i); });
  const hhBySize = [...households].sort((a, b) => b.members.length - a.members.length || a.id.localeCompare(b.id));
  carsFor.sort((a, b) => b - a);
  const cars = [];
  hhBySize.forEach((hh, i) => {
    const n = carsFor[i] ?? 1;
    const drivers = hh.members.map((id) => people[+id.slice(3)]).filter((p) => p.age >= 18 && p.age < 90).sort((a, b) => (b.workplace ? 1 : 0) - (a.workplace ? 1 : 0));
    for (let k = 0; k < n; k++) {
      const car = { id: 'car-' + cars.length, household: hh.id, home: hh.home, model: null, colour: null, driver: drivers[k]?.id || drivers[0]?.id || null };
      cars.push(car); hh.cars.push(car.id);
      if (drivers[k]) { drivers[k].drives = true; drivers[k].car = car.id; }
    }
  });
  return { census: C, homes: usable, allHomes: homes.length, households, people, workplaces, cars, scale, workers: workers.length };
}

// One person's day as a list of activities: {from, to, at, kind}. `at` is 'home', a workplace id,
// a school id, 'coles' or an AWAY_WORK id. Wake, breakfast and sleep are 'home' activities.
export function dayPlan(p, hh, weekday, workplaces) {
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return (h >>> 0) / 4294967296; };
  const j = (k, span) => Math.round((hash(p.id + k + weekday) - 0.5) * span);
  const weekend = weekday === 0 || weekday === 6, plan = [];
  const wp = workplaces.find((w) => w.id === p.workplace) || AWAY_WORK.find((a) => a.id === p.workplace);
  let wake = 6 * 60 + 30 + j('w', 60);
  if (wp && (!weekend || wp.weekend)) {
    const commute = wp.direction === 'east' ? 45 : wp.direction === 'west' ? 25 : 10;
    const long = wp.closes - wp.opens > 11 * 60;                       // hospital, police, pubs: shifts
    let start = long ? (hash(p.id + 'shift') < 0.5 ? 7 * 60 : 14 * 60 + 30) : wp.opens + j('s', 20);
    let end = long ? start + 8 * 60 + 30 : Math.min(wp.closes + 15, start + (p.partTime ? 5 * 60 : 8 * 60 + 30));
    if (weekend && hash(p.id + 'wk' + weekday) < 0.5) return quietDay(p, weekday, hash);   // rostered off
    wake = Math.max(4 * 60 + 30, start - commute - 60 + j('b', 20));
    plan.push({ from: 0, to: wake, at: 'home', kind: 'sleep' }, { from: wake, to: start - commute, at: 'home', kind: 'breakfast' });
    plan.push({ from: start - commute, to: start, at: p.workplace, kind: 'travel' }, { from: start, to: end, at: p.workplace, kind: 'work' });
    let t = end;
    if (hash(hh.id + 'shop' + weekday) < 0.3 && end < 19 * 60) { plan.push({ from: t, to: t + 35, at: 'coles', kind: 'shop' }); t += 35; }
    plan.push({ from: t, to: 18 * 60 + 30 + j('d', 40), at: 'home', kind: 'home' });
    const dinner = Math.max(t + 20, plan.at(-1).to);
    const bed = Math.max(dinner + 60, 22 * 60 + j('z', 60));
    plan.push({ from: dinner, to: dinner + 45, at: 'home', kind: 'dinner' }, { from: dinner + 45, to: bed, at: 'home', kind: 'evening' }, { from: bed, to: 1440, at: 'home', kind: 'sleep' });
    return plan.map((s) => ({ ...s, from: Math.max(0, Math.min(1440, s.from)), to: Math.max(0, Math.min(1440, s.to)) })).filter((s) => s.to > s.from);
  }
  if (p.school && !weekend) {
    const up = 7 * 60 + j('w', 30);
    plan.push({ from: 0, to: up, at: 'home', kind: 'sleep' }, { from: up, to: 8 * 60 + 25, at: 'home', kind: 'breakfast' },
      { from: 8 * 60 + 25, to: 8 * 60 + 50, at: p.school, kind: 'travel' }, { from: 8 * 60 + 50, to: 15 * 60, at: p.school, kind: 'school' },
      { from: 15 * 60, to: 18 * 60 + 30, at: 'home', kind: 'home' }, { from: 18 * 60 + 30, to: 19 * 60 + 15, at: 'home', kind: 'dinner' }, { from: 19 * 60 + 15, to: 1440, at: 'home', kind: 'sleep' });
    return plan;
  }
  return quietDay(p, weekday, hash);
}
function quietDay(p, weekday, hash) {
  const wake = (p.age > 65 ? 6 * 60 : p.age < 5 ? 6 * 60 + 30 : 7 * 60 + 30) + Math.round((hash(p.id + 'q' + weekday) - 0.5) * 60);
  const plan = [{ from: 0, to: wake, at: 'home', kind: 'sleep' }, { from: wake, to: wake + 45, at: 'home', kind: 'breakfast' }];
  let t = wake + 45;
  if (p.age >= 18 && hash(p.household + 'shop' + weekday) < 0.45) { const s = Math.max(t, 9 * 60 + Math.round(hash(p.id + 'sh') * 240)); plan.push({ from: t, to: s, at: 'home', kind: 'home' }, { from: s, to: s + 40, at: 'coles', kind: 'shop' }); t = s + 40; }
  plan.push({ from: t, to: 18 * 60, at: 'home', kind: 'home' }, { from: 18 * 60, to: 18 * 60 + 45, at: 'home', kind: 'dinner' }, { from: 18 * 60 + 45, to: 1440, at: 'home', kind: 'sleep' });
  return plan;
}
