// Paid shifts and the visitor's receipts, on this town's money model. The visitor picks a shift at a
// workplace, stays inside it while a staff member is on duty, does its three duties and collects the
// wage. Pay comes from the employer's till first, then the council, and PAYG tax goes to the
// Commonwealth, so no money is made. (Ported from the earlier live-site job board.)
import { recordEarning } from './credit.js';
import { withholdVisitor } from './finance.js';

export const JOB_BOARD = Object.freeze([
  { id: 'bakery-assistant', site: 'bakery', name: 'Bakery assistant', minutes: 35, pay: 24, tasks: ['wash-hands', 'prep-bench', 'cooling'], blurb: 'Help shape, tray and pack baked goods' },
  { id: 'farm-hand', site: 'garden', name: 'Market Garden hand', minutes: 45, pay: 30, tasks: ['water-plants', 'weed-beds', 'pack-produce'], blurb: 'Water, weed and collect produce' },
  { id: 'depot-sorter', site: 'depot', name: 'Rail Depot parcel sorter', minutes: 40, pay: 28, tasks: ['sort-freight', 'verify-manifest', 'stack-parcels'], blurb: 'Sort incoming freight and secure parcels' },
  { id: 'store-stocker', site: 'store', name: 'General Store shelf stocker', minutes: 35, pay: 24, tasks: ['check-expiry', 'refill-shelves', 'count-stock'], blurb: 'Count stock, check dates and refill shelves' },
  { id: 'post-assistant', site: 'post', name: 'Post Office assistant', minutes: 30, pay: 22, tasks: ['sort-mail', 'label-parcels', 'prepare-route'], blurb: 'Sort letters into the delivery rounds' },
  { id: 'civic-cleaner', site: 'hall', name: 'Town Hall caretaker', minutes: 35, pay: 25, tasks: ['clean-floors', 'file-records', 'inspect-lighting'], blurb: 'Tidy public areas and inspect facilities' },
]);
export const MAX_SHIFTS_PER_DAY = 2;
const TASK_GAP = 5; // town minutes between duties

export const freshJobs = () => ({ active: null, done: {}, earned: 0, spent: 0, receipts: [] });
function jobs(life) {
  const c = life.civic;
  if (!c.jobs || typeof c.jobs !== 'object') c.jobs = freshJobs();
  const j = c.jobs;
  if (!Array.isArray(j.receipts)) j.receipts = [];
  if (!j.done || typeof j.done !== 'object') j.done = {};
  return j;
}
const byId = (id) => JOB_BOARD.find((x) => x.id === id);
const nowMin = (life) => life.day * 1440 + life.minute;
const clean = (s) => String(s || '').slice(0, 90);

export function receipt(life, type, text, amount) {
  const j = jobs(life);
  j.receipts.unshift({ day: life.day, type: clean(type), text: clean(text), amount: Math.round(amount * 100) / 100 });
  if (j.receipts.length > 40) j.receipts.length = 40;
  if (type === 'purchase') j.spent = Math.round((j.spent + Math.abs(amount)) * 100) / 100;
}

export const supervisors = (life, site) => life.villagers.filter((v) =>
  v.work === site && life.minute >= v.start && life.minute < v.end && life.open(life.place(site)));
export function current(life) { const a = jobs(life).active; return a && a.day === life.day ? a : null; }
const doneToday = (life) => (jobs(life).done[life.day] || []);

export function startJob(life, id) {
  const j = jobs(life), def = byId(id), site = def && life.place(def.site);
  if (!def) return { ok: false, message: 'Unknown job.' };
  if (current(life)) return { ok: false, message: 'Finish or cancel your current shift first.' };
  if (doneToday(life).includes(id)) return { ok: false, message: 'You already did that shift today.' };
  if (doneToday(life).length >= MAX_SHIFTS_PER_DAY) return { ok: false, message: `You can work ${MAX_SHIFTS_PER_DAY} shifts a day.` };
  if (!life.open(site)) return { ok: false, message: `${site.name} is closed right now.` };
  j.active = { id, site: def.site, day: life.day, worked: 0, required: def.minutes, pay: def.pay, tasks: [], lastTaskAt: -999 };
  return { ok: true, message: `Shift started at ${site.name}. Stay inside while the staff are working.` };
}

// Called every simulated minute: the shift only advances while the visitor is inside the workplace
// with a staff member on duty.
export function tickJobs(life, minutes) {
  const a = jobs(life).active;
  if (!a) return;
  if (a.day !== life.day) { jobs(life).active = null; return; }          // an unfinished shift lapses at midnight
  if (life.playerAt === a.site && supervisors(life, a.site).length) a.worked = Math.min(a.required, a.worked + minutes);
}

export function performTask(life, task) {
  const a = current(life), def = a && byId(a.id);
  if (!a || !def.tasks.includes(task)) return { ok: false, message: 'That is not a duty on your current shift.' };
  if (life.playerAt !== a.site) return { ok: false, message: 'You need to be inside the workplace.' };
  if (!supervisors(life, a.site).length) return { ok: false, message: 'There is no one on duty to supervise you.' };
  if (a.tasks.includes(task)) return { ok: false, message: 'You already did that duty.' };
  const wait = TASK_GAP - (nowMin(life) - a.lastTaskAt);
  if (wait > 0) return { ok: false, message: `Give it ${Math.ceil(wait)} more town minutes before the next duty.` };
  a.tasks.push(task); a.lastTaskAt = nowMin(life);
  return { ok: true, message: `Done: ${task.replace(/-/g, ' ')}.` };
}

export function abandonJob(life) {
  if (!current(life)) return { ok: false, message: 'You have no shift.' };
  jobs(life).active = null;
  return { ok: true, message: 'Shift cancelled. No wages.' };
}

export function finishJob(life) {
  const j = jobs(life), a = current(life), def = a && byId(a.id);
  if (!a) return { ok: false, message: 'You have no shift.' };
  if (life.playerAt !== a.site) return { ok: false, message: 'Be inside the workplace to clock out.' };
  if (a.worked < a.required) return { ok: false, message: `${Math.ceil(a.required - a.worked)} town minutes still to work.` };
  if (a.tasks.length < def.tasks.length) return { ok: false, message: 'Finish all three duties first.' };
  const place = life.place(def.site), c = life.civic;
  let paid = 0;
  if (place && !['hall', 'school', 'clinic', 'post', 'depot', 'square'].includes(place.id) && place.till > 0) { paid = Math.min(def.pay, Math.floor(place.till)); place.till -= paid; }
  const rest = Math.min(def.pay - paid, Math.floor(c.treasury)); c.treasury -= rest; paid += rest;
  j.active = null;
  if (paid <= 0) return { ok: false, message: 'The employer cannot pay wages today. The shift is not lost; try again tomorrow.' };
  c.player.wallet += paid;
  const tax = withholdVisitor(life, paid);
  j.done[life.day] = [...doneToday(life), def.id];
  for (const d of Object.keys(j.done)) if (Number(d) < life.day - 2) delete j.done[d];
  j.earned += paid - tax;
  recordEarning(life, paid - tax);
  receipt(life, 'wage', `${def.name}, $${paid} gross, $${tax} PAYG`, paid - tax);
  return { ok: true, message: `Shift complete. $${paid} gross, $${tax} PAYG tax, $${paid - tax} in your wallet.` };
}

export function jobsReport(life) {
  const j = jobs(life), a = current(life);
  return { active: a ? { ...a, tasks: [...a.tasks] } : null, earned: j.earned, spent: j.spent, receipts: j.receipts.slice(0, 9), shiftsToday: doneToday(life).length, doneToday: [...doneToday(life)] };
}
