import { pilotMains } from './electrical-pilot.js';

// A roster is not proof of presence: council work can send somebody elsewhere.
export function workingAt(worker, siteId, place = null) {
  if(worker?.step?.kind!=='work'||worker.step.at!==siteId)return false;
  if(!worker.path?.length)return true;
  // Real workers already standing at their building's front desk must not
  // disappear from the roster simply because the route planner leaves a
  // handful of one-metre waypoints on their commute. Distant travellers
  // still cannot open a locked workplace or serve customers.
  return !!place?.front && Number.isFinite(worker.x) && Number.isFinite(worker.z) &&
    Math.hypot(worker.x-place.front.x,worker.z-place.front.z)<=3.0;
}


// Retail counters need an actual worker, not merely an opening-hours sign.
const RETAIL = new Set(['store','bakery','greengrocer','butcher','cafe','pub']);
export function shopService(town, place) {
  if (!town.open(place)) return {available:false, reason:'closed', message:`${place.name} is closed.`};
  const power=pilotMains(town,'B:'+place.id);
  if(power===false)return {available:false,reason:'power-outage',message:`${place.name}: no mains electricity. Till and refrigerated food sales cannot operate.`};
  const staff = town.villagers.filter(v => workingAt(v, place.id, place));
  if (RETAIL.has(place.id) && !staff.length)
    return {available:false, reason:'unstaffed', message:`${place.name}: waiting for staff. Nobody is at the counter to serve you.`};
  return {available:true, reason:'serving', staff, message:staff.length ? `Serving now: ${staff.map(v=>v.name).join(', ')}.` : 'Open.'};
}
