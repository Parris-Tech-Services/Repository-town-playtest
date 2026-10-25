import { cafeCounter } from './workplay.js';
// Shop counters: a real line in arrival order, served by however many staff are on the floor,
// then (for cooked food) a kitchen that takes time to make it. Pure logic, deterministic.
//
// The line is not stored separately: it is every villager whose step at a place is waiting for
// service, ordered by when they joined, so a saved game restores it exactly. Kitchen tickets live
// with whoever ordered them (a villager's step, or civic.player.orders for the visitor), and the
// kitchen's backlog is counted from those tickets.
import { shopService } from './shop-attendance.js';

export const COUNTERS = new Set(['store', 'bakery', 'greengrocer', 'butcher', 'cafe', 'pub']);
export const GIVE_UP = 20;    // town minutes in line before a customer leaves without being served

// Minutes at the counter: choosing, weighing, paying.
const counterTime = (step) => step.kind === 'buy' ? 1 + 0.4 * (step.items?.length || 1) : 1.5;

// Minutes the kitchen needs, by dish name or menu id. Unknown dishes take eight.
const PREP = [   // most specific first: the first match wins
  [/parmy/, 18], [/breakfast|brekkie/, 12], [/pie and mash|pub_pie/, 12], [/roast/, 10], [/chips/, 8], [/eggs|omelette/, 8],
  [/toastie|sausage/, 6], [/toast|roll|muffin|bun|lamington/, 5], [/soup|pie/, 4], [/juice|fruit/, 4],
  [/espresso|long-black|flat.white|latte|cappuccino|coffee|tea|cuppa|cordial|soft.drink|beer/, 3],
];
export function prepMinutes(name) {
  const s = String(name).toLowerCase();
  for (const [re, m] of PREP) if (re.test(s)) return m;
  return 8;
}

const now = (life) => life.day * 1440 + life.minute;
const waiting = (life, placeId) => life.villagers.filter((o) => o.step?.at === placeId && o.step.queue && !o.path?.length)
  .sort((a, b) => a.step.queue.joined - b.step.queue.joined || a.id - b.id);

// Customers ahead of someone who would join now, and how many staff are serving.
export function lineAt(life, placeId) {
  const line = waiting(life, placeId), place = life.place(placeId), service = shopService(life, place);
  return { length: line.length, staff: service.available ? Math.max(1, service.staff?.length || 1) : 0, names: line.map((o) => o.name) };
}

// Orders still cooking at a venue (villagers' and the visitor's).
function cooking(life, placeId) {
  const t = now(life);
  return life.villagers.filter((o) => o.step?.at === placeId && o.step.food && o.step.food.ready > t).length
    + (life.civic.player.orders || []).filter((o) => o.venue === placeId && o.ready > t).length;
}
// When a newly ordered dish will be ready: the kitchen works on as many orders as there are staff.
export function readyAt(life, placeId, dish) {
  const staff = Math.max(1, shopService(life, life.place(placeId)).staff?.length || 1);
  return now(life) + prepMinutes(dish) * (1 + Math.floor(cooking(life, placeId) / staff));
}

// On arrival: join the line instead of being served on the spot.
export function joinLine(life, v) {
  const s = v.step;
  s.queue = { joined: now(life) + v.id / 1000, serving: null };
  const ahead = waiting(life, s.at).length - 1;
  v.activity = ahead > 0 ? `queuing at the ${life.place(s.at).name} (${ahead} ahead)` : `at the counter of the ${life.place(s.at).name}`;
}

// One tick for a customer in line or waiting on the kitchen. `serve(v)` completes the sale (and, for a
// meal, the eating); it returns false when the customer was turned away. Returns true while busy.
export function tickCounter(life, v, minutes, serve, dishFor) {
  const s = v.step, place = life.place(s.at);
  if(cafeCounter(life,v))return true;
  if (s.food) {
    if (now(life) < s.food.ready) return true;
    const dish = s.food.dish; delete s.food;
    serve(v, dish);
    return false;
  }
  const q = s.queue;
  if (q.serving !== null) {
    q.serving -= minutes;
    if (q.serving > 0) return true;
    delete s.queue;
    if (s.kind === 'eatout') {
      // Order taken: the counter is free for the next person while the kitchen cooks.
      const dish = dishFor(v);
      s.food = { dish, ready: readyAt(life, place.id, dish[0]) };
      v.activity = `waiting for ${dish[0]} at the ${place.name}`;
      return true;
    }
    serve(v);
    return false;
  }
  const service = shopService(life, place);
  if (!service.available) { delete s.queue; serve(v); return false; }   // staff left: the usual "no service" outcome
  const line = waiting(life, place.id), busy = line.filter((o) => o.step.queue.serving !== null).length;
  const staff = Math.max(1, service.staff?.length || 1);
  const free = line.filter((o) => o.step.queue.serving === null);
  if (busy < staff && free[0] === v) {
    q.serving = counterTime(s);
    const clerk = service.staff?.[busy % staff];
    v.activity = `being served${clerk ? ' by ' + clerk.name : ''} at the ${place.name}`;
    return true;
  }
  if (now(life) - q.joined > GIVE_UP) {
    delete s.queue;
    v.memory = `gave up waiting in the queue at the ${place.name}`;
    v.activity = `gave up queuing at the ${place.name}`;
    if (s.dur !== undefined) s.dur = Math.min(s.dur, 1);
    return false;
  }
  const ahead = free.indexOf(v);
  v.activity = `queuing at the ${place.name}${ahead > 0 ? ` (${ahead} ahead)` : ''}`;
  return true;
}

// ── The visitor's orders ──────────────────────────────────────────────────────
// A paid order waits at the kitchen; `deliver` hands it over when it is ready.
export function placeOrder(life, venue, item, name, kind) {
  const me = life.civic.player;
  if (!Array.isArray(me.orders)) me.orders = [];
  const ready = readyAt(life, venue, item), ticket = (me.ticket = (me.ticket || 0) + 1);
  me.orders.push({ ticket, venue, item, name, kind, ready });
  return { ticket, ready, minutes: Math.round(ready - now(life)) };
}
export function readyOrders(life) {
  const me = life.civic.player, t = now(life);
  if (!Array.isArray(me.orders) || !me.orders.length) return [];
  const done = me.orders.filter((o) => o.ready <= t);
  me.orders = me.orders.filter((o) => o.ready > t);
  return done;
}
export function pendingOrders(life) {
  const t = now(life);
  return (life.civic.player.orders || []).map((o) => ({ ...o, minutes: Math.max(0, Math.ceil(o.ready - t)) }));
}
