// Bread batch mini-simulation, integrated with TownLife stock and the mill.
// Hourly bakery output in life.everyHour remains unchanged and authoritative.
// This *optional*, once-per-town-day supervised batch consumes real flour and
// adds saleable bread only after proofing and baking time.
const now=life=>life.day*1440+life.minute;
export function bakeryInventory(life){
 const p=life.place('bakery');
 return {
  flour:p.stock.flour||0, eggs:p.stock.eggs||0,milk:p.stock.milk||0,
  meat:p.stock.lamb||0,vegetables:p.stock.veg||0,
  bread:p.out.bread||0,pies:p.out.pie||0,
  bakeryOpen:life.open(p),time:life.time(),day:life.day,
  bakers:life.villagers.filter(v=>v.work==='bakery'),
  working:life.villagers.filter(v=>v.work==='bakery'&&v.step?.kind==='work'&&!v.path?.length),
  batch:(life.civic.bakeryBatch||null)
 };
}
export function superviseBread(life,action){
 const p=life.place('bakery'),s=bakeryInventory(life),t=now(life);
 const b=life.civic.bakeryBatch||null;
 const fail=message=>({ok:false,message,batch:life.civic.bakeryBatch||null});
 if(!['mix','oven','unload'].includes(action))return fail('Unknown bakery action');
 if(action==='mix'){
  if(b && (b.phase!=='finished'||b.day===life.day))
    return fail(b.phase==='finished'?'This supervised batch is finished; try another tomorrow.':'Finish the current dough batch first.');
  if(!s.working.length)return fail('A baker must be on shift before mixing starts. Watch the bakery clock and staff roster.');
  if(s.flour<2)return fail('Not enough flour. The bakery needs two bags delivered from the town Mill.');
  if(s.bread>22)return fail('The sales racks are almost full. Sell some bread before starting another batch.');
  p.stock.flour-=2;
  life.civic.bakeryBatch={phase:'proofing',day:life.day,startedAt:t,readyAt:t+40,flourUsed:2,loaves:8};
  life.log('A supervised bread batch started: two flour bags were mixed into dough at the Bakery.');
  return {ok:true,message:'Dough mixed. It is proofing for 40 town minutes. Flour inventory decreased by two bags.',batch:life.civic.bakeryBatch};
 }
 if(!b)return fail('There is no supervised dough batch. Start at the spiral mixer.');
 if(action==='oven'){
  if(b.phase!=='proofing')return fail(b.phase==='baking'?'Bread is already in the oven.':'There is no dough ready for the oven.');
  if(t<b.readyAt)return fail('Proofing is still underway. Wait '+Math.ceil(b.readyAt-t)+' town minutes.');
  life.civic.bakeryBatch={...b,phase:'baking',readyAt:t+25};
  life.log('Proofed dough went into the Bakery deck oven. The loaves need 25 town minutes.');
  return {ok:true,message:'The dough has been transferred to the deck oven. Baking takes 25 town minutes.',batch:life.civic.bakeryBatch};
 }
 if(b.phase==='finished')return fail('Those loaves have already been removed from the oven.');
 if(b.phase!=='baking')return fail('Let the dough proof, then load it into the oven.');
 if(t<b.readyAt)return fail('The loaves are baking. Wait '+Math.ceil(b.readyAt-t)+' town minutes.');
 if((p.out.bread||0)>22)return fail('Clear space on the sales rack by selling bread before unloading the oven.');
 p.out.bread=(p.out.bread||0)+8;
 life.stats.baked+=8;
 life.civic.bakeryBatch={...b,phase:'finished',readyAt:t,finishedAt:t};
 life.log('The supervised Bakery batch finished: eight fresh loaves reached the sales shelves.');
 return {ok:true,message:'Eight fresh loaves were baked and stocked for sale. The real TownLife bread inventory and baked total increased.',batch:life.civic.bakeryBatch};
}
