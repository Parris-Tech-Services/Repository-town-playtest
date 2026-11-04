// Run: node src/tests/economy-realism.mjs
// An open town economy imports goods and exports labour. Unlike a closed economy,
// town-only money supply can change; test the actual account and inventory invariants.
import assert from 'node:assert/strict';
import { TownLife, ROSTER_SIZE } from '../world/life.js';
const homes=Array.from({length:188},(_,i)=>({coordinate:String.fromCharCode(65+i%26)+(1+Math.floor(i/26)),name:'Home '+i,door:{x:i%26*26,z:Math.floor(i/26)*46}}));
const t=new TownLife({homes});
for(let d=0;d<7;d++){
 for(let h=0;h<24;h++)t.tick(60);
 assert.equal(t.villagers.length,ROSTER_SIZE);
 const accounts=[t.civic.player.wallet,t.civic.player.bank,t.civic.treasury,t.civic.finance.federal,t.civic.finance.state,
 ...t.villagers.map(v=>v.wallet),...[...t.places.values()].flatMap(p=>[p.till||0,p.operating||0])];
 assert(accounts.every(n=>Number.isFinite(n)&&n>=-0.001),'nonnegative, finite account balances');
 for(const p of t.places.values())
   for(const n of Object.values(p.stock||{}))assert(Number.isFinite(n)&&n>=0,'no negative inventory');
 assert.equal(t.ledger().population,ROSTER_SIZE);
}
const state=t.snapshot(),copy=new TownLife({homes});
copy.restore(state);
assert.equal(copy.day,t.day);
assert.equal(copy.civic.player.wallet,t.civic.player.wallet);
assert(Math.abs(copy.civic.treasury-t.civic.treasury)<0.01);
assert.equal(copy.civic.finance.federal,t.civic.finance.federal);
assert.equal(copy.civic.finance.state,t.civic.finance.state);
console.log('PASS: seven-day livelihoods, stock, balances, ledger and finance persistence');