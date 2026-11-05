// Narromine residents who work in Repository Town park at their workplace while on shift: their own
// car (model and colour from narromine-commute.js), one 6.5 m kerbside space each, as close to the business's
// frontage as is free, in the parking strip beside its kerb. Drawn with the same vehicle models as Narromine traffic.
import { loadVehicleModels } from './narromine-vehicle-models.js';
import { dayPlan } from './narromine-population.js';

export function createRepoTownCommuterParking(parent, pop, life, { models = typeof document !== 'undefined' } = {}) {
  let real = null, parked = [];
  if (models) loadVehicleModels(parent, { max: 40 }).then((r) => { real = r; real.draw(parked); }).catch(() => {});
  const commuters = pop.people.filter((p) => p.repoTownJob && p.car);
  // Cars parked right now: drivers whose plan has them at work in Repository Town.
  function update(weekday, minute) {
    const out = [];
    for (const p of commuters) {
      const step = dayPlan(p, pop.households[+p.household.slice(3)], weekday, pop.workplaces).find((s) => minute >= s.from && minute < s.to);
      if (step?.kind !== 'work') continue;
      const place = life.places.get(p.repoTownJob.id); if (!place?.curb) continue;
      // North and south frontages: the kerb is on the business's side of the road (+1.7 m beyond the lane
      // marker); the street-8 row faces the other way.
      const side = place.side === 'north' || place.side === 'south' ? 1 : -1;
      const car = pop.cars[+p.car.slice(4)];
      // Nearest free 6.5 m space along this kerb, working outwards from the business's frontage.
      const z = place.curb.z + side * 1.7; let x = place.curb.x;
      for (let n = 0; n < 40; n++) { const cand = place.curb.x + (n % 2 ? 1 : -1) * Math.ceil(n / 2) * 6.5; if (!out.some((c) => Math.abs(c.z - z) < 2 && Math.abs(c.x - cand) < 6)) { x = cand; break; } }
      out.push({ x, z, yaw: Math.PI / 2, model: car.model, colour: car.colour, L: car.length, owner: p.name, place: p.repoTownJob.name });
    }
    parked = out; real?.draw(parked);
    return parked;
  }
  // Solid while parked, so the player's car can't drive through them.
  const colliders = (player) => parked.filter((c) => Math.hypot(c.x - player.x, c.z - player.z) < 60).map((c) => ({ x0: c.x - c.L / 2, x1: c.x + c.L / 2, z0: c.z - 0.95, z1: c.z + 0.95, traffic: true }));
  return { update, colliders, get parked() { return parked; } };
}
