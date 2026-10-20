import { separatePedestrians } from './pedestrian-spacing.js';
import { orderCafe } from './cafe-menu.js';
import { bicycleClear, cyclingRoute } from './bicycle-safety.js';
import { pedestrianDetour,canFinishNearOccupiedDoor } from './pedestrian-navigation.js';
import { distributePower, townPowerDemands, POWER_LINE_IDS, GRID_FAULT_COST } from './power-grid.js';
import { initialisePublicLife, attendPublicForum, updatePublicForum, civicDialogue } from './public-forum.js';
import { freshFinance, noteSale, noteRates, withhold, stateFunded, drawState, noteCouncilWage, dailyGrants, dailyClose as financeDailyClose, payBills, economyReport, bizStats, governmentMoney } from './finance.js';
import { receipt, tickJobs, startJob, performTask, abandonJob, finishJob, jobsReport, current as currentJob, supervisors } from './jobs.js';
import { freshCredit, recordEarning, noteBank, creditReport, borrow, repay, accrueInterest } from './credit.js';
import { startNeeds, advanceNeeds, eatPlayer, hotelCheckIn, sleepPlayer, needsReport, FOOD_ENERGY } from './needs.js';
import { MAYOR_CANDIDATES, createGovernment, civicElection, castCivicVote, submitRequest, requestFeeder, proposeMotion, councilMeeting, advanceCivicWork, budgetRevenue, restoreCivic, govSummary, maintainServices } from './government.js';
import { initialiseLivestock, advanceLivestockDay, productiveHerdFraction, herdReport } from './livestock.js';
// Town life simulation: the clock, farms, the mill and bakery, shops, trucks, the post,
// and villagers with jobs, hunger, pantries, wallets and daily routines. Pure logic (no
// three.js) so it runs and is tested on its own; src/world/townlife.js draws it.
//
// Time: three real seconds are one town minute, so a day lasts 72 real minutes (the
// player can speed it up). People and trucks move at real speed, so distances in town
// minutes come from SEC_PER_MIN.
// Places sit on street 8's empty lots (G8–Z8) and the farm strip south of it.

export const LOT_X = 26, LOT_Z = 46;
export const TOWN_CLOCK = Object.freeze({ minutesPerDay:1440, realSecondsPerTownMinute:3 });
export const SEC_PER_MIN = TOWN_CLOCK.realSecondsPerTownMinute; // 72 real minutes per 24-hour town day at 1×
export const WALK = 1.5, BIKE = 4.5, DRIVE = 8;               // metres per real second
const WAGES = { retired: 40, student: 20, mayor: 95, nurse: 85, teacher: 85, programmer: 95, 'bank teller': 75, 'power operator': 85, firefighter: 85 };
const BASE_WAGE = 70;
// Per-worker harvest multipliers: a market garden and a chook shed out-produce a paddock per hand.
const FARM_YIELD = { veg: 1.6, eggs: 1.5 };
// Workplaces paid from the town treasury; everyone else is paid from their employer's till.
const PUBLIC = new Set(['hall', 'school', 'clinic', 'post', 'depot', 'power', 'waterworks', 'sewage', 'recycling', 'landfill', 'fire', 'bank', 'square']);
const WEATHER = ['sunny', 'sunny', 'cloudy', 'rainy', 'windy', 'sunny', 'cloudy'];
const SERVICES = ['power', 'water', 'sewage', 'roads', 'waste', 'post'];
export const CANDIDATES = MAYOR_CANDIDATES;
const ROAD = (r) => r * LOT_Z - 3.5 * LOT_Z + 16;            // road centre line of street r (0-based)
const lotX = (col) => (col - 12.5) * LOT_X;
const LOT8_Z = 7 * LOT_Z - 3.5 * LOT_Z;                       // z of the street-8 lot centres
export const AVENUES = [0, 5, 10, 15, 20, 25].map((c) => (c - 13) * LOT_X);
export const FIELD_Z0 = ROAD(7) + 8, FIELD_Z1 = ROAD(7) + 34;  // farm strip south of street 8

export const GOODS = {
  grain: { name: 'grain', unit: 'bag', price: 2 },
  flour: { name: 'flour', unit: 'bag', price: 4 },
  bread: { name: 'bread', unit: 'loaf', price: 5 },
  pie: { name: 'pies', unit: 'pie', price: 7 },
  veg: { name: 'vegetables', unit: 'box', price: 4 },
  fruit: { name: 'fruit', unit: 'bag', price: 4 },
  eggs: { name: 'eggs', unit: 'dozen', price: 6 },
  milk: { name: 'milk', unit: 'bottle', price: 3 },
  lamb: { name: 'lamb', unit: 'cut', price: 12 },
  wool: { name: 'wool', unit: 'bale', price: 10 },
  hay: { name: 'hay', unit: 'bale', price: 3 },
  coffee: { name: 'coffee beans', unit: 'bag', price: 9 },
  tea: { name: 'tea', unit: 'tin', price: 6 },
  parcel: { name: 'parcels', unit: 'parcel', price: 0 },
  fuel: { name: 'fuel', unit: 'drum', price: 3 },
  ore: { name: 'ore', unit: 'tonne', price: 4 },
  scrap: { name: 'scrap metal', unit: 'crate', price: 2 },
  parts: { name: 'spare parts', unit: 'box', price: 12 },
};

// col letter → place. `sells` are what villagers can buy; `makes` what work produces.
export const PLACE_DEFS = [
  { col: 'G', id: 'hall', name: 'Town Hall', kind: 'hall', opens: 9 * 60, closes: 17 * 60, target: { parts: 10 } },
  { col: 'H', id: 'store', name: 'General Store', kind: 'shop', sells: ['eggs', 'milk', 'flour', 'tea', 'coffee', 'bread'], opens: 7 * 60, closes: 19 * 60, target: { eggs: 20, milk: 20, flour: 10, tea: 10, coffee: 10, bread: 10 } },
  { col: 'I', id: 'bakery', name: 'Bakery', kind: 'shop', sells: ['bread', 'pie'], opens: 6 * 60, closes: 18 * 60, target: { flour: 12, eggs: 6, milk: 6, lamb: 6, veg: 6 } },
  { col: 'J', id: 'cafe', name: 'Commit Café', kind: 'cafe', opens: 6 * 60 + 30, closes: 16 * 60, target: { bread: 10, eggs: 10, milk: 10, coffee: 6, veg: 6, pie: 6 } },
  { col: 'K', id: 'greengrocer', name: 'Greengrocer', kind: 'shop', sells: ['veg', 'fruit'], opens: 8 * 60, closes: 18 * 60, target: { veg: 24, fruit: 20 } },
  { col: 'L', id: 'butcher', name: 'Butcher', kind: 'shop', sells: ['lamb'], opens: 8 * 60, closes: 17 * 60 + 30, target: { lamb: 16 } },
  { col: 'M', id: 'square', name: 'Market Square', kind: 'park', opens: 0, closes: 24 * 60 },
  { col: 'N', id: 'pub', name: 'The Merged Branch', kind: 'pub', opens: 11 * 60, closes: 23 * 60, target: { lamb: 8, veg: 10, pie: 6, bread: 6 } },
  { col: 'O', id: 'post', name: 'Post Office', kind: 'post', opens: 8 * 60, closes: 17 * 60, target: { parcel: 12 } },
  { col: 'P', id: 'school', name: 'School', kind: 'school', opens: 8 * 60 + 30, closes: 15 * 60 },
  { col: 'Q', id: 'clinic', name: 'Clinic', kind: 'clinic', opens: 8 * 60, closes: 17 * 60 },
  { col: 'R', id: 'depot', name: 'Rail Depot', kind: 'depot', opens: 6 * 60, closes: 18 * 60 },
  { col: 'S', id: 'mill', name: 'Flour Mill', kind: 'mill', opens: 7 * 60, closes: 16 * 60, target: { grain: 20 } },
  { col: 'T', id: 'sheep', name: 'Sheep Station', kind: 'farm', makes: 'wool', feedTarget: { hay: 18 }, opens: 6 * 60, closes: 15 * 60 },
  { col: 'U', id: 'dairy', name: 'Dairy', kind: 'farm', makes: 'milk', feedTarget: { hay: 24 }, opens: 5 * 60, closes: 14 * 60 },
  { col: 'V', id: 'coop', name: 'Chook Shed', kind: 'farm', makes: 'eggs', feedTarget: { grain: 12 }, opens: 6 * 60, closes: 14 * 60 },
  { col: 'W', id: 'orchard', name: 'Orchard', kind: 'farm', makes: 'fruit', opens: 7 * 60, closes: 15 * 60 },
  { col: 'X', id: 'garden', name: 'Market Garden', kind: 'farm', makes: 'veg', opens: 6 * 60, closes: 15 * 60 },
  { col: 'Y', id: 'silo', name: 'Wheat Farm', kind: 'farm', makes: 'grain', opens: 6 * 60, closes: 16 * 60 },
  { col: 'Z', id: 'farmhouse', name: 'Farmhouse', kind: 'home', opens: 0, closes: 24 * 60 },
  // Across the road from the high street (south side): finance, utilities and industry.
  { col: 'G', side: 'south', id: 'bank', name: 'Community Bank', kind: 'bank', opens: 9 * 60, closes: 16 * 60 },
  { col: 'I', side: 'south', id: 'hotel', name: 'Railway Hotel', kind: 'hotel', opens: 0, closes: 24 * 60 },
  { col: 'H', side: 'south', id: 'power', name: 'Power Station', kind: 'utility', opens: 0, closes: 24 * 60, target: { fuel: 160 } },
  { col: 'J', side: 'south', id: 'waterworks', name: 'Water Works', kind: 'utility', opens: 0, closes: 24 * 60 },
  { col: 'L', side: 'south', id: 'sewage', name: 'Wastewater Works', kind: 'utility', opens: 0, closes: 24 * 60 },
  { col: 'N', side: 'south', id: 'fire', name: 'Fire & Rescue', kind: 'fire', opens: 0, closes: 24 * 60 },
  { col: 'P', side: 'south', id: 'recycling', name: 'Recycling Centre', kind: 'utility', opens: 7 * 60, closes: 16 * 60 },
  { col: 'Q', side: 'south', id: 'landfill', name: 'Waste Depot', kind: 'utility', opens: 6 * 60, closes: 17 * 60 },
  { col: 'R', side: 'south', id: 'foundry', name: 'Foundry & Workshop', kind: 'industry', opens: 7 * 60, closes: 16 * 60, target: { ore: 40, scrap: 20 } },
];

const JOBS = [
  ['farmer', 'silo', 6 * 60, 16 * 60], ['farmer', 'garden', 6 * 60, 15 * 60], ['farmer', 'orchard', 7 * 60, 15 * 60],
  ['dairy hand', 'dairy', 5 * 60, 14 * 60], ['poultry keeper', 'coop', 6 * 60, 14 * 60], ['shearer', 'sheep', 6 * 60, 15 * 60],
  ['miller', 'mill', 7 * 60, 16 * 60], ['baker', 'bakery', 4 * 60 + 30, 13 * 60], ['baker', 'bakery', 6 * 60, 15 * 60],
  ['barista', 'cafe', 6 * 60 + 15, 15 * 60], ['cook', 'cafe', 7 * 60, 15 * 60 + 30], ['grocer', 'greengrocer', 7 * 60 + 30, 17 * 60],
  ['shopkeeper', 'store', 7 * 60 + 30, 18 * 60], ['butcher', 'butcher', 7 * 60 + 30, 16 * 60], ['publican', 'pub', 11 * 60, 23 * 60],
  ['postie', 'post', 8 * 60, 14 * 60], ['truck driver', 'depot', 6 * 60, 16 * 60], ['truck driver', 'depot', 7 * 60, 17 * 60],
  ['truck driver', 'depot', 6 * 60 + 30, 15 * 60], ['teacher', 'school', 8 * 60, 15 * 60 + 30], ['nurse', 'clinic', 8 * 60, 17 * 60],
  ['mayor', 'hall', 9 * 60, 16 * 60], ['station master', 'depot', 6 * 60, 15 * 60], ['programmer', 'home', 9 * 60, 17 * 60],
  ['programmer', 'home', 10 * 60, 18 * 60], ['retired', 'square', 9 * 60, 12 * 60], ['student', 'school', 8 * 60 + 30, 15 * 60],
  ['student', 'school', 8 * 60 + 30, 15 * 60], ['artist', 'square', 10 * 60, 15 * 60], ['retired', 'square', 14 * 60, 17 * 60],
  ['farmer', 'silo', 7 * 60, 15 * 60], ['grocer', 'greengrocer', 8 * 60, 16 * 60],
  ['power operator', 'power', 6 * 60, 18 * 60], ['water operator', 'waterworks', 7 * 60, 15 * 60], ['recycler', 'recycling', 7 * 60, 15 * 60],
  ['firefighter', 'fire', 8 * 60, 18 * 60], ['bank teller', 'bank', 8 * 60 + 30, 16 * 60 + 30], ['foundry worker', 'foundry', 7 * 60, 15 * 60],
];
// Villager names; src/ui/social.js keeps their friendships and grudges.
export const VILLAGER_NAMES = ['Mabel', 'Arlo', 'Bea', 'Cas', 'Dot', 'Ezra', 'Flo', 'Gus', 'Hattie', 'Ivo', 'June', 'Kip', 'Lou', 'Merv', 'Nora', 'Ollie',
  'Peg', 'Rafe', 'Sadie', 'Theo', 'Una', 'Vern', 'Win', 'Zara', 'Bluey', 'Clem', 'Dulcie', 'Errol', 'Fern', 'Gwen', 'Harlan', 'Ida',
  'Archie', 'Bonnie', 'Cooper', 'Daisy', 'Elsie', 'Frankie'];

// Home meals: [name, ingredients]. Villagers cook the first one their pantry can make.
const MEALS = {
  breakfast: [['toast and scrambled eggs', { bread: 1, eggs: 1 }], ['fruit and a glass of milk', { fruit: 1, milk: 1 }], ['toast with butter and a cuppa', { bread: 1 }]],
  lunch: [['a salad sandwich', { bread: 1, veg: 1 }], ['leftover pie', { pie: 1 }], ['an apple and some bread', { fruit: 1, bread: 1 }]],
  dinner: [['roast lamb and veg', { lamb: 1, veg: 1 }], ['a vegie omelette', { eggs: 1, veg: 1 }], ['a meat pie with peas', { pie: 1 }], ['vegetable soup with bread', { veg: 1, bread: 1 }]],
};
const OUT_MEALS = {
  cafe: [
    { name: 'egg and tomato breakfast roll', price: 9, ingredients: { bread: 1, eggs: 1 } },
    { name: 'big breakfast', price: 14, ingredients: { bread: 1, eggs: 2, milk: 1 } },
    { name: 'flat white and toast', price: 8, ingredients: { coffee: 1, bread: 1 } },
    { name: 'egg toastie', price: 9, ingredients: { bread: 1, eggs: 1 } },
    { name: 'vegetable soup and bread', price: 10, ingredients: { veg: 1, bread: 1 } },
  ],
  pub: [
    { name: 'roast lamb and vegetables', price: 24, ingredients: { lamb: 1, veg: 1 } },
    { name: 'meat pie and greens', price: 18, ingredients: { pie: 1, veg: 1 } },
    { name: 'lamb and bread', price: 22, ingredients: { lamb: 1, bread: 1 } },
  ],
};

const plural = (unit, n) => (n === 1 ? unit : /[sx]$|ch$/.test(unit) ? `${unit}es` : unit === 'loaf' ? 'loaves' : `${unit}s`);
export const amount = (good, n) => (GOODS[good].unit === 'dozen' ? `${n} dozen ${GOODS[good].name}` : `${n} ${plural(GOODS[good].unit, n)} of ${GOODS[good].name}`);
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (m) => `${String(Math.floor(m / 60) % 24).padStart(2, '0')}:${String(Math.floor(m % 60)).padStart(2, '0')}`;
export const timeText = fmt;

// ── Truck footprints ───────────────────────────────────────────────────────
// A delivery truck is about 6.6 m × 2.2 m (see makeTruck in townlife.js). Boxes are oriented:
// (fx, fz) is the unit forward vector and half-extents run along it (hl) and across it (hw).
export const TRUCK = { hl: 3.3, hw: 1.2, gap: 0.15, turn: 1.5, site: 10, follow: 11 };
// turn: rad per real second. site: hold-off radius (m) round a stop in use. follow: same-lane
// following distance (m, centre to centre) so the truck in front always has room to turn out.
export function truckBox(x, z, heading, grow = 0) { return { x, z, fx: Math.sin(heading), fz: Math.cos(heading), hl: TRUCK.hl + grow, hw: TRUCK.hw + grow }; }
export function boxesOverlap(a, b) {
  for (const [ax, az] of [[a.fx, a.fz], [a.fz, -a.fx], [b.fx, b.fz], [b.fz, -b.fx]]) {
    const ra = a.hl * Math.abs(a.fx * ax + a.fz * az) + a.hw * Math.abs(a.fz * ax - a.fx * az);
    const rb = b.hl * Math.abs(b.fx * ax + b.fz * az) + b.hw * Math.abs(b.fz * ax - b.fx * az);
    if (Math.abs((b.x - a.x) * ax + (b.z - a.z) * az) >= ra + rb) return false;
  }
  return true;
}
const clampAbs = (v, m) => Math.max(-m, Math.min(m, v));
function angleDiff(a, b) { let d = a - b; while (d > Math.PI) d -= Math.PI * 2; while (d < -Math.PI) d += Math.PI * 2; return d; }

// Seeded random so a new town always starts the same way.
function rng(seed) {
  let s = seed >>> 0;
  const next = () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
  next.getState = () => s;
  next.setState = (state) => { if (!Number.isInteger(state) || state < 0 || state > 0xffffffff) throw new RangeError('Invalid random-generator state'); s = state >>> 0; };
  return next;
}
// Live simulation state saved so a reload resumes exactly where the town was (positions, routes, trucks, random state).
const SIM_VILLAGER_FIELDS = ['x', 'z', 'heading', 'inside', 'path', 'step', 'activity', 'hunger', 'fatigue', 'restedMinutes', 'wallet', 'savings', 'pantry', 'carrying', 'lastMeal', 'meals', 'seen', 'doneToday', 'queue', 'paidDay', 'bike', 'memory', 'wageArrears', 'rateArrears', 'housingArrears', 'detourWait'];
const SIM_TRUCK_FIELDS = ['x', 'z', 'heading', 'path', 'job', 'leg', 'load', 'wait', 'state', 'braking', 'jam', 'siteAt', 'pulling', 'blockedBy', 'blockedFor', 'why', 'ignoreSite', 'retreat', 'reverse'];

// ── Walking routes ─────────────────────────────────────────────────────────
const rowOf = (z) => { let best = 0; for (let r = 1; r < 8; r++) if (Math.abs(ROAD(r) - z) < Math.abs(ROAD(best) - z)) best = r; return best; };
const sideZ = (r, z, off = 5.3) => (z < ROAD(r) ? ROAD(r) - off : ROAD(r) + off);
// Footpath route: out to the footpath, along it, up an avenue if changing street, back in.
export function walkRoute(a, b) {
  const ra = rowOf(a.z), rb = rowOf(b.z);
  // Pedestrians and cycles travelling in opposite directions need separate
  // lanes, not a shared single-file route in front of every shop.
  const setback=b.x>=a.x?6.6:4.5;
  const sa = sideZ(ra, a.z, setback), sb = sideZ(rb, b.z, setback);
  const pts = [{ x: a.x, z: sa }];
  if (!(ra === rb && sa === sb)) {
    const ave = AVENUES.reduce((p, c) => (Math.abs(a.x - c) + Math.abs(b.x - c) < Math.abs(a.x - p) + Math.abs(b.x - p) ? c : p));
    // Walk up the edge of the avenue, clear of the trucks' lanes and the corner houses.
    const avenueTrack=ave+(sb>=sa?6.7:4.7);
    pts.push({ x: avenueTrack, z: sa }, { x: avenueTrack, z: sb });
  }
  pts.push({ x: b.x, z: sb }, { x: b.x, z: b.z });
  return pts;
}
// Road route for trucks, driving on the left (Australia): heading +x the left lane is −z;
// heading +z it is +x. Along the street, up the nearest avenue if changing street.
export function driveRoute(a, b) {
  const ra = rowOf(a.z), rb = rowOf(b.z);
  const lane = (r, dir) => ROAD(r) + (dir > 0 ? -1.7 : 1.7);
  const pts = [];
  if (ra === rb) {
    const d = Math.sign(b.x - a.x) || 1;
    // Pulls out into the lane over a few metres instead of sliding sideways.
    pts.push({ x: a.x + d * Math.min(5, Math.abs(b.x - a.x) / 3), z: lane(ra, d) }, { x: b.x, z: lane(ra, d) });
    return pts;
  }
  const ave = AVENUES.reduce((p, c) => (Math.abs(a.x - c) + Math.abs(b.x - c) < Math.abs(a.x - p) + Math.abs(b.x - p) ? c : p));
  const d1 = Math.sign(ave - a.x) || 1, d2 = Math.sign(b.x - ave) || 1, dz = Math.sign(ROAD(rb) - ROAD(ra));
  const aveLane = ave + (dz > 0 ? 1.7 : -1.7);
  pts.push({ x: a.x + d1 * Math.min(5, Math.abs(ave - a.x) / 3), z: lane(ra, d1) }, { x: aveLane, z: lane(ra, d1) }, { x: aveLane, z: lane(rb, d2) }, { x: b.x, z: lane(rb, d2) });
  return pts;
}

// The freight train runs on the line behind street 8: due 6:40, at the Rail Depot
// 7:00–7:20, gone west by 7:40. Returns its x, or null when it is not in town.
export const RAIL_Z = 7 * 46 - 3.5 * 46 - 17;
export function trainX(minute, depotX) {
  const m = minute;
  if (m >= 400 && m < 420) return depotX + ((420 - m) / 20) * (420 - depotX);
  if (m >= 420 && m < 440) return depotX;
  if (m >= 440 && m < 460) return depotX - ((m - 440) / 20) * (420 + depotX);
  return null;
}

// ── The town ───────────────────────────────────────────────────────────────
export class TownLife {
  constructor({ homes, minute = 7 * 60, seed = 20261019 }) {
    // homes: [{ coordinate, name, door: {x,z} }] — the repository houses people live in.
    this.seed = seed >>> 0;
    this.rand = rng(this.seed);
    this.day = 1; this.minute = minute;
    this.events = []; this.stats = this.freshStats();
    this.powerGridEvents = []; this.powerGridEventSeq = 0;
    this.places = new Map();
    for (const d of PLACE_DEFS) {
      const col = d.col.charCodeAt(0) - 65;
      const x = lotX(col), south = d.side === 'south';
      this.places.set(d.id, {
        ...d, x, door: { x, z: south ? FIELD_Z0 - 0.5 : LOT8_Z + 7.5 }, front: { x, z: south ? FIELD_Z0 - 2.2 : LOT8_Z + 9.3 }, curb: { x, z: south ? ROAD(7) + 1.7 : ROAD(7) - 1.7 },
        stock: Object.fromEntries(Object.keys({ ...d.target, ...d.feedTarget }).map((k) => [k, Math.round((d.target?.[k] ?? d.feedTarget[k]) * 0.6)])), till: 0, out: {},
      });
    }
    // Farms keep produce at the farm until a truck collects it; fields lie across the road.
    for (const p of this.places.values()) if (p.kind === 'farm') { p.out[p.makes] = 8; p.field = { x0: p.x - 11, x1: p.x + 11, z0: FIELD_Z0, z1: FIELD_Z1 }; p.growth = 0.5; }
    this.place('mill').out.flour = 6;
    this.place('bakery').out = { bread: 8, pie: 4 };
    this.place('depot').out = { coffee: 12, tea: 10, parcel: 6, fuel: 30, ore: 10, hay: 30, lamb: 0 };
    Object.assign(this.place('power').stock, { fuel: 120 });
    this.place('waterworks').stock = { water: 160 };
    this.place('sewage').stock = { wastewater: 0 };
    this.place('recycling').stock = { recyclables: 0, scrap: 4 };
    this.place('landfill').stock = { rubbish: 0 };
    Object.assign(this.place('foundry').stock, { ore: 20, metal: 4 });
    this.place('foundry').out = { parts: 6 };
    this.place('hall').stock = { parts: 6 };
    // Town finances, utilities and the visitor's own money and bag (from the living-town design).
    this.civic = {
      weather: 'sunny', treasury: 4800, taxRate: 0.1, mayor: 'Vern', ballots: {}, voted: false, electionDay: 7,
      services: Object.fromEntries(SERVICES.map((k) => [k, 100])), homes: { rubbish: 0, recyclables: 0 },
      supply: { power: 0, powerDemand: 0, water: 0, waterDemand: 0, ok: true, waterOk: true },
      powerLines: {}, powerGrid: null,
      indicators: { health: 90, happiness: 78, environment: 82, pollution: 3 },
      letters: [], player: { wallet: 75, bank: 150, bag: {} }, credit: freshCredit(), finance: freshFinance(),
    };
    initialiseLivestock(this);
    this.homes = homes;
    // Spread households across town: every step-th house, starting from the third.
    const step = Math.max(1, Math.floor(homes.length / JOBS.length));
    const picks = homes.filter((_, i) => i % step === Math.min(2, step - 1)).slice(0, JOBS.length);
    this.villagers = JOBS.slice(0, picks.length).map(([job, work, start, end], i) => {
      const home = picks[i];
      return {
        id: i, name: VILLAGER_NAMES[i % VILLAGER_NAMES.length], job, work, start, end, home,
        x: home.door.x, z: home.door.z + 2, inside: true, path: [], step: null, activity: 'asleep at home',
        hunger: 25 + this.rand() * 20, wallet: 40 + Math.round(this.rand() * 40),
        pantry: { bread: 2, eggs: 2, milk: 1, veg: 1, fruit: 1, lamb: i % 3 === 0 ? 0 : 1, pie: 0 },
        carrying: null, lastMeal: null, meals: [], seen: [], doneToday: {},
      };
    });
    // Dedicated marked bays beside the depot, outside the 2 travel lanes.
    // Never initialise a stationary truck in the middle of the carriageway.
    this.trucks = [0, 1, 2].map((i) => {
      const bay = this.depotBay(i);
      return { id:i, driver:null, x:bay.x, z:bay.z, heading:Math.PI/2,
        path:[], job:null, load:null, wait:0, leg:null, state:'parked', braking:false };
    });
    this.parcels = [];   // { coordinate, x, z, from } waiting on doorsteps
    this.obstacles = []; // set by the renderer each frame: [{x, z}] (the player)
    for (const t of this.trucks) t.driver = this.villagers.find((v) => v.job === 'truck driver' && !this.trucks.some((o) => o.driver === v)) || null;
    createGovernment(this);
    initialisePublicLife(this);
    startNeeds(this);
    this.place('hotel').bookings=[];
    this.log(`Day ${this.day} begins. The town wakes up.`);
  }

  freshStats() { return { harvested: {}, milled: 0, baked: 0, deliveries: 0, delivered: {}, sold: {}, foodConsumed: {}, meals: 0, mealsOut: 0, parcels: 0, taxes: 0, wages: 0, recycled: 0, landfill: 0, letters: 0, repairs: 0, stockouts: 0, powerCutHours: 0, waterCutHours: 0 }; }
  place(id) { return this.places.get(id); }
  time() { return fmt(this.minute); }
  isDay() { return this.minute >= 6 * 60 && this.minute < 19 * 60; }
  // 0 at midnight, 1 at noon: drives sky colour and lights.
  daylight() { const h = this.minute / 60; return clamp(Math.sin(((h - 6) / 13) * Math.PI) * 1.4, 0, 1); }
  log(text) { this.events.unshift({ t: `Day ${this.day} ${fmt(this.minute)}`, text }); this.events.length = Math.min(this.events.length, 60); }
  open(p) { return this.minute >= p.opens && this.minute < p.closes; }

  // Advances the town by `minutes` of town time (call with small steps).
  tick(minutes) {
    const before = this.minute;
    tickJobs(this, minutes);
    this.minute += minutes;
    if (this.minute >= 24 * 60) { this.minute -= 24 * 60; this.day++; this.newDay(); }
    const hourly = Math.floor(before / 60) !== Math.floor(this.minute / 60) || this.minute < before;
    if (hourly) this.everyHour();
    advanceNeeds(this,minutes);
    for (const v of this.villagers) this.liveVillager(v, minutes);
    // All walkers, shop visitors and on-duty staff retain physical space.
    // Stationary conversations count too; no more two models in one body.
    separatePedestrians(this.villagers.filter(v=>!v.inside).map(v=>({
      id:v.id,pos:v,radius:v.bike&&v.path.length?1.16:.59,
      fixed:!!v.engaged
    })),{world:this.pedestrianWorld||null,gap:1.24,passes:6});
    updatePublicForum(this);
    advanceCivicWork(this, minutes);
    if (hourly && Math.floor(this.minute / 60) === 10 && this.day >= this.civic.government.meetingDay) councilMeeting(this);
    for (const t of this.trucks) this.driveTruck(t, minutes);
    for (const t of this.trucks) {
      t.jam = t.braking ? (t.jam || 0) + minutes : 0;      // continuous time spent unable to move
      if (t.jam > 20) { t.jam = 0; this.unjam(t); }
    }
  }

  newDay() {
    this.yesterday = this.stats;
    this.stats = this.freshStats();
    for (const v of this.villagers) v.doneToday = {};
    const c = this.civic;
    accrueInterest(this);
    // Council rates: every household pays $15 a day towards wages and services.
    let rates = 0; for (const v of this.villagers) { const due = 15 + (v.rateArrears || 0), r = Math.min(due, Math.max(0, v.wallet)); v.wallet -= r; rates += r; v.rateArrears = Math.min(60, Math.round((due - r) * 100) / 100); }
    c.treasury += rates; this.stats.rates = rates; budgetRevenue(this,rates,'rates');
    // Like any country town, the council relies on state and federal grants.
    budgetRevenue(this, dailyGrants(this), 'grant');
    financeDailyClose(this);
    // Villagers bank anything over $250 (money saved, not spent in town).
    for (const v of this.villagers) if (v.wallet > 250) { v.savings = (v.savings || 0) + v.wallet - 250; v.wallet = 250; }
    // End-of-day books: public takings go to the council; a business keeps a $50 float, pays
    // 35% of the rest in business rates and shares half of what's left with its staff.
    for (const p of this.places.values()) {
      if (p.till <= 0) continue;
      if (PUBLIC.has(p.id) || p.kind === 'utility') { c.treasury += p.till; p.till = 0; continue; }
      const surplus = p.till - 50; if (surplus <= 0) continue;
      const rate = surplus * 0.35, staff = this.villagers.filter((v) => v.work === p.id), share = staff.length ? (surplus - rate) * 0.5 : 0;
      p.till -= rate + share; c.treasury += rate; noteRates(this, p, rate);
      for (const v of staff) v.wallet += share / staff.length;
    }
    c.weather = WEATHER[Math.floor(this.rand() * WEATHER.length)]; // Ballots stay locked until this election finishes.
    advanceLivestockDay(this);
    for (const k of SERVICES) c.services[k] = clamp(c.services[k] - (k === 'roads' ? 0.45 : 0.25) - this.rand() * 0.5, 0, 100);
    c.indicators.environment = clamp(100 - c.indicators.pollution, 0, 100);
    // Mood follows what people lived through yesterday: power cuts, empty shelves, worn services.
    const y = this.yesterday, worn = SERVICES.some((k) => c.services[k] < 50);
    // About 20 empty shelves a day is ordinary small-town life; far more is felt.
    const mood = (y.powerCutHours ? -3 : 0) - (y.stockouts > 60 ? 2 : y.stockouts > 35 ? 1 : 0) + (worn ? -2 : 0);
    c.indicators.happiness = clamp(c.indicators.happiness + (mood || 1), 0, 100);
    if ((y.waterCutHours || 0) >= 6) {
      c.indicators.health = clamp(c.indicators.health - 2, 0, 100);
      this.log('Residents have faced prolonged water restrictions; public health has worsened.');
    } else if (!(y.waterCutHours || 0)) c.indicators.health = clamp(c.indicators.health + 0.5, 0, 100);
    maintainServices(this);
    if (this.day >= c.electionDay) this.election();
    this.log(`Day ${this.day} begins: ${c.weather} weather. The 6:40 freight train is due at the Rail Depot.`);
  }

  // ── Town finances and utilities ──
  // A sale at a till: the town takes its tax, the shop keeps the rest.
  sale(shop, price) { const tax = Math.round(price * this.civic.taxRate * 100) / 100; noteSale(this, shop, price); shop.till += price - tax; this.civic.treasury += tax; this.stats.taxes += tax; budgetRevenue(this,tax,'tax'); }
  ok(service) { return this.civic.services[service] >= 35; }
  gridPowered(customerId) {
    const c=this.civic.powerGrid?.customers?.[customerId];
    return c ? c.served >= c.demand : this.civic.supply.ok;
  }
  recordPowerEvent(type, lineId, actor, cause) {
    const record={ id:'grid-'+(++this.powerGridEventSeq), day:this.day, minute:this.minute,
      type, actor, locationId:lineId, cause };
    this.powerGridEvents.push(record);
    if(this.powerGridEvents.length>80)this.powerGridEvents.shift();
    return record;
  }
  // Faults are explicit actions, not random arbitrary percentages. A later
  // hourly model step recalculates exactly which customers lose supply.
  faultPowerLine(lineId) {
    if(!POWER_LINE_IDS.includes(lineId)) return 'Unknown power line.';
    if(this.civic.powerLines[lineId])return 'That feeder is already out of service.';
    this.civic.powerLines[lineId]=true;
    this.recordPowerEvent('power-line-failed',lineId,'system:test-scenario','simulated feeder fault');
    this.log('Electricity fault reported on '+lineId+'. Distribution will be reassessed this hour.');
    this.updatePowerGrid();
    return 'Fault recorded on '+lineId+'. Check the Town Ledger for affected services.';
  }
  repairPowerLine(lineId) {
    if (!POWER_LINE_IDS.includes(lineId)) return 'Unknown power line.';
    return requestFeeder(this,lineId);
  }
  updatePowerGrid() {
    const h=Math.floor(this.minute/60), c=this.civic;
    const demand=townPowerDemands(h,c.supply.powerDemand);
    const previous=c.powerGrid;
    c.powerGrid=distributePower({generation:Math.max(0,Math.floor(c.supply.power)),
      demands:demand, failedLines:c.powerLines});
    c.supply.ok=c.powerGrid.unserved===0;
    if(previous) {
      const old=new Set(previous.affected), now=new Set(c.powerGrid.affected);
      const newly=[...now].filter(id=>!old.has(id));
      const recovered=[...old].filter(id=>!now.has(id));
      if(newly.length)this.log('Power interrupted at '+newly.map(id=>c.powerGrid.customers[id].name).join(', ')+'.');
      if(recovered.length)this.log('Power restored to '+recovered.map(id=>c.powerGrid.customers[id].name).join(', ')+'.');
    }
    return c.powerGrid;
  }
  rubbish(n) { this.civic.homes.rubbish += n * 0.5; this.civic.homes.recyclables += n * 0.5; }

  // Power, water, wastewater, waste and industry, once an hour.
  utilitiesHour(h, at) {
    const c = this.civic, power = this.place('power'), water = this.place('waterworks'), sewage = this.place('sewage');
    const day = h >= 7 && h <= 18;
    const solar = day ? ({ sunny: 25, cloudy: 14, windy: 18, rainy: 8 })[c.weather] : 0;
    const demand = 30 + (day ? 8 : 0) + (h >= 17 && h <= 23 ? 10 : 0);
    // The generators burn only what the panels can't cover: one drum per 15 units.
    const fuelNeed = Math.ceil(Math.max(0, demand - solar) / 15);
    const thermal = (power.stock.fuel || 0) >= fuelNeed && this.ok('power') ? Math.max(0, demand - solar) : 0;
    if (thermal) power.stock.fuel -= fuelNeed;
    c.supply.power = this.ok('power') ? solar + thermal : 0; c.supply.powerDemand = demand;
    const wasOk = c.supply.ok;
    this.updatePowerGrid();
    if (!c.supply.ok) this.stats.powerCutHours++;
    if (!c.supply.ok && wasOk) this.log('Electricity shortage: check affected feeders and customers in the Town Ledger.');
    if (c.supply.ok && !wasOk) this.log('Full electricity supply has been restored to all connected customers.');
    if (this.gridPowered('waterworks') && this.ok('water')) water.stock.water = Math.min(250, (water.stock.water || 0) + 25);
    const need = 16 + (day ? 4 : 0), got = Math.min(need, water.stock.water || 0);
    water.stock.water -= got; c.supply.water = got; c.supply.waterDemand = need;
    const wasWater = c.supply.waterOk; c.supply.waterOk = got >= need;
    if (!c.supply.waterOk) this.stats.waterCutHours++;
    if (!c.supply.waterOk && wasWater) this.log('Water restrictions: the Water Works cannot keep up.');
    sewage.stock.wastewater = (sewage.stock.wastewater || 0) + Math.floor(got * 0.8);
    if (this.gridPowered('sewage') && this.ok('sewage')) { sewage.stock.wastewater = Math.max(0, sewage.stock.wastewater - 22); c.indicators.pollution = clamp(c.indicators.pollution - 0.2, 0, 100); }
    if (sewage.stock.wastewater > 70) { c.indicators.pollution = clamp(c.indicators.pollution + 2, 0, 100); if (h % 4 === 0) this.log('The Wastewater Works is backed up and polluting the creek.'); }
    // Bin day twice a day: rubbish to the Waste Depot, recycling to the Recycling Centre.
    if ((h === 6 || h === 15) && this.ok('waste') && this.ok('roads')) {
      const r = Math.floor(c.homes.rubbish), y = Math.floor(c.homes.recyclables);
      c.homes.rubbish -= r; c.homes.recyclables -= y;
      this.place('landfill').stock.rubbish += r; this.place('recycling').stock.recyclables += y; this.stats.landfill += r;
    }
    const rec = this.place('recycling');
    if (at('recycling').length && rec.stock.recyclables >= 4) { const n = Math.min(14, rec.stock.recyclables); rec.stock.recyclables -= n; rec.stock.scrap += Math.floor(n / 2); this.stats.recycled += n; }
    if (rec.stock.scrap >= 8) { rec.out.scrap = (rec.out.scrap || 0) + rec.stock.scrap; rec.stock.scrap = 0; }
    const fo = this.place('foundry');
    if (at('foundry').length && this.gridPowered('industry')) {
      if ((fo.stock.ore || 0) >= 2) { fo.stock.ore -= 2; fo.stock.metal = (fo.stock.metal || 0) + 1; }
      if ((fo.stock.scrap || 0) >= 4) { fo.stock.scrap -= 4; fo.out.parts = (fo.out.parts || 0) + 2; }
    }
    if (h === 16 && (fo.stock.metal || 0) >= 14) { const n = fo.stock.metal - 4; fo.stock.metal = 4; fo.till += n * 12; this.log(`The foundry exported ${n} tonnes of metal by rail for $${n * 12}.`); }
    if (h === 8 && (this.place('power').stock.fuel || 0) < 60) this.log('The Power Station is low on fuel; a truck is due from the depot.');
    // Post: letters the visitor posts arrive the next day with the postie.
    if (h === 15) { const due = c.letters.filter((l) => l.day < this.day && !l.delivered); for (const l of due) l.delivered = true; if (due.length) { this.stats.letters += due.length; this.log(`The postie delivered ${due.length} letter${due.length > 1 ? 's' : ''} you posted.`); } }
  }

  election() { return civicElection(this); }
  holdCouncilMeeting() { return councilMeeting(this); }
  proposeCouncilMotion(type,value) { return proposeMotion(this,type,value); }
  governmentReport() { return govSummary(this); }
  civicChat(v) { return civicDialogue(this,v); }
  // ── The visitor (the player): wallet, bank, bag and civic actions. Each returns a message. ──
  shelves(p) { return p.id === 'bakery' ? p.out : p.stock; }
  buyItem(shopId, good) {
    const p = this.place(shopId), me = this.civic.player, price = GOODS[good].price;
    if (!this.open(p)) return `The ${p.name} is closed — it opens at ${fmt(p.opens)}.`;
    if (!(this.shelves(p)[good] > 0)) return `Sorry, sold out of ${GOODS[good].name}. The next truck should bring more.`;
    if (me.wallet < price) return `You need $${price} but only have $${me.wallet} — try the Community Bank.`;
    this.shelves(p)[good]--; me.wallet -= price; this.sale(p, price); receipt(this, 'purchase', `${GOODS[good].name} at ${p.name}`, -price);
    me.bag[good] = (me.bag[good] || 0) + 1; this.stats.sold[good] = (this.stats.sold[good] || 0) + 1;
    this.log(`A visitor bought ${GOODS[good].name} at the ${p.name}.`);
    return `You buy ${amount(good, 1)} for $${price}. It's in your bag.`;
  }
  sellItem(shopId, good) {
    const p = this.place(shopId), me = this.civic.player, pay = Math.max(1, Math.floor(GOODS[good].price * 0.6));
    if (!(me.bag[good] > 0)) return `You don't have any ${GOODS[good].name}.`;
    if (p.till < pay) return `The ${p.name} can't afford to buy it back right now.`;
    me.bag[good]--; this.shelves(p)[good] = (this.shelves(p)[good] || 0) + 1; p.till -= pay; me.wallet += pay; recordEarning(this, pay); receipt(this, 'sale', `Sold ${GOODS[good].name} to ${p.name}`, pay);
    return `The ${p.name} buys it back for $${pay}.`;
  }
  eatItem(good) { return eatPlayer(this,good); }
  orderCafe(itemId) { return orderCafe(this,itemId); }
  bookHotel() { return hotelCheckIn(this); }
  sleepHotel(room=null) { return sleepPlayer(this,'hotel',room); }
  needsReport() { return needsReport(this); }
  bank(op, n) {
    const me = this.civic.player, from = op === 'deposit' ? 'wallet' : 'bank', to = op === 'deposit' ? 'bank' : 'wallet';
    if (!this.open(this.place('bank'))) return 'The bank is closed (9:00–16:00).';
    const m = Math.min(n, me[from]);
    if (m <= 0) return `Nothing to ${op}.`;
    me[from] -= m; me[to] += m;
    noteBank(this, `${op === 'deposit' ? 'Deposited' : 'Withdrew'} $${m}.`); receipt(this, 'bank', `${op === 'deposit' ? 'Deposited' : 'Withdrew'} $${m}`, 0);
    return `${op === 'deposit' ? 'Deposited' : 'Withdrew'} $${m}. Wallet $${me.wallet}, savings $${me.bank}.`;
  }
  creditReport() { return creditReport(this); }
  payBills() { return payBills(this); }
  jobsReport() { return jobsReport(this); }
  livestockReport(site) { return herdReport(this, site); }
  startJob(id) { return startJob(this, id); }
  doTask(t) { return performTask(this, t); }
  cancelJob() { return abandonJob(this); }
  finishJob() { return finishJob(this); }
  jobSupervisors(site) { return supervisors(this, site); }
  economyReport() { return economyReport(this); }
  borrow(n) { return borrow(this, n); }
  repay(n) { return repay(this, n); }
  vote(name) { return castCivicVote(this,name); }
  postLetter(to) {
    const me = this.civic.player;
    if (me.wallet < 2) return 'Postage is $2.';
    me.wallet -= 2; this.civic.treasury += 2; this.civic.letters.push({ to, day: this.day, delivered: false });
    return `Letter to ${to} posted ($2). The postie delivers it tomorrow afternoon.`;
  }
  repair(service) { return submitRequest(this,service); }
  collectRecycling() {
    const c = this.civic, n = Math.min(5, Math.floor(c.homes.recyclables));
    if (!n) return 'No recycling waiting on the kerbs right now.';
    c.homes.recyclables -= n; this.place('recycling').stock.recyclables += n;
    const reward = Math.min(c.treasury, n * 2); c.treasury -= reward; c.player.wallet += reward; recordEarning(this, reward);
    return `You sort ${n} bags of recycling and the council pays you $${reward}.`;
  }

  // Production happens on the hour while the right workers are at work.
  everyHour() {
    const at = (id) => this.villagers.filter((v) => v.work === id && v.step?.kind === 'work');
    for (const p of this.places.values()) {
      if (p.kind === 'farm') {
        const irrigated = ['silo', 'garden', 'orchard'].includes(p.id);
        const waterFactor = !irrigated || this.civic.supply.waterOk ? 1 : -0.5;
        p.growth = clamp(p.growth + (this.isDay() ? ({ rainy: 0.06, sunny: 0.04, cloudy: 0.035, windy: 0.03 })[this.civic.weather] : 0.01) * waterFactor, 0, 1);
        const hands = at(p.id).length;
        // Farms stop picking once their shed is full (60), so unsold produce doesn't pile up forever.
        if (hands && this.open(p) && (p.out[p.makes] || 0) < 60) {
          const herdFraction = productiveHerdFraction(this, p.id);
          const waterFraction = irrigated && !this.civic.supply.waterOk ? 0.5 : 1;
          const n = Math.round((2 + 3 * p.growth) * hands * (FARM_YIELD[p.makes] || 1) * herdFraction * waterFraction);
          p.out[p.makes] = (p.out[p.makes] || 0) + n;
          this.stats.harvested[p.makes] = (this.stats.harvested[p.makes] || 0) + n;
          if (p.makes === 'grain' && p.growth > 0.9) { p.growth = 0.3; this.log(`The wheat paddock was harvested. ${n} bags of grain went into the silo.`); }
        }
      }
    }
    const h = Math.floor(this.minute / 60);
    this.utilitiesHour(h, at);
    const powered = this.gridPowered('bakery');
    const mill = this.place('mill');
    const batch = Math.min(2, Math.floor((mill.stock.grain || 0) / 3));
    if (at('mill').length && batch && powered && (mill.out.flour || 0) < 60) { mill.stock.grain -= 3 * batch; mill.out.flour = (mill.out.flour || 0) + 2 * batch; this.stats.milled += 2 * batch; }
    const bakery = this.place('bakery');
    if (at('bakery').length && powered && this.civic.supply.waterOk) {
      const s = bakery.stock;
      // Bake to a full shelf, not beyond: surplus would only waste flour, lamb and veg.
      if ((s.flour || 0) >= 2 && (bakery.out.bread || 0) < 48) { s.flour -= 2; bakery.out.bread = (bakery.out.bread || 0) + 8; this.stats.baked += 8; }
      if ((bakery.out.pie || 0) < 16 && (s.flour || 0) >= 1 && (s.lamb || 0) >= 1 && (s.veg || 0) >= 1) { s.flour--; s.lamb--; s.veg--; bakery.out.pie = (bakery.out.pie || 0) + 4; this.stats.baked += 4; }
    }
    if (h === 7) {
      const depot = this.place('depot');
      const coffee = (depot.out.coffee || 0) < 24 ? 8 : 0;
      const tea = (depot.out.tea || 0) < 18 ? 6 : 0;
      const parcel = (depot.out.parcel || 0) < 18 ? 6 + Math.round(this.rand() * 6) : 0;
      // Fuel and ore are imports the council pays for.
      const fuel = (depot.out.fuel || 0) < 60 ? 60 : 0, ore = (depot.out.ore || 0) < 20 ? 20 : 0;
      const hay = (depot.out.hay || 0) < 14 ? 14 - (depot.out.hay || 0) : 0;
      const lamb = (depot.out.lamb || 0) < 18 ? 18 - (depot.out.lamb || 0) : 0;
      const cost = fuel * 1 + ore * 2 + hay * GOODS.hay.price + lamb * GOODS.lamb.price + coffee * GOODS.coffee.price * 0.5 + tea * GOODS.tea.price * 0.5 + parcel;
      if (cost && this.civic.treasury >= cost) {
        depot.out.fuel = (depot.out.fuel || 0) + fuel; depot.out.ore = (depot.out.ore || 0) + ore;
        depot.out.hay = (depot.out.hay || 0) + hay; depot.out.lamb = (depot.out.lamb || 0) + lamb;
        depot.out.coffee = (depot.out.coffee || 0) + coffee; depot.out.tea = (depot.out.tea || 0) + tea;
        depot.out.parcel = (depot.out.parcel || 0) + parcel;
        this.civic.treasury -= cost;
      }
      this.log(`The freight train pulled into the Rail Depot with coffee, tea, the mail${cost ? ', fuel and ore' : ''}.`);
    }
    // Parcels left on doorsteps get taken inside by evening.
    if (h === 19 && this.parcels.length) { this.log(`${this.parcels.length} parcel${this.parcels.length > 1 ? 's were' : ' was'} collected from doorsteps.`); this.parcels = []; }
  }

  // ── Trucks ──
  depotBay(id) {
    const depot = this.place('depot');
    // Stagger trucks away from the centre entrance and give each a full 8m bay.
    // The bay surface is rendered separately from the road and is not a lane.
    return {x:depot.x + [-16, -7, 9][id], z:ROAD(7)-7.2};
  }
  // Road approach. Depot trucks make a short off-carriageway manoeuvre into their marked bay;
  // every other stop is made in the travelling lane beside the building (a delivery truck
  // double-parks to unload), so a truck never parks on a footpath over a counter or a worker.
  routeTruck(t, placeId) {
    if (placeId === 'depot') {
      const bay = this.depotBay(t.id);
      if (Math.hypot(t.x - bay.x, t.z - bay.z) < 0.2) return [];
      // Run along the lane and swing in over the last ~9 m, so the truck arrives nearly square to
      // the bay instead of nose-first across the lane.
      const lane = driveRoute(t, bay), prev = lane.length > 1 ? lane[lane.length - 2] : t, end = lane[lane.length - 1];
      const dir = Math.sign(bay.x - prev.x) || 1, lead = { x: bay.x - dir * 5.5, z: end.z };
      return (lead.x - prev.x) * dir > 0.5 ? [...lane.slice(0, -1), lead, bay] : [...lane, bay];
    }
    const route = driveRoute(t, { x: this.place(placeId).x, z: ROAD(7) });
    const stop = route[route.length - 1];
    return Math.hypot(t.x - stop.x, t.z - stop.z) < 0.2 ? [] : route;
  }
  // Where a truck stands to serve a site: in the travelling lane beside the building (it double-parks
  // to unload), never on the footpath over a counter or a worker.
  stopAt(t, placeId) {
    const route = driveRoute(t, { x: this.place(placeId).x, z: ROAD(7) });
    return route[route.length - 1];
  }
  driveTruck(t, minutes) {
    const drv = t.driver;
    const onShift = !!(drv && this.minute >= drv.start && this.minute < drv.end && drv.step?.kind === 'work');
    t.braking = false;
    if (t.wait > 0) { t.wait = Math.max(0, t.wait - minutes); return; }
    const secs = Math.max(0, minutes) * SEC_PER_MIN;
    // A stop is "in use" from arrival until the truck has driven clear of it; others hold back.
    if (t.ignoreSite != null && !this.trucks[t.ignoreSite]?.siteAt) t.ignoreSite = null;
    if (t.siteAt && Math.hypot(t.x - t.siteAt.x, t.z - t.siteAt.z) > TRUCK.site + 1) t.siteAt = null;
    if (t.reverse > 0) {            // backing out to let a truck that is boxed in turn round
      const back = Math.min(t.reverse, secs * 3);
      const trial = { x: t.x - Math.sin(t.heading) * back, z: t.z - Math.cos(t.heading) * back, h: t.heading, reverse: true };
      if (Math.abs(trial.z - ROAD(7)) <= 4.2 && !this.blocked(t, trial)) { t.x = trial.x; t.z = trial.z; t.reverse -= back; } else t.reverse = 0;   // never reverse off the carriageway
      t.braking = true; return;
    }
    // Heading for the bay with no lead-in left (e.g. after backing out of a standoff): rejoin the
    // lane and swing in properly instead of cutting diagonally across a neighbour's bay.
    if (t.path.length === 1 && !t.retreat && !t.pulling) {
      const bay = this.depotBay(t.id);
      if (Math.hypot(t.path[0].x - bay.x, t.path[0].z - bay.z) < 0.5 && Math.abs(t.x - bay.x) > 6.5 && Math.abs(t.z - bay.z) > 3) t.path = this.routeTruck(t, 'depot');
    }
    if (!t.path.length) {
      if (!onShift && !t.job && t.state !== 'parked') {
        t.leg = 'return'; t.state = 'returning to the depot parking bays';
        t.path = this.routeTruck(t, 'depot');
        if (!t.path.length) { t.state = 'parked'; t.leg = null; }
      } else if (onShift && !t.job && t.state !== 'returning to the depot parking bays') this.pickJob(t);
      // Already standing at the pickup or drop-off (e.g. a depot job from the depot's own bay):
      // there is nothing to drive, so the stop happens now instead of never.
      if (!t.path.length && t.job) { if (!this.squareUp(t, secs)) this.truckArrived(t); return; }
    }
    if (!t.path.length) {
      // Parked: settle square to the bay, turning like a vehicle rather than snapping round.
      if (t.state === 'parked') this.squareUp(t, secs);
      return;
    }
    let budget = secs * DRIVE, turn = secs * TRUCK.turn;   // metres and radians available this tick
    // Substep all motion: a full half-town-minute tick is 12 m, and checking collision once per
    // tick let two trucks jump through one another.
    for (let guard = 0; (budget > 1e-4 || turn > 1e-4) && t.path.length && guard < 600; guard++) {
      const p = t.path[0], dx = p.x - t.x, dz = p.z - t.z, d = Math.hypot(dx, dz);
      if (d < 0.15) { t.x = p.x; t.z = p.z; t.path.shift(); continue; }   // close enough: arrived at this point
      const err = angleDiff(Math.atan2(dx, dz), t.heading);
      const h = Math.abs(err) < 0.01 ? t.heading + err : t.heading + clampAbs(err, turn);
      turn -= Math.abs(h - t.heading);
      // Sharp corners are taken as a slow point turn first; shallow ones are driven through.
      const step = Math.abs(angleDiff(Math.atan2(dx, dz), h)) < 0.5 ? Math.min(budget, d, 0.9) : 0;
      if (step <= 0 && Math.abs(h - t.heading) < 1e-6) break;
      const trial = { x: t.x + (dx / d) * step, z: t.z + (dz / d) * step, h };
      if (this.blocked(t, trial)) { t.braking = true; this.noteBlocked(t, minutes); return; }
      t.x = trial.x; t.z = trial.z; t.heading = h; budget -= step; t.blockedFor = 0;
      if (step > 0 && d - step <= 1e-4) { t.x = p.x; t.z = p.z; t.path.shift(); }
    }
    if (!t.path.length) {
      if (this.squareUp(t, secs)) return;
      if (t.retreat) {              // back in the bay: wait a moment, then plan the trip again
        t.retreat = false; t.wait = 3;
        const to = t.job ? (t.leg === 'pickup' ? t.job.from : t.job.to) : 'depot';
        t.path = this.routeTruck(t, to);
      }
      else if (t.leg === 'return' && !t.job) { t.leg = null; t.state = 'parked'; }
      else this.truckArrived(t);
    }
  }

  // A truck standing in its depot bay squares up to it (nose along the bay) before it counts as
  // arrived or parked, so it never sticks out across the lane. True while still turning.
  squareUp(t, secs) {
    const bay = this.depotBay(t.id);
    if (Math.hypot(t.x - bay.x, t.z - bay.z) > 0.3) return false;
    const err = angleDiff(Math.PI / 2, t.heading);
    if (Math.abs(err) < 0.02) return false;
    const h = t.heading + clampAbs(err, secs * TRUCK.turn);
    if (this.blocked(t, { x: t.x, z: t.z, h })) t.braking = true; else t.heading = h;
    return true;
  }

  // Last resort for a jam nothing else untangled: the truck is recalled to its own depot bay (when
  // that is clear) and plans its trip again, rather than the town's deliveries stopping for good.
  unjam(t) {
    const bay = this.depotBay(t.id);
    if (this.trucks.some((o) => o !== t && boxesOverlap(truckBox(bay.x, bay.z, Math.PI / 2, 0.3), truckBox(o.x, o.z, o.heading)))) { t.blockedFor = 30; return; }
    t.x = bay.x; t.z = bay.z; t.heading = Math.PI / 2; t.pulling = false; t.retreat = false; t.reverse = 0; t.siteAt = null; t.blockedFor = 0;
    t.wait = 2; t.path = t.job ? this.routeTruck(t, t.leg === 'pickup' ? t.job.from : t.job.to) : [];
    this.stats.truckRecalls = (this.stats.truckRecalls || 0) + 1;
    this.recalls = (this.recalls || 0) + 1;
  }

  // Two trucks that have each been waiting on the other for a long time: the lower-priority one
  // (higher id) backs straight out of the way instead of both waiting for ever.
  noteBlocked(t, minutes) {
    t.blockedFor = (t.blockedFor || 0) + minutes;
    // Courtesy only goes so far: after a few minutes a truck stops holding back for another's stop
    // (bodies and following distance still keep them apart), which breaks waiting circles.
    if (t.why === 'site' && t.blockedFor > 6 && t.blockedBy != null) t.ignoreSite = t.blockedBy;
    const o = this.trucks[t.blockedBy];
    if (t.blockedFor > 8 && o && o.braking && o.blockedBy === t.id && t.id > o.id) { t.reverse = 8; t.blockedFor = 0; }
    // Boxed in half-way out of a bay by a truck that cannot get past: back into the bay and try again.
    if (t.blockedFor > 10 && t.pulling && !t.retreat) {
      t.retreat = true; t.pulling = false; t.blockedFor = 0;
      t.path = [this.depotBay(t.id)];
    }
  }

  // Would the truck run into anything if it moved to `proposed` {x, z, h} (default: where it
  // stands now)? Trucks are tested as real 6.6 m × 2.2 m footprints plus a safety gap, so two
  // trucks can never overlap whatever their angle, even beside or behind one another.
  // People (the player and villagers) block it when they are inside, or just ahead of, the
  // footprint in the direction it is about to travel.
  blocked(t, proposed = null) {
    const at = proposed || { x: t.x, z: t.z, h: t.heading };
    const h = at.h ?? t.heading;
    // Pulling out of a depot bay: wait for a gap in the traffic before swinging across the lanes.
    const bay = this.depotBay(t.id), leaving = t.path[0] && Math.hypot(t.path[0].x - bay.x, t.path[0].z - bay.z) > 0.5;
    if (proposed && leaving && !proposed.reverse && !t.pulling && !t.retreat && Math.hypot(t.x - bay.x, t.z - bay.z) < 1) {
      for (const o of this.trucks) {
        if (o === t || Math.abs(o.z - ROAD(7)) > 4.6) continue;
        const dx = o.x - t.x, moving = o.path.length > 0 && o.wait <= 0 && !o.braking, closing = moving && dx * Math.sin(o.heading) < 0;   // heading towards our bay
        if (Math.abs(dx) < 16 || (closing && Math.abs(dx) < 48)) { t.blockedBy = o.id; t.why = 'bay-gap'; return true; }
      }
      t.pulling = true;
    }
    // Turning in across the lanes to a bay: let through traffic near the bay go by first.
    const bayHead = t.path[0] && Math.hypot(t.path[0].x - bay.x, t.path[0].z - bay.z) < 0.5;
    if (proposed && bayHead && !proposed.reverse && !t.retreat && Math.abs(t.z - bay.z) > 3.2 && Math.hypot(t.x - bay.x, t.z - bay.z) < 14) {
      for (const o of this.trucks) {
        if (o === t || Math.abs(o.x - bay.x) > 13 || Math.abs(o.z - bay.z) < 1.5) continue;
        const oBay = this.depotBay(o.id), entering = o.path[0] && Math.hypot(o.path[0].x - oBay.x, o.path[0].z - oBay.z) < 0.5;
        if (entering && o.id > t.id) continue;     // two trucks turning in: the lower id goes first
        t.blockedBy = o.id; t.why = 'bay-in'; return true;
      }
    }
    if (t.pulling && Math.abs(t.z - ROAD(7)) < 3.0) t.pulling = false;
    // Driving needs a following gap; turning on the spot only needs the bodies to clear.
    const turningOnly = !!proposed && Math.hypot(at.x - t.x, at.z - t.z) < 1e-6;
    const mine = truckBox(at.x, at.z, h, turningOnly ? 0.05 : TRUCK.gap);
    for (const o of this.trucks) {
      if (o === t) continue;
      const ob = truckBox(o.x, o.z, o.heading);
      if (boxesOverlap(mine, ob)) {
        // Bodies already touching: moving AWAY is always allowed, otherwise nothing can ever untangle.
        if (!turningOnly && boxesOverlap(truckBox(t.x, t.z, t.heading), ob) && Math.hypot(at.x - o.x, at.z - o.z) > Math.hypot(t.x - o.x, t.z - o.z) + 1e-6) continue;
        t.blockedBy = o.id; t.why = 'body'; return true;
      }
    }
    // Hold back while another truck is serving a stop in this lane, so it has room to turn round.
    if (!turningOnly && !proposed?.reverse) {
      for (const o of this.trucks) {
        if (o === t || !o.siteAt || t.ignoreSite === o.id) continue;
        const now = Math.hypot(t.x - o.siteAt.x, t.z - o.siteAt.z), then = Math.hypot(at.x - o.siteAt.x, at.z - o.siteAt.z);
        if (then < TRUCK.site && then < now && Math.abs(at.z - o.siteAt.z) < 5) { t.blockedBy = o.id; t.why = 'site'; return true; }
      }
    }
    const next = t.path.find((p) => Math.hypot(p.x - t.x, p.z - t.z) > 0.1);
    let fx = proposed?.reverse ? -Math.sin(h) : next ? next.x - t.x : Math.sin(h), fz = proposed?.reverse ? -Math.cos(h) : next ? next.z - t.z : Math.cos(h);
    const len = Math.hypot(fx, fz) || 1; fx /= len; fz /= len;
    const rx = fz, rz = -fx;
    // Keep a real following distance in the same lane (never closer than we already are).
    if (!turningOnly && !proposed?.reverse) {
      for (const o of this.trucks) {
        if (o === t) continue;
        const ox = o.x - at.x, oz = o.z - at.z, ahead = ox * fx + oz * fz;
        const still = o.path.length === 0 || o.wait > 0 || o.braking;   // queue up close behind a stopped truck
        const thr = still ? 8.6 : TRUCK.follow, now = (o.x - t.x) * fx + (o.z - t.z) * fz;
        // Inside the gap already: never get closer. Outside it: one short step may close up to it.
        if (ahead > 0 && ahead < thr && Math.abs(ox * rx + oz * rz) < 1.9 && ahead < now && now < thr) { t.blockedBy = o.id; t.why = 'follow'; return true; }
      }
    }
    t.blockedBy = null;
    // Only people in the way matter: look no further than the end of the current straight leg,
    // so a pedestrian on the far footpath is not 'in the way' of a truck that is about to turn.
    const reach = turningOnly ? 0.3 : next ? Math.min(3.5, Math.hypot(next.x - at.x, next.z - at.z) + 0.5) : 3.5;
    const hit = (q) => {
      const x = q.x - at.x, z = q.z - at.z, ahead = x * fx + z * fz;
      return ahead > -TRUCK.hl && ahead < TRUCK.hl + reach && Math.abs(x * rx + z * rz) < TRUCK.hw + 0.5;
    };
    return this.obstacles.some(hit) || this.villagers.some((v) => !v.inside && hit(v));
  }

  // Finds the most useful load: a destination short of a good that a source has spare.
  pickJob(t) {
    const routes = [
      ['silo', 'grain', 'mill'], ['mill', 'flour', 'bakery'], ['mill', 'flour', 'store'],
      ['bakery', 'bread', 'store'], ['bakery', 'bread', 'cafe'], ['bakery', 'pie', 'cafe'], ['bakery', 'pie', 'pub'], ['bakery', 'bread', 'pub'],
      ['garden', 'veg', 'greengrocer'], ['garden', 'veg', 'bakery'], ['garden', 'veg', 'pub'], ['garden', 'veg', 'cafe'], ['orchard', 'fruit', 'greengrocer'],
      ['dairy', 'milk', 'store'], ['dairy', 'milk', 'cafe'], ['dairy', 'milk', 'bakery'], ['coop', 'eggs', 'store'], ['coop', 'eggs', 'cafe'], ['coop', 'eggs', 'bakery'],
      ['depot', 'lamb', 'butcher'], ['depot', 'lamb', 'pub'], ['depot', 'lamb', 'bakery'],
      ['depot', 'coffee', 'cafe'], ['depot', 'coffee', 'store'], ['depot', 'tea', 'store'], ['depot', 'tea', 'cafe'], ['orchard', 'fruit', 'cafe'], ['depot', 'parcel', 'post'],
      ['depot', 'fuel', 'power'], ['depot', 'ore', 'foundry'], ['recycling', 'scrap', 'foundry'], ['foundry', 'parts', 'hall'],
      ['depot', 'hay', 'sheep'], ['depot', 'hay', 'dairy'], ['silo', 'grain', 'coop'],
    ];
    let best = null;
    for (const [from, good, to] of routes) {
      const src = this.place(from), dst = this.place(to);
      const have = src.out[good] || 0, need = (dst.target?.[good] || dst.feedTarget?.[good] || 0) - (dst.stock[good] || 0);
      if (have < 3 || need < 3 || this.trucks.some((o) => o !== t && o.job?.to === to && o.job?.good === good)) continue;
      const score = need / (dst.target?.[good] || dst.feedTarget?.[good] || 1) + this.rand() * 0.1;
      if (!best || score > best.score) best = { from, to, good, n: Math.min(20, have, need), score };
    }
    if (!best) { t.state = 'waiting for an order'; return; }
    t.job = best; t.state = `heading to the ${this.place(best.from).name} for ${GOODS[best.good].name}`;
    t.path = this.routeTruck(t, best.from); t.leg = 'pickup';
    // A vehicle already in its depot bay has arrived at a depot pickup;
    // an empty route must execute loading, not strand the job forever.
    if (!t.path.length) this.truckArrived(t);
  }

  truckArrived(t) {
    if (!t.job) { t.state = 'parked'; return; }
    t.siteAt = { x: t.x, z: t.z };
    const src = this.place(t.job.from), dst = this.place(t.job.to), g = t.job.good;
    if (t.leg === 'pickup') {
      const n = Math.min(t.job.n, src.out[g] || 0);
      src.out[g] = (src.out[g] || 0) - n; t.load = { good: g, n };
      t.wait = 4; t.leg = 'deliver'; t.state = `delivering ${amount(g, n)} to the ${dst.name}`;
      t.path = this.routeTruck(t, t.job.to);
      if (!n) { t.job = null; t.path = []; t.leg = null; t.state = 'found nothing to collect, looking for another job'; }
    } else {
      const n = t.load?.n || 0;
      dst.stock[g] = (dst.stock[g] || 0) + n;
      // The buyer pays the supplier wholesale (half retail); the council pays for public stores.
      const cost = n * GOODS[g].price * 0.5, payer = PUBLIC.has(dst.id) || dst.kind === 'utility' ? null : dst;
      const paid = payer ? Math.min(cost, Math.max(0, payer.till)) : Math.min(cost, this.civic.treasury);
      if (payer) payer.till -= paid; else this.civic.treasury -= paid;
      src.till += paid;
      this.stats.deliveries++; this.stats.delivered[g] = (this.stats.delivered[g] || 0) + n;
      if (n >= 8 || this.rand() < 0.3) this.log(`${t.driver?.name || 'A truck'} delivered ${amount(g, n)} to the ${dst.name}.`);
      t.load = null; t.job = null; t.wait = 4; t.state = 'unloaded, looking for the next job';
    }
  }

  // ── Villagers ──
  // Decides the next thing to do from the clock, hunger, pantry and job.
  plan(v) {
    const m = this.minute, home = this.doorstep(v), work = this.workSpot(v);
    const sleepFrom = v.job === 'baker' && v.start < 6 * 60 ? 20 * 60 + 30 : 22 * 60 + 30;
    const wake = Math.min(v.start - 75, 6 * 60 + 30);
    const asleep = m >= sleepFrom || m < wake || (v.fatigue>=94 && m >= v.end);
    if (asleep) return this.goThen(v, home, { kind: 'sleep', at: 'home', until: wake < m ? wake + 24 * 60 : wake, activity: 'asleep at home' });
    if (v.hunger>=82 && m>=wake && !v.doneToday.breakfast) v.memory='very hungry, looking for breakfast';
    if (!v.doneToday.breakfast) {
      v.doneToday.breakfast = true;
      const meal = this.cookable(v, 'breakfast');
      if (meal) return this.goThen(v, home, { kind: 'cook', at: 'home', meal, dur: 20, activity: `making ${meal[0]}` });
      const cafe = this.place('cafe');
      if (this.open(cafe) && v.wallet >= 9) return this.goThen(v, cafe.front, { kind: 'eatout', at: 'cafe', dur: 25, activity: 'having breakfast at the Commit Café' });
      if (this.open(this.place('bakery')) && v.wallet >= 5) return this.goThen(v, this.place('bakery').front, { kind: 'snack', at: 'bakery', good: 'bread', dur: 8, activity: 'grabbing a bread roll at the Bakery' });
    }
    const working = m >= v.start && m < v.end;
    if (working && !(m >= 12 * 60 && m < 13 * 60 && !v.doneToday.lunch && v.job !== 'publican')) {
      if (v.work === 'home') return this.goThen(v, home, { kind: 'work', at: 'home', until: v.end, activity: 'coding at home' });
      if (v.job === 'postie' && !v.doneToday.round && (this.place('post').stock.parcel || 0) > 0) return this.postRound(v);
      return this.goThen(v, work, { kind: 'work', at: v.work, until: Math.min(v.end, m < 12 * 60 && v.job !== 'publican' ? 12 * 60 : v.end), activity: this.workActivity(v) });
    }
    if (working && !v.doneToday.lunch) {
      v.doneToday.lunch = true;
      const cafe = this.place('cafe');
      if (this.rand() < 0.5 && this.open(cafe) && v.wallet >= 10) return this.goThen(v, cafe.front, { kind: 'eatout', at: 'cafe', dur: 30, activity: 'grabbing lunch at the Commit Café' });
      const meal = this.cookable(v, 'lunch');
      if (meal) { this.eat(v, meal[0], meal[1]); return this.goThen(v, this.place('square').front, { kind: 'idle', dur: 30, activity: `eating ${meal[0]} in the Market Square` }); }
      return this.goThen(v, this.place('bakery').front, { kind: 'snack', at: 'bakery', good: 'pie', dur: 15, activity: 'buying a pie for lunch' });
    }
    // After work: shopping when the pantry is low, then dinner, then the evening.
    if (!v.doneToday.shopping && m >= Math.min(v.end, 16 * 60) && m < 18 * 60 + 30) {
      const list = this.shoppingList(v);
      v.doneToday.shopping = true;
      if (list.length) return this.shop(v, list);
    }
    if (!v.doneToday.dinner && m >= 17 * 60 + 30 && m < 20 * 60 + 30) {
      v.doneToday.dinner = true;
      const meal = this.cookable(v, 'dinner');
      if (meal) return this.goThen(v, home, { kind: 'cook', at: 'home', meal, dur: 40, activity: `cooking ${meal[0]}` });
      const pub = this.place('pub');
      if (this.open(pub) && v.wallet >= 18) return this.goThen(v, pub.front, { kind: 'eatout', at: 'pub', dur: 50, activity: 'having dinner at The Merged Branch' });
      const near = ['bakery', 'store'].find((id) => this.open(this.place(id)) && (id === 'bakery' ? this.place(id).out.pie : this.place(id).stock.bread));
      if (near && v.wallet >= 5) return this.goThen(v, this.place(near).front, { kind: 'snack', at: near, good: near === 'bakery' ? 'pie' : 'bread', dur: 8, activity: `picking up ${near === 'bakery' ? 'a pie' : 'some bread'} for tea` });
    }
    // After ordinary work, meals and shopping: an optional public election forum.
    // Quiet residents aren't coerced into a conversation or pulled from work.
    if (attendPublicForum(this,v)) return v.step;
    // Leisure.
    const r = this.rand();
    if (m >= 19 * 60 && r < 0.35 && this.open(this.place('pub'))) return this.goThen(v, this.place('pub').front, { kind: 'idle', at: 'pub', dur: 60 + this.rand() * 60, activity: 'having a yarn at the pub' });
    if (r < 0.55) return this.goThen(v, this.jitter(this.place('square').front, 8), { kind: 'idle', dur: 20 + this.rand() * 30, activity: 'taking a stroll through the Market Square' });
    if (r < 0.8) {
      const friend = this.homes[Math.floor(this.rand() * this.homes.length)];
      return this.goThen(v, { x: friend.door.x, z: friend.door.z + 1.8 }, { kind: 'idle', dur: 15 + this.rand() * 20, activity: `visiting the neighbours at ${friend.coordinate} (${friend.name})`, visit: friend });
    }
    return this.goThen(v, home, { kind: 'idle', at: 'home', dur: 40, activity: 'pottering about at home' });
  }

  // Just outside the front door; anyone whose step is "at home" has gone inside.
  doorstep(v) { return { x: v.home.door.x, z: v.home.door.z + 0.9 }; }

  workSpot(v) {
    if (v.work === 'home') return this.doorstep(v);
    const p = this.place(v.work);
    if (p.field) return { x: p.field.x0 + 2 + this.rand() * (p.field.x1 - p.field.x0 - 4), z: p.field.z0 + 3 + this.rand() * (p.field.z1 - p.field.z0 - 6) };
    if (v.job === 'truck driver') return p.front;
    return this.jitter(p.front, 2);
  }
  workActivity(v) {
    const a = { farmer: 'working the paddock', 'dairy hand': 'milking the cows', 'poultry keeper': 'collecting eggs', shearer: 'tending the sheep', miller: 'grinding flour', baker: 'baking bread and pies',
      barista: 'pulling coffees', cook: 'cooking brekkies', grocer: 'stacking the vegie crates', shopkeeper: 'serving at the counter', butcher: 'cutting lamb', publican: 'serving patrons',
      postie: 'sorting the mail', 'truck driver': 'driving deliveries', teacher: 'teaching a class', nurse: 'seeing patients', mayor: 'running the town', 'station master': 'meeting the train',
      student: 'in class', retired: 'feeding the ducks', artist: 'painting the town' };
    return `${a[v.job] || 'working'} at the ${v.work === 'home' ? 'house' : this.place(v.work).name}`;
  }
  jitter(p, r) { return { x: p.x + (this.rand() - 0.5) * r * 2, z: p.z + (this.rand() - 0.5) * r * 0.6 }; }

  cookable(v, kind) { return MEALS[kind].find(([, need]) => Object.entries(need).every(([k, n]) => (v.pantry[k] || 0) >= n)) || null; }
  shoppingList(v) {
    const want = { bread: 2, eggs: 2, milk: 2, veg: 2, fruit: 1, lamb: 1 };
    return Object.entries(want).filter(([k, n]) => (v.pantry[k] || 0) < n).map(([k]) => k);
  }
  shop(v, list) {
    // Bread from the bakery, or the General Store once the bakery has shut.
    const where = { bread: this.open(this.place('bakery')) ? 'bakery' : 'store', pie: 'bakery', eggs: 'store', milk: 'store', veg: 'greengrocer', fruit: 'greengrocer', lamb: 'butcher' };
    const stops = [...new Set(list.map((g) => where[g]))].filter((id) => this.open(this.place(id)));
    if (!stops.length) return null;
    v.queue = stops.map((id) => ({ kind: 'buy', at: id, items: list.filter((g) => where[g] === id), dur: 5, activity: `shopping at the ${this.place(id).name}` }));
    v.queue.push({ kind: 'idle', at: 'home', dur: 10, activity: 'unpacking the shopping', target: this.doorstep(v) });
    const first = v.queue.shift();
    return this.goThen(v, this.place(first.at).front, first);
  }
  postRound(v) {
    v.doneToday.round = true;
    const post = this.place('post');
    const n = Math.min(post.stock.parcel || 0, 6);
    post.stock.parcel -= n;
    const stops = Array.from({ length: n }, () => this.homes[Math.floor(this.rand() * this.homes.length)]);
    v.queue = stops.map((h) => ({ kind: 'parcel', home: h, dur: 2, activity: `delivering a parcel to ${h.coordinate} (${h.name})`, target: { x: h.door.x, z: h.door.z + 1.4 } }));
    v.queue.push({ kind: 'work', at: 'post', until: v.end, activity: 'sorting the mail at the Post Office', target: post.front });
    const first = v.queue.shift();
    return this.goThen(v, first.target, first);
  }

  goThen(v, target, step) {
    // Give shoppers and workers distinct, sheltered waiting/arrival spaces.
    // A short queue belongs on the shop-side footpath, NOT through the door,
    // inside the adjoining storefront or in the carriageway.
    const site=this.places.get(step.at);
    const atFront=site&&Math.hypot(target.x-site.front.x,target.z-site.front.z)<4.5;
    const reserves=atFront&&(['buy','snack','eatout'].includes(step.kind)||
      (step.kind==='work'&&site.kind!=='farm'&&v.job!=='truck driver')||
      (step.kind==='idle'&&['pub','square'].includes(step.at)));
    if(reserves){
      const active=new Set(this.villagers.filter(o=>o!==v &&
        o.step?.at===step.at && o.step?.queueSlot!==undefined &&
        (o.path?.length || o.step?.dur>0 || o.step?.until!==undefined)).map(o=>o.step.queueSlot));
      let slot=0;while(active.has(slot)&&slot<64)slot++;
      const row=Math.min(1,Math.floor(slot/11)),col=slot%11;
      const offset=col===0?0:(col%2?1:-1)*Math.ceil(col/2)*1.9;
      const towardRoad=site.side==='south'?-1:1;
      target={x:site.front.x+offset,z:site.front.z+row*1.9*towardRoad};
      step={...step,queueSlot:slot};
    }
    v.step = { ...step, target };
    v.path = Math.hypot(target.x - v.x, target.z - v.z) < 1 ? [] : walkRoute(v, target);
    // Long trips are by bike; short ones on foot.
    let len = 0, prev = v; for (const p of v.path) { len += Math.abs(p.x - prev.x) + Math.abs(p.z - prev.z); prev = p; }
    v.bike = len > 160 && v.job !== 'retired';
    if(v.bike) v.path=cyclingRoute(v.path,v,target,z=>ROAD(rowOf(z)));
    if (v.path.length) { v.inside = false; v.activity = `${v.bike ? 'cycling' : 'walking'} — ${step.activity}`; }
    else this.arrive(v);                       // already there
    return v.step;
  }

  eat(v, name, need) {
    for (const [k, n] of Object.entries(need || {})) v.pantry[k] = Math.max(0, (v.pantry[k] || 0) - n);
    const energy = Object.entries(need || {}).reduce((sum, [good, n]) => sum + (FOOD_ENERGY[good] || 0) * n, 0);
    v.hunger = Math.max(0, v.hunger - Math.min(75, energy || 40)); v.lastMeal = { name, at: this.minute, day: this.day };
    v.missedMeals=0;
    v.meals.unshift(`${name} (${fmt(this.minute)})`); v.meals.length = Math.min(v.meals.length, 5);
    this.stats.meals++;
    for (const [good, n] of Object.entries(need || {})) this.stats.foodConsumed[good] = (this.stats.foodConsumed[good] || 0) + n;
    this.rubbish(1);
  }

  liveVillager(v, minutes) {
    v.hunger = clamp(v.hunger + minutes * (v.step?.kind === 'sleep' ? 0.04 : 0.08), 0, 100);
    if(v.fatigue>92 && v.step?.kind==='work')v.memory='struggling to stay awake at work';
    if (v.engaged) return;                   // chatting with the player: stands still
    if (v.path.length) {
      // Dismount in the final 12 m; pushing a full-size bicycle through a
      // crowded shopfront is not realistic and causes large wheel overlaps.
      if(v.bike && v.path.length===1 &&
        Math.hypot(v.path[0].x-v.x,v.path[0].z-v.z)<12)v.bike=false;
      let budget = minutes * SEC_PER_MIN * (v.bike ? BIKE : WALK);
      while (budget > 0 && v.path.length) {
        if(v.path[0].dismount)v.bike=false;
        if(v.bike&&this.pedestrianWorld){
          const dest=v.path[0],dx=dest.x-v.x,dz=dest.z-v.z,dl=Math.hypot(dx,dz);
          const reach=Math.min(dl,budget),samples=Math.max(1,Math.ceil(reach/.28));
          for(let k=0;k<=samples;k++){
            const at=dl?reach*k/samples/dl:0;
            if(!bicycleClear(this.pedestrianWorld,v.x+dx*at,v.z+dz*at,dx,dz)){
              v.bike=false;
              budget=Math.min(budget,minutes*SEC_PER_MIN*WALK);
              break;
            }
          }
        }
        const destination=v.path[0];
        const barriers=[
          ...this.obstacles.map(p=>({x:p.x,z:p.z,radius:.75})),
          ...(this.externalPedestrians||[]),
          // Other moving townsfolk are handled by predictive steering and
          // personal-space resolution. A* is for stationary barriers only.
          ...this.villagers.filter(o=>o!==v&&!o.inside&&o.engaged).map(o=>({x:o.x,z:o.z,radius:.66}))
        ].filter(o=>Math.hypot(o.x-v.x,o.z-v.z)<7);
        // No involuntary interaction when walking near the player. A short,
        // collision-aware A* diversion lets people pass and continue work,
        // meals and sleep, rather than walking into an immobile player.
        if(!destination.detour && barriers.length){
          if(v.path.length===1&&canFinishNearOccupiedDoor(v,destination,barriers)){
            v.path.length=0;this.arrive(v);return;
          }
          const detour=pedestrianDetour(v,destination,barriers,this.pedestrianWorld);
          if(detour!==null){
            if(detour.length) {
              v.path.unshift(...detour);
              v.detourWait=0;
            } else {
              v.detourWait=(v.detourWait||0)+minutes;
              // If an intermediate pavement junction is blocked too long,
              // safely regenerate the remaining street route instead of
              // staying frozen forever or walking through the player.
              if(v.detourWait>4){
                // Never remain trapped at a doorway or waypoint forever.
                // Intermediate waypoints can be discarded; for the final
                // destination either enter when already close enough or
                // regenerate a fresh trip from the current safe position.
                v.detourWait=0;
                if(v.path.length>1){
                  v.path.shift();
                }else if(Math.hypot(v.x-destination.x,v.z-destination.z)<2.6){
                  v.path.length=0;this.arrive(v);return;
                }else{
                  const goal={x:destination.x,z:destination.z};
                  v.path=walkRoute(v,goal);
                  // A blocked final approach will be reconsidered on the
                  // next tick; don't teleport into an occupied doorway.
                }
              }
              break;
            }
          } else v.detourWait=0;
        }
        const p = v.path[0], dx = p.x - v.x, dz = p.z - v.z, d = Math.hypot(dx, dz);
        if (d <= budget) { v.x = p.x; v.z = p.z; budget -= d; v.path.shift(); }
        else { v.x += (dx / d) * budget; v.z += (dz / d) * budget; budget = 0; }
        v.heading = Math.atan2(dx, dz);
      }
      if (!v.path.length) this.arrive(v);
      return;
    }
    const s = v.step;
    if (!s) { this.plan(v); return; }
    if (!v.inside && (s.kind === 'work' || s.kind === 'idle')) this.roamOutdoor(v, s, minutes);
    if (s.dur !== undefined) { s.dur -= minutes; if (s.dur <= 0) this.finish(v); return; }
    if (s.until !== undefined) {
      const until = s.until % (24 * 60), past = s.kind === 'sleep' ? (this.minute >= until && this.minute < until + 60) : this.minute >= s.until;
      if (past) this.finish(v);
      return;
    }
    this.finish(v);
  }

  roamOutdoor(v, s, minutes) {
    if ((s.roamWait = (s.roamWait || 0) - minutes) > 0) return;
    if (!s.roamTarget) {
      const stepIdx = (s.roamStep = (s.roamStep || 0) + 1);
      const h1 = Math.sin((v.id + 1) * 12.9898 + stepIdx * 78.233) * 43758.5453;
      const h2 = Math.sin((v.id + 1) * 93.9898 + stepIdx * 47.113) * 24634.6345;
      const r1 = h1 - Math.floor(h1), r2 = h2 - Math.floor(h2);
      const p = s.at ? this.places.get(s.at) : null;
      if (p?.field) {
        s.roamTarget = {
          x: p.field.x0 + 2.5 + r1 * Math.max(2, p.field.x1 - p.field.x0 - 5),
          z: p.field.z0 + 3.5 + r2 * Math.max(2, p.field.z1 - p.field.z0 - 7),
        };
      } else {
        const base = s.target || { x: v.x, z: v.z };
        const spanX = s.at === 'square' ? 5.5 : 2.4;
        s.roamTarget = { x: base.x + (r1 - 0.5) * spanX * 2, z: base.z + (r2 - 0.5) * 1.4 };
      }
    }
    const dx = s.roamTarget.x - v.x, dz = s.roamTarget.z - v.z, d = Math.hypot(dx, dz);
    if (d < 0.25) { s.roamTarget = null; s.roamWait = 0.25; return; }
    const step = Math.min(d, minutes * SEC_PER_MIN * WALK * 0.72);
    const nx = v.x + (dx / d) * step, nz = v.z + (dz / d) * step;
    if (this.pedestrianWorld?.hits?.(nx, nz, 0.55)) { s.roamTarget = null; s.roamWait = 0.2; return; }
    v.x = nx; v.z = nz; v.heading = Math.atan2(dx, dz);
  }

  arrive(v) {
    const s = v.step; if (!s) return;
    v.activity = s.activity;
    // People actually ENTER shops to work, eat and buy things. Previously
    // everyone remained outdoors for their entire shift or café visit, causing
    // a permanent overlapping crowd in front of the Bakery and General Store.
    // Indoor shop staff already have their corresponding real-NPC counter model.
    const place=this.places.get(s.at);
    const indoorWork=s.kind==='work'&&place&&!['farm','depot','park','home'].includes(place.kind);
    const indoorVisit=['buy','snack','eatout'].includes(s.kind)&&place&&
      ['shop','cafe','pub'].includes(place.kind);
    v.inside=s.at==='home'||!!indoorWork||!!indoorVisit;
    if (s.kind === 'snack') this.snack(v, s.at, s.good);
    if (s.kind === 'eatout' || s.kind === 'buy' || s.kind === 'parcel') {
      // These happen on arrival; the step's duration is the time spent there.
      if (s.kind === 'eatout') this.eatOut(v, s.at);
      if (s.kind === 'buy') this.buy(v, s.at, s.items);
      if (s.kind === 'parcel') { this.parcels.push({ coordinate: s.home.coordinate, x: s.home.door.x + 0.6, z: s.home.door.z + 0.6, from: v.name }); this.stats.parcels++; }
    }
    if (s.visit) v.seen.unshift(s.visit.coordinate);
  }

  finish(v) {
    const s = v.step;
    if (s?.kind === 'cook' && s.meal) this.eat(v, s.meal[0], s.meal[1]);
    if (s?.kind === 'work' && this.minute >= v.end - 1 && v.paidDay !== this.day) this.pay(v);
    if (s?.kind === 'idle' && s.at === 'home' && v.carrying) {
      for (const [k, n] of Object.entries(v.carrying)) v.pantry[k] = (v.pantry[k] || 0) + n;
      v.carrying = null;
    }
    v.step = null;
    if (v.queue?.length) { const next = v.queue.shift(); this.goThen(v, next.target || this.place(next.at).front, next); return; }
    this.plan(v);
  }

  eatOut(v, where) {
    const p = this.place(where), menu = OUT_MEALS[where] || OUT_MEALS.cafe;
    const available = menu.filter((meal) => Object.entries(meal.ingredients).every(([g, n]) => (p.stock[g] || 0) >= n));
    const affordable = available.filter((meal) => v.wallet >= meal.price);
    if (!affordable.length) {
      if (!available.length) {
        this.stats.stockouts++;
        v.activity = `found the ${p.name} out of ingredients`;
        this.log(`The ${p.name} could not make a listed meal for ${v.name}; required ingredients were out of stock.`);
      } else v.activity = `could not afford a meal at the ${p.name}`;
      return;
    }
    const meal = affordable[Math.floor(this.rand() * affordable.length)];
    for (const [good, n] of Object.entries(meal.ingredients)) p.stock[good] -= n;
    v.wallet -= meal.price; this.sale(p, meal.price); this.stats.mealsOut++;
    this.eat(v, meal.name, meal.ingredients); v.activity = `${v.step.activity} — ${meal.name}`;
  }

  // Buys one item and eats it on the spot (a roll for breakfast, a pie for lunch).
  snack(v, shopId, good) {
    const shop = this.place(shopId), src = shopId === 'bakery' ? shop.out : shop.stock, price = GOODS[good].price;
    if (this.open(shop) && !(src[good] > 0)) this.stats.stockouts++;
    if (!this.open(shop) || !(src[good] > 0) || v.wallet < price) { v.memory = `the ${shop.name} had no ${GOODS[good].name} left`; v.activity = `found the ${shop.name} out of ${GOODS[good].name}`; return; }
    src[good]--; v.wallet -= price; this.sale(shop, price); this.stats.sold[good] = (this.stats.sold[good] || 0) + 1;
    this.eat(v, good === 'pie' ? 'a meat pie from the Bakery' : 'a fresh bread roll', { [good]: 1 });
  }

  buy(v, shopId, items) {
    const shop = this.place(shopId);
    const src = shopId === 'bakery' ? shop.out : shop.stock;
    const bag = v.carrying || {};
    const missing = [];
    for (const g of items) {
      const n = g === 'veg' || g === 'bread' ? 2 : 1;
      const have = src[g] || 0, price = GOODS[g].price * n;
      if (have >= n && v.wallet >= price) { src[g] -= n; bag[g] = (bag[g] || 0) + n; v.wallet -= price; this.sale(shop, price); this.stats.sold[g] = (this.stats.sold[g] || 0) + n; }
      else missing.push(GOODS[g].name);
    }
    if (Object.keys(bag).length) v.carrying = bag;
    this.stats.stockouts += missing.length;
    if (missing.length) { v.memory = `the ${shop.name} was out of ${missing.join(' and ')}`; if (this.rand() < 0.5) this.log(`${v.name} found the ${shop.name} out of ${missing.join(' and ')}.`); }
  }

  // Workers are paid at the end of each shift by their employer's till, or by the council for
  // public jobs (and when a business can't cover it). Programmers bring money in from clients
  // outside town. Money moves, it isn't made.
  pay(v) {
    v.paidDay = this.day;
    const base = WAGES[v.job] || BASE_WAGE, employer = v.work === 'home' ? null : this.place(v.work);
    // Unpaid wages from earlier shifts are owed and paid when there is money to pay them.
    const wage = v.job === 'programmer' ? base : base + (v.wageArrears || 0);
    let paid = 0, fromCouncil = 0;
    if (v.job === 'programmer') paid = base;                          // clients outside town pay; PAYG is withheld below
    else {
      if (employer && !PUBLIC.has(employer.id) && employer.till > 0) { paid = Math.min(wage, employer.till); employer.till -= paid; bizStats(this, employer.id).wages += paid; }
      if (paid < wage && stateFunded(v.work)) paid += drawState(this, wage - paid);
      const rest = Math.min(wage - paid, this.civic.treasury); this.civic.treasury -= rest; paid += rest; fromCouncil = rest;
      if (fromCouncil) noteCouncilWage(this, fromCouncil);
    }
    v.wallet += paid; this.stats.wages += paid;
    if (v.job !== 'programmer') {
      const short = Math.max(0, wage - paid);
      v.wageArrears = Math.min(base * 6, Math.round(short * 100) / 100);
      if (short > 0) this.log(`${v.name} is owed $${Math.round(short)} in wages.`);
    }
    const tax = withhold(this, v, paid);
    if (tax && this.rand() < 0.1) this.log(`${v.name} paid $${tax} income tax.`);
  }

  // ── For chat, the guide and the ledger ──
  describe(v) {
    const last = v.lastMeal ? `${v.lastMeal.name} at ${fmt(v.lastMeal.at)}${v.lastMeal.day !== this.day ? ' yesterday' : ''}` : 'nothing yet today';
    const pantry = Object.entries(v.pantry).filter(([, n]) => n > 0).map(([k, n]) => amount(k, n)).join(', ') || 'nothing much';
    return { name: v.name, job: v.job, workplace: v.work === 'home' ? 'from home' : this.place(v.work).name, home: `${v.home.coordinate} (${v.home.name})`,
      now: v.activity, lastMeal: last, recentMeals: v.meals, hungry: v.hunger > 60,
      fatigue: Math.round(v.fatigue), tired: v.fatigue>70, pantry, wallet: v.wallet, carrying: v.carrying, memory: v.memory || null };
  }
  news(n = 6) { return this.events.slice(0, n); }
  ledger() {
    const shops = [...this.places.values()].filter((p) => p.target && !['utility', 'industry', 'hall'].includes(p.kind)).map((p) => ({ name: p.name, stock: p.stock, till: Math.round(p.till), open: this.open(p) }));
    const farms = [...this.places.values()].filter((p) => p.kind === 'farm').map((p) => ({ name: p.name, makes: GOODS[p.makes].name, waiting: p.out[p.makes] || 0, growth: p.growth, herd: herdReport(this, p.id) }));
    return { day: this.day, time: fmt(this.minute), stats: this.stats, yesterday: this.yesterday || null, shops, farms, trucks: this.trucks.map((t) => ({ driver: t.driver?.name, state: t.state, load: t.load })), parcels: this.parcels.length, news: this.news(12),
      civic: this.civic, utilities: { fuel: this.place('power').stock.fuel, reservoir: this.place('waterworks').stock.water, wastewater: this.place('sewage').stock.wastewater, landfill: this.place('landfill').stock.rubbish, recycling: this.place('recycling').stock.recyclables, parts: this.place('hall').stock.parts },
      population: this.villagers.length, atWork: this.villagers.filter((v) => v.step?.kind === 'work').length, asleep: this.villagers.filter((v) => v.step?.kind === 'sleep').length };
  }

  // Saves just what matters to resume tomorrow where the town left off.
  snapshot() {
    const pick = (o, keys) => { const r = { id: o.id }; for (const k of keys) if (o[k] !== undefined) r[k] = o[k]; return r; };
    const state = { saveVersion:2, seed: this.seed, rngState: this.rand.getState(), day: this.day, minute: this.minute, powerGridEvents:this.powerGridEvents, powerGridEventSeq:this.powerGridEventSeq, civic: this.civic, places: [...this.places.values()].map((p) => [p.id, p.stock, p.out, p.till, p.growth]), villagers: this.villagers.map((v) => [v.id, v.pantry, v.wallet, v.lastMeal, v.meals, v.hunger, v.fatigue, v.restedMinutes, v.wageArrears || 0, v.rateArrears || 0, v.housingArrears || 0]), hotelBookings:this.place('hotel').bookings,
      sim: { events: this.events, stats: this.stats, yesterday: this.yesterday || null, villagers: this.villagers.map((v) => ({ ...pick(v, SIM_VILLAGER_FIELDS), wageArrears: v.wageArrears || 0, rateArrears: v.rateArrears || 0, housingArrears: v.housingArrears || 0 })), trucks: (this.trucks || []).map((t) => pick(t, SIM_TRUCK_FIELDS)), parcels: this.parcels || [] } };
    return JSON.parse(JSON.stringify(state));
  }
  // Returns false (and changes nothing) for a malformed save or one from a newer version.
  restore(s) {
    if (!s || typeof s !== 'object' || Array.isArray(s)) return false;
    if (s.saveVersion !== undefined && (!Number.isInteger(s.saveVersion) || s.saveVersion < 1 || s.saveVersion > 3)) return false;
    if (!Number.isFinite(s.day) || s.day < 1 || !Number.isFinite(s.minute) || s.minute < 0 || s.minute >= 1440) return false;
    if (s.civic !== undefined && (s.civic === null || typeof s.civic !== 'object' || Array.isArray(s.civic))) return false;
    if (s.places !== undefined && !Array.isArray(s.places)) return false;
    if (s.villagers !== undefined && !Array.isArray(s.villagers)) return false;
    let sim = null;
    if (s.sim !== undefined) {
      const r = s.sim;
      const ok = r && typeof r === 'object' && Array.isArray(r.events) && r.stats && typeof r.stats === 'object' && Array.isArray(r.villagers) && Array.isArray(r.trucks) && Array.isArray(r.parcels)
        && r.villagers.length === this.villagers.length && r.trucks.length === (this.trucks || []).length && Number.isInteger(s.rngState) && s.rngState >= 0 && s.rngState <= 0xffffffff && Number.isInteger(s.seed) && s.seed >= 0 && s.seed <= 0xffffffff
        && r.villagers.every((v) => v && Number.isInteger(v.id) && this.villagers.some((x) => x.id === v.id)) && r.trucks.every((t) => t && Number.isInteger(t.id) && Array.isArray(t.path) && (this.trucks || []).some((x) => x.id === t.id));
      if (!ok) return false;
      sim = JSON.parse(JSON.stringify(r));
    }
    this.day = Number.isFinite(s.day) && s.day >= 1 ? s.day : 1;
    this.minute = Number.isFinite(s.minute) && s.minute >= 0 && s.minute < 1440 ? s.minute : 7 * 60;
    // v1 saves had no schema tag, event history or feeder faults. They are
    // retained and naturally migrate to v2 on the next save.
    this.powerGridEvents=Array.isArray(s.powerGridEvents)?s.powerGridEvents.slice(-80):[];
    this.powerGridEventSeq=Number.isSafeInteger(s.powerGridEventSeq)?s.powerGridEventSeq:this.powerGridEvents.length;
    if (s.civic && typeof s.civic === 'object') Object.assign(this.civic, s.civic, { player: { ...this.civic.player, ...(s.civic.player || {}) } });
    restoreCivic(this,s.civic?.government);
    initialisePublicLife(this);
    this.civic.powerLines = this.civic.powerLines && typeof this.civic.powerLines === 'object' ? this.civic.powerLines : {};
    if(this.civic.supply.powerDemand>0)this.updatePowerGrid();
    for (const [id, stock, out, till, growth] of s.places || []) { const p = this.place(id); if (p) Object.assign(p, { stock, out, till, growth: growth ?? p.growth }); }
    for (const [id, pantry, wallet, lastMeal, meals, hunger, fatigue, restedMinutes, wageArrears, rateArrears, housingArrears] of s.villagers || []) { const v = this.villagers[id]; if (v) Object.assign(v, { pantry, wallet, lastMeal, meals: meals || [], hunger: Number.isFinite(hunger)?hunger:v.hunger, fatigue: Number.isFinite(fatigue)?fatigue:v.fatigue, restedMinutes: Number.isFinite(restedMinutes)?restedMinutes:0, wageArrears: Number.isFinite(wageArrears)?wageArrears:0, rateArrears: Number.isFinite(rateArrears)?rateArrears:0, housingArrears: Number.isFinite(housingArrears)?housingArrears:0 }); }
    this.place('hotel').bookings=Array.isArray(s.hotelBookings)?s.hotelBookings.slice(-12):[];
    if (sim) {
      this.seed = s.seed; this.rand.setState(s.rngState);
      this.events = sim.events; this.stats = sim.stats; this.yesterday = sim.yesterday || undefined;
      for (const saved of sim.villagers) { const cur = this.villagers.find((x) => x.id === saved.id); for (const k of SIM_VILLAGER_FIELDS) if (Object.prototype.hasOwnProperty.call(saved, k)) cur[k] = saved[k]; }
      for (const saved of sim.trucks) { const cur = this.trucks.find((x) => x.id === saved.id); for (const k of SIM_TRUCK_FIELDS) if (Object.prototype.hasOwnProperty.call(saved, k)) cur[k] = saved[k]; }
      this.parcels = sim.parcels;
    }
    startNeeds(this);
    return true;
  }
}
