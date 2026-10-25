// Batch metadata reconciles against the existing authoritative stock totals.
// Reserving/returning a carton moves its exact batch; it never manufactures stock.
const shelfLife={bread:2,milk:3,eggs:7,coffee:30,tea:30};
const suppliers={bread:'bakery',milk:'dairy',eggs:'coop',coffee:'depot',tea:'depot'};
const chilled=g=>['milk','eggs'].includes(g);
const clock=t=>t.day*1440+t.minute;
const order=(a,b)=>a.expires-b.expires||a.id-b.id;
export function storeBatches(t){
 const s=t.civic.storeBatches??={next:1,lots:[],quarantine:[],claims:[],lastAt:clock(t)};
 const stock=t.place('store').stock;
 for(const good of Object.keys(shelfLife)){
  const have=Math.max(0,stock[good]||0),tracked=s.lots.filter(b=>b.good===good).reduce((n,b)=>n+b.n,0);
  if(have>tracked){const n=have-tracked;s.lots.push({id:s.next++,good,n,shelf:0,received:t.day,expires:t.day+shelfLife[good],supplier:suppliers[good],warm:0});}
  let remove=tracked-have;
  for(const b of s.lots.filter(b=>b.good===good).sort(order)){const n=Math.min(Math.max(0,remove),b.n);b.n-=n;b.shelf=Math.max(0,b.shelf-n);remove-=n;}
 }
 s.lots=s.lots.filter(b=>b.n>0);
 return s;
}
export function batchLabel(b){return '#'+b.id+' '+b.good+' · received day '+b.received+' · use by day '+b.expires+' · '+b.n+' units'+(chilled(b.good)?' · cold exposure '+Math.ceil(b.warm||0)+' min':'');}
export function reserveBatch(t,good,batchId,max=3){
 const s=storeBatches(t),available=s.lots.filter(b=>b.good===good&&b.n>b.shelf).sort(order),b=available[0];
 if(!b)return {ok:false,message:'No backroom batch of '+good+' is available.'};
 if(batchId!==undefined&&Number(batchId)!==b.id)return {ok:false,message:'Use first-expiring batch #'+b.id+' before newer stock. Read the date labels.'};
 if(b.expires<=t.day)return {ok:false,message:'This batch is past its game use-by date. Quarantine it.'};
 const n=Math.min(max,b.n-b.shelf);b.n-=n;t.place('store').stock[good]-=n;
 return {ok:true,carton:{good,n,batch:{...b,n,shelf:0},pickedAt:clock(t),warm:b.warm||0},message:'Carrying '+n+' '+good+' from batch #'+b.id+', use by day '+b.expires+'.'};
}
export function cartonUnsafe(t,carton){return carton.batch?.expires<=t.day||(chilled(carton.good)&&(carton.warm||0)+clock(t)-(carton.pickedAt??clock(t))>=120);}
export function restoreBatch(t,carton,onShelf=false){
 const s=storeBatches(t);
 if(cartonUnsafe(t,carton)){s.quarantine.push({...carton.batch,n:carton.n,good:carton.good,reason:'Date / cold exposure',returned:false});return false;}
 const info=carton.batch||{id:s.next++,good:carton.good,received:t.day,expires:t.day+shelfLife[carton.good],supplier:suppliers[carton.good],warm:0};
 let b=s.lots.find(x=>x.id===info.id);if(!b){b={...info,n:0,shelf:0};s.lots.push(b);}
 b.n+=carton.n;b.shelf+=onShelf?carton.n:0;b.warm=(carton.warm||0)+(chilled(carton.good)?clock(t)-(carton.pickedAt??clock(t)):0);
 t.place('store').stock[carton.good]=(t.place('store').stock[carton.good]||0)+carton.n;
 return true;
}
export function quarantineBatch(t,good){
 const s=storeBatches(t),b=s.lots.filter(b=>b.good===good&&b.n>b.shelf).sort(order)[0];if(!b)return null;
 b.n--;t.place('store').stock[good]--;const q={...b,n:1,shelf:0,reason:'Damaged packaging',returned:false};s.quarantine.push(q);return q;
}
export function returnToSupplier(t,id){
 const s=storeBatches(t),q=s.quarantine.find(q=>q.id===Number(id)&&!q.returned);
 if(!q)return {ok:false,message:'This quarantined batch has already been returned, or does not exist.'};
 q.returned=true;s.claims.push({id:s.claims.length+1,batch:q.id,good:q.good,n:q.n,supplier:q.supplier,status:'returned',day:t.day});
 // No invented refund: without an invoiced purchase cost the physical return
 // is documented for supplier review; it creates neither cash nor replacements.
 return {ok:true,message:'Batch #'+q.id+' returned to '+(t.place(q.supplier)?.name||'supplier')+' for review. No automatic cash or replacement stock created.'};
}
export function tickStoreBatches(t){
 if(!t.civic.storeBatches)return;
 const s=storeBatches(t),stock=t.place('store').stock;let wasted=0;
 const elapsed=Math.max(0,clock(t)-(s.lastAt??clock(t)));s.lastAt=clock(t);
 const powered=t.gridPowered('bakery');
 for(const b of s.lots)if(chilled(b.good)&&!powered)b.warm=(b.warm||0)+elapsed;
 for(const b of s.lots){if(b.expires<=t.day||(chilled(b.good)&&(b.warm||0)>=240)){stock[b.good]=Math.max(0,(stock[b.good]||0)-b.n);wasted+=b.n;b.n=0;}}
 s.lots=s.lots.filter(b=>b.n>0);
 if(wasted){t.stats.wasted+=wasted;t.rubbish(wasted);t.log('General Store date rotation removed '+wasted+' expired / cold-chain failed units before sale.');}
}
