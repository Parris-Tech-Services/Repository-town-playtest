// Walk-in homes for Narromine's residents (narromine-population.js). Every resident's house gets the rooms
// people actually live in: a lounge, a kitchen with a fridge, pantry and stove, a bathroom, a laundry, and a
// bedroom for each sleeper (couples share a double bed; young siblings share). The fridge and pantry show
// what that household really has: stocked on its last Coles trip, used up meal by meal since.
// Interiors use the same builder as Repository Town homes. Front doors face the household's street.
import { buildInterior } from './interior.js';
import { dayPlan } from './narromine-population.js';
import { townDate } from './town-calendar.js';
import { makePerson } from './npcs.js';

// What one person's share of a Coles shop is, and what each person uses a day.
// Households shop about three times a week (including stops on the way home from work), so each shop
// covers about 2.4 days of what a person eats (DAILY below).
export const SHOP = { milk: 1, bread: 0.36, eggs: 1.2, meat: 1, veg: 2.4, fruit: 2.4, cereal: 0.17 };
const DAILY = { milk: 0.4, bread: 0.15, eggs: 0.5, meat: 0.4, veg: 1, fruit: 1, cereal: 0.07 };
const UNITS = { milk: 'L of milk', bread: 'loaves of bread', eggs: 'eggs', meat: 'meat portions', veg: 'serves of vegetables', fruit: 'pieces of fruit', cereal: 'boxes of cereal' };

// Front door: the footprint edge facing the street, and where you stand when you come back out.
export function homeDoor(home) {
  const dx = home.kerb.x - home.x, dz = home.kerb.z - home.z, D = Math.hypot(dx, dz) || 1, ux = dx / D, uz = dz / D;
  const c = Math.cos(home.yaw), s = Math.sin(home.yaw);
  const half = Math.abs(ux * c + uz * s) * home.w / 2 + Math.abs(-ux * s + uz * c) * home.d / 2;
  const door = { x: home.x + ux * half, z: home.z + uz * half };
  return { ...door, out: { x: door.x + ux * 2.2, z: door.z + uz * 2.2, yaw: Math.atan2(-ux, -uz) } };
}

// The four wall midpoints of a footprint as door candidates, the street-facing wall first.
export function doorCandidates(home) {
  const c = Math.cos(home.yaw), s = Math.sin(home.yaw), ax = [[c, s, home.w / 2], [-c, -s, home.w / 2], [-s, c, home.d / 2], [s, -c, home.d / 2]];
  const kx = home.kerb.x - home.x, kz = home.kerb.z - home.z;
  const doors = ax.map(([ux, uz, h]) => { const door = { x: home.x + ux * h, z: home.z + uz * h }; return { ...door, out: { x: door.x + ux * 2.2, z: door.z + uz * 2.2, yaw: Math.atan2(-ux, -uz) }, facing: ux * kx + uz * kz }; });
  doors.sort((a, b) => b.facing - a.facing);
  return [homeDoor(home), ...doors];
}
// First candidate whose doorstep is free within 1.3 m and whose approach (1.5–4 m out) is clear.
export function pickDoor(cands, probe) {
  for (const d of cands) {
    const ux = d.out.x - d.x, uz = d.out.z - d.z, L = Math.hypot(ux, uz) || 1;
    let free = false; for (let t = 0; t <= 1.3 && !free; t += 0.1) free = !probe(d.x + ux / L * t, d.z + uz / L * t, 0.4);
    if (!free) continue;
    let clear = true; for (let t = 1.5; t <= 4 && clear; t += 0.25) clear = !probe(d.x + ux / L * t, d.z + uz / L * t, 0.4);
    if (clear) return d;
  }
  return null;
}
export function createNarromineHomeIndex(population) {
  const CELL = 30, grid = new Map(), key = (x, z) => Math.floor(x / CELL) + ',' + Math.floor(z / CELL);
  let doors = population.homes.map((h) => ({ home: h, door: homeDoor(h), cands: doorCandidates(h) }));
  const reindex = () => { grid.clear(); for (const d of doors) { const k = key(d.door.x, d.door.z); if (!grid.has(k)) grid.set(k, []); grid.get(k).push(d); } };
  reindex();
  return {
    get doors() { return doors; },
    // Move each door to a wall the player can actually reach (probe(x, z, r) → true when blocked).
    resolve(probe) { const before = doors.length; doors = doors.filter((d) => { const p = pickDoor(d.cands, probe); if (p) d.door = p; return !!p; }); reindex(); return { kept: doors.length, dropped: before - doors.length }; },
    // The home whose front door is within reach of this point (null if none).
    near(pos, reach = 1.4) {
      let best = null, bd = reach;
      for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (const d of grid.get((Math.floor(pos.x / CELL) + dx) + ',' + (Math.floor(pos.z / CELL) + dz)) || []) {
        const dist = Math.hypot(pos.x - d.door.x, pos.z - d.door.z); if (dist < bd) { bd = dist; best = d; }
      }
      return best;
    },
  };
}

// The minute (from the town's start) a household last finished a Coles shop, looking back up to 8 days.
function lastShop(population, hh, day, minute) {
  const adults = hh.members.map((id) => population.people[+id.slice(3)]).filter((p) => p.age >= 18);
  for (let d = day; d >= Math.max(1, day - 8); d--) {
    const wd = townDate(d).weekday;
    let best = null;
    for (const p of adults) for (const s of dayPlan(p, hh, wd, population.workplaces)) if (s.kind === 'shop' && (d < day || s.to <= minute)) best = Math.max(best ?? 0, s.to);
    if (best !== null) return d * 1440 + best;
  }
  return null;
}
// What is in a household's fridge and pantry right now.
export function fridgeAt(population, hh, day, minute) {
  const n = hh.members.length, shop = lastShop(population, hh, day, minute);
  const days = shop === null ? 4 : (day * 1440 + minute - shop) / 1440;
  const out = {};
  // After a shop the fridge holds that shop plus about two days left over from before.
  for (const k of Object.keys(SHOP)) out[k] = Math.max(0, Math.round(((SHOP[k] + DAILY[k] * 2) * n - DAILY[k] * n * days) * 10) / 10);
  return { items: out, daysSinceShop: Math.round(days * 10) / 10, needsShop: Object.entries(out).some(([k, v]) => v < DAILY[k] * n * 1.5) };
}
export const describeFridge = (f) => Object.entries(f.items).map(([k, v]) => (k === 'milk' || k === 'bread' || k === 'cereal' ? v : Math.round(v)) + ' ' + UNITS[k]).join(', ');

// Who is at home right now and what they are doing.
export function occupants(population, hh, day, minute) {
  const wd = townDate(day).weekday;
  return hh.members.map((id) => population.people[+id.slice(3)]).map((p) => {
    const step = dayPlan(p, hh, wd, population.workplaces).find((s) => minute >= s.from && minute < s.to);
    const where = !step || step.at === 'home' ? 'home' : step.at === 'coles' ? 'at Coles' : step.kind === 'school' || step.at === p.school ? 'at school' : 'at work';
    return { person: p, home: where === 'home', doing: where === 'home' ? (step?.kind || 'home') : where };
  });
}

export function buildNarromineHomeInterior(population, home, makeLabel, day, minute) {
  const hh = population.households.find((h) => h.id === home.household);
  const people = hh.members.map((id) => population.people[+id.slice(3)]);
  const fridge = fridgeAt(population, hh, day, minute), who = occupants(population, hh, day, minute);
  const info = (title, text) => ({ do: 'info', title, text });
  const doing = { sleep: 'asleep', breakfast: 'having breakfast', dinner: 'having dinner', evening: 'relaxing', home: 'at home' };
  const whoText = who.map((o) => `${o.person.name} (${o.person.age}): ${o.home ? doing[o.doing] || 'at home' : o.doing}`).join('; ');
  const rooms = [
    { name: 'Lounge', w: 10, d: 9, props: [['sofa', 'Couch'], ['tv', 'Television', info('Television', 'The ' + hh.surname + ' household television.')], ['lamp', 'Lamp'], ['aircon', 'Air conditioner', info('Air conditioner', 'Split-system air conditioning: Narromine summers often pass 35°C.')], ['table', 'Who is home', info('The ' + hh.surname + ' household', whoText)]] },
    { name: 'Kitchen', w: 10, d: 8, props: [['fridge', 'Fridge', info('Fridge', describeFridge(fridge) + '. Last Coles shop ' + fridge.daysSinceShop + ' days ago' + (fridge.needsShop ? '; running low.' : '.'))], ['pantry', 'Pantry', info('Pantry', 'Cereal, tins, rice and pasta from Coles Narromine.')], ['stove', 'Oven and cooktop'], ['kitchenSink', 'Kitchen sink'], ['crockery', 'Plates and cutlery'], ['table', 'Kitchen table'], ['chair', 'Chair']] },
    { name: 'Bathroom', w: 7, d: 6, props: [['shower', 'Shower'], ['toilet', 'Toilet'], ['basin', 'Basin and mirror']] },
    { name: 'Laundry', w: 6, d: 6, props: [['washingMachine', 'Washing machine'], ['freezer', 'Chest freezer'], ['switchboard', 'Switchboard']] },
  ];
  // Bedrooms: couples/parents share; children up to two to a room; other adults have their own.
  const couple = people.filter((p) => p.role === 'partner' || p.role === 'parent'), kids = people.filter((p) => p.role === 'child'), others = people.filter((p) => !couple.includes(p) && !kids.includes(p));
  if (couple.length) rooms.push({ name: 'Main bedroom', w: 8, d: 8, props: [['bed', couple.length > 1 ? 'Double bed · ' + couple.map((p) => p.first).join(' & ') : 'Bed · ' + couple[0].first, info('Main bedroom', couple.map((p) => p.name).join(' and ') + '.')], ['wardrobe', 'Wardrobe'], ['lamp', 'Bedside lamp']] });
  for (let i = 0; i < kids.length; i += 2) { const k = kids.slice(i, i + 2); rooms.push({ name: 'Bedroom ' + (rooms.length - 3), w: 7, d: 7, props: [...k.map((p) => ['bed', 'Bed · ' + p.first, info(p.first + "'s bed", p.name + ', ' + p.age + (p.school ? ', goes to ' + (population.workplaces.find((w) => w.id === p.school)?.name || 'school') : ''))]), ['desk', 'Desk'], ['toyBlocks', 'Toys']] }); }
  for (const p of others) rooms.push({ name: 'Bedroom ' + (rooms.length - 3), w: 7, d: 7, props: [['bed', 'Bed · ' + p.first, info(p.first + "'s bed", p.name + ', ' + p.age)], ['wardrobe', 'Wardrobe'], ['lamp', 'Lamp']] });
  const house = { repo: 'narromine-' + home.id, name: 'The ' + hh.surname + ' household', int: { layout: 'row', height: 2.7, rooms } };
  const built = buildInterior(house, makeLabel);
  // The residents who are home, where their activity puts them: in bed asleep, in the kitchen at
  // breakfast or dinner, otherwise in the lounge. Children are drawn smaller.
  const roomCentre = (i) => { const r = built.rooms[i]; return { x: (r.x0 + r.x1) / 2, z: (r.z0 + r.z1) / 2 }; };
  const find = (t, label) => built.interactables.find((o) => o.type === t && (!label || o.label.includes(label)));
  const SHIRTS = [0x3f6fb5, 0xb5473f, 0x4f8a4b, 0xd9a441, 0x6a4c93, 0x2f7f86, 0xc96b8a, 0x8a6a4f];
  let n = 0;
  for (const o of who.filter((x) => x.home)) {
    const p = o.person, seed = +p.id.slice(3), fig = makePerson(seed * 13 + 5, SHIRTS[seed % SHIRTS.length], p.age < 18 ? 0x2f4f7f : 0x2f3440).group;
    const scale = p.age < 5 ? 0.55 : p.age < 12 ? 0.72 : p.age < 16 ? 0.88 : 1; fig.scale.setScalar(scale);
    let at = null;
    if (o.doing === 'sleep') {
      const bed = find('bed', p.first);
      if (bed) { fig.position.set(bed.pos.x + (n % 2 ? 0.45 : -0.45) * (bed.label.includes('&') ? 1 : 0), 0.62, bed.pos.z + 0.2); fig.rotation.set(-Math.PI / 2, 0, 0); built.group.add(fig); n++; continue; }
    }
    const anchor = o.doing === 'breakfast' || o.doing === 'dinner' ? find('fridge') : find('tv');
    if (anchor) { const c = roomCentre(anchor.room); const dx = c.x - anchor.pos.x, dz = c.z - anchor.pos.z, D = Math.hypot(dx, dz) || 1; at = { x: anchor.pos.x + dx / D * (1.6 + (n % 3) * 0.7), z: anchor.pos.z + dz / D * (1.6 + (n % 3) * 0.7) + (n % 2 ? 0.6 : -0.6), yaw: Math.atan2(-dx, -dz) }; }
    if (!at) continue;
    fig.position.set(at.x, 0, at.z); fig.rotation.y = at.yaw; built.group.add(fig); n++;
    const label = makeLabel(p.first + ' ' + p.surname + ', ' + p.age); if (label) { label.position.set(at.x, 2.15 * scale + 0.1, at.z); built.group.add(label); }
  }
  return { ...built, household: hh, fridge, occupants: who, figures: n };
}
