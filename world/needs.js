// Physiology, food and paid lodgings. Town minutes, persistent and deterministic.
// Neither meals nor shelter are magically free. No health/death punishment.
const clamp=(n)=>Math.max(0,Math.min(100,n));
export const HOTEL_RATE=24, HOTEL_ROOMS=4;
export const FOOD_ENERGY={bread:38,pie:55,fruit:34,veg:32,eggs:44,milk:30,lamb:56};
export function startNeeds(t) {
  const p=t.civic.player;
  p.hunger=clamp(Number.isFinite(p.hunger)?p.hunger:32);
  p.fatigue=clamp(Number.isFinite(p.fatigue)?p.fatigue:22);
  p.lastSleptDay=Number.isInteger(p.lastSleptDay)?p.lastSleptDay:0;
  p.lastAte=typeof p.lastAte==='string'?p.lastAte:'';
  p.hotelBooking=p.hotelBooking&&typeof p.hotelBooking==='object'?p.hotelBooking:null;
  for(const v of t.villagers){
    v.fatigue=clamp(Number.isFinite(v.fatigue)?v.fatigue:20+(v.id%12));
    v.restedMinutes=Number.isFinite(v.restedMinutes)?v.restedMinutes:0;
    v.missedMeals=Number.isInteger(v.missedMeals)?v.missedMeals:0;
  }
  return p;
}
export function advanceNeeds(t,minutes) {
  const p=startNeeds(t);
  p.hunger=clamp(p.hunger+minutes*0.075);
  p.fatigue=clamp(p.fatigue+minutes*0.062);
  for(const v of t.villagers){
    const sleeping=v.step?.kind==='sleep'&&v.inside&&!v.path.length;
    // People regain energy only when actually home, not while travelling.
    v.fatigue=clamp(v.fatigue+(sleeping?-0.19:0.07)*minutes);
    if(sleeping)v.restedMinutes+=minutes;
    if(v.hunger>92&&v.fatigue>92&&v.job!=='student')v.memory='exhausted and struggling to find a meal';
  }
}
export function eatPlayer(t,good) {
  const p=t.civic.player;
  if(!Object.hasOwn(FOOD_ENERGY,good))return 'That item is not an edible meal.';
  if(!(p.bag[good]>0))return 'You do not have that food in your bag.';
  p.bag[good]--;
  p.hunger=clamp(p.hunger-FOOD_ENERGY[good]);
  p.lastAte=good+' (Day '+t.day+' '+t.time()+')';
  t.rubbish(1);t.stats.meals++;
  t.log('The visitor ate '+good+' from their supplies.');
  return 'You eat '+good+'. Hunger is now '+Math.round(p.hunger)+'%.';
}
export function hotelCheckIn(t) {
  const p=startNeeds(t),hotel=t.place('hotel');
  if(!hotel)return 'There is no hotel in town.';
  if(p.hotelBooking?.day===t.day)return 'You already have a room key for tonight.';
  const booked=hotel.bookings||[];
  const today=booked.filter(x=>x.day===t.day);
  if(today.length>=HOTEL_ROOMS)return 'The hotel is fully booked tonight.';
  if(p.wallet<HOTEL_RATE)return 'A room costs $'+HOTEL_RATE+'. You have $'+p.wallet+'. Withdraw savings at the Community Bank.';
  p.wallet-=HOTEL_RATE;
  t.sale(hotel,HOTEL_RATE);
  const room=[1,2,3,4].find(n=>!today.some(x=>x.room===n));
  hotel.bookings=[...booked.filter(x=>x.day>=t.day-1),{day:t.day,room,guest:'Player'}].slice(-12);
  p.hotelBooking={day:t.day,room};
  t.log('The visitor checked into the Railway Hotel, room '+room+'.');
  return 'Room '+room+' booked for $'+HOTEL_RATE+'. Find a guest bed to sleep.';
}
export function sleepPlayer(t,site='hotel',room=null) {
  const p=startNeeds(t);
  const valid=p.hotelBooking&&(p.hotelBooking.day===t.day||(t.minute<360&&p.hotelBooking.day===t.day-1));
  if(site!=='hotel'||!valid)return 'You need to book a hotel room for tonight first.';
  if(room!==null&&room!==p.hotelBooking.room)return 'Your key is for guest room '+p.hotelBooking.room+'.';
  if(t.minute>=360&&t.minute<1080)return 'Overnight sleep starts at 18:00. Come back this evening.';
  const start=t.minute,mins=(6*60-start+1440)%1440||480;
  // Sleeping runs the *same* town simulation, including businesses, wages,
  // hunger and neighbours, rather than teleporting the clock or minting money.
  let n=Math.min(480,Math.max(300,mins));
  for(let done=0;done<n;done+=0.5)t.tick(Math.min(0.5,n-done));
  p.fatigue=clamp(p.fatigue-95);
  p.hunger=clamp(p.hunger+7);
  p.lastSleptDay=t.day;
  p.hotelBooking=null;
  t.log('The visitor slept at the Railway Hotel and woke up rested.');
  return 'You slept at the hotel. It is Day '+t.day+' '+t.time()+'. Fatigue '+Math.round(p.fatigue)+'%, hunger '+Math.round(p.hunger)+'%.';
}
export function needsReport(t){
  const p=startNeeds(t),all=t.villagers;
  return {hunger:p.hunger,fatigue:p.fatigue,lastAte:p.lastAte,
    booking:p.hotelBooking,rate:HOTEL_RATE,rooms:HOTEL_ROOMS,
    hungry:all.filter(v=>v.hunger>65).length,exhausted:all.filter(v=>v.fatigue>70).length,
    sleeping:all.filter(v=>v.step?.kind==='sleep'&&v.inside).length,
    mealsToday:t.stats.meals};
}
