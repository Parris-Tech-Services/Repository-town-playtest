// The bakers' kitchen: a supervised bread batch the visitor can help run (src/world/bakery-production.js).
// It uses the bakery's real flour and adds real loaves to the sales rack; hourly baking carries on as normal.
import { bakeryInventory, superviseBread } from '../world/bakery-production.js';
import { GOODS } from '../world/life.js';
import { esc } from './interactions.js';

const fmt = (n) => (Number.isFinite(n) ? n.toLocaleString('en-AU') : '0');
const minsLeft = (b, life) => (!b?.readyAt ? 0 : Math.max(0, Math.ceil(b.readyAt - (life.day * 1440 + life.minute))));
const clock = (m) => `${Math.floor(m / 60)}:${String(m % 60).padStart(2, '0')}`;

export function bakeryKitchenPanel(life, note = '') {
  const s = bakeryInventory(life), b = s.batch;
  const stage = b ? ({
    proofing: `Dough is proofing (${minsLeft(b, life)} town minutes to go).`,
    baking: `Loaves are baking (${minsLeft(b, life)} town minutes to go).`,
    finished: b.day === life.day ? 'Eight loaves came out of the oven today and are on the rack.' : 'Yesterday\'s batch is done. You can start another.',
  }[b.phase] || 'Ready') : 'No batch started yet.';
  const roster = s.bakers.map((v) => esc(`${v.name} (${v.job}, ${clock(v.start)}–${clock(v.end)})`)).join(', ') || 'No assigned staff';
  const run = (action, where) => () => { const z = superviseBread(life, action); return bakeryKitchenPanel(life, z.message); };
  return {
    title: 'Bakery kitchen', wide: true,
    body: `${note ? `<p><b>${esc(note)}</b></p>` : ''}
      <p>The bakers let you lend a hand with a batch. It mixes real flour into dough, proofs for 40 town minutes, then bakes for 25. Pastry hygiene rules apply: hand wash first, benches clean, ovens guarded. This is a game, not a live oven controller.</p>
      <p><b>Town time:</b> ${esc(s.time)}, day ${fmt(s.day)} · ${s.bakeryOpen ? 'shop open' : 'shop closed'} · ${s.working.length} baker(s) on shift now</p>
      <h3>What's in the bakery</h3>
      <p><b>Flour:</b> ${fmt(s.flour)} bags · <b>eggs:</b> ${fmt(s.eggs)} · <b>milk:</b> ${fmt(s.milk)} · <b>lamb:</b> ${fmt(s.meat)} · <b>veg:</b> ${fmt(s.vegetables)}</p>
      <p><b>Bread on the rack:</b> ${fmt(s.bread)} loaves at $${GOODS.bread.price} · <b>pies:</b> ${fmt(s.pies)} at $${GOODS.pie.price}</p>
      <p><b>Your batch:</b> ${esc(stage)}</p>
      <p><b>Bakers:</b> ${roster}</p>
      <p class="dim">The bakery also bakes by itself every hour while the bakers work. A hand-run batch is limited to one per town day.</p>`,
    actions: [
      { label: 'Mix a batch (2 flour bags)', run: run('mix') },
      { label: 'Put proofed dough in the oven', run: run('oven') },
      { label: 'Unload eight finished loaves', run: run('unload') },
    ],
  };
}
