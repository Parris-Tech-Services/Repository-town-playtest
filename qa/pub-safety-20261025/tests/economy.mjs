// Run: node src/tests/economy.mjs
// Actual current public-sector finance and finite local transactions.
import assert from 'node:assert/strict';
import { TownLife, GOODS, ROSTER_SIZE } from '../world/life.js';
const homes=Array.from({length:188},(_,i)=>({coordinate:String.fromCharCode(65+i%26)+(1+Math.floor(i/26)),name:'Home '+i,door:{x:i%26*26,z:Math.floor(i/26)*46}}));
const t=new TownLife({homes});
assert.equal(t.villagers.length,ROSTER_SIZE);
assert.equal(t.civic.player.wallet,75);
const total=()=>t.civic.player.wallet+t.civic.player.bank+t.civic.treasury+
 t.civic.finance.federal+t.civic.finance.state+
 t.villagers.reduce((n,v)=>n+v.wallet,0)+
 [...t.places.values()].reduce((n,p)=>n+(p.till||0)+(p.operating||0),0);
t.minute=11*60;
const worker=t.villagers.find(v=>v.work==='store');worker.step={kind:'work',at:'store'};worker.path=[];
const initial=total(),shop=t.place('store'),before=t.shelves(shop).bread,price=GOODS.bread.price;
assert.match(t.buyItem('store','bread'),/You buy/);
assert.equal(t.civic.player.wallet,75-price);
assert.equal(t.civic.player.bag.bread,1);
assert.equal(t.shelves(shop).bread,before-1);
assert(Math.abs(total()-initial)<0.001,'local purchase must conserve accounted funds');
assert.match(t.sellItem('store','bread'),/buys it back/);
assert.equal(t.civic.player.bag.bread,0);
assert(Math.abs(total()-initial)<0.001,'buyback must conserve accounted funds');
const wallet=t.civic.player.wallet,bank=t.civic.player.bank;
assert.match(t.bank('deposit',10),/Deposited/);
assert.equal(t.civic.player.wallet,wallet-10);
assert.equal(t.civic.player.bank,bank+10);
assert.match(t.bank('withdraw',10),/Withdrew/);
assert.equal(t.civic.player.wallet,wallet);
assert.equal(t.civic.player.bank,bank);
assert(Math.abs(total()-initial)<0.001,'bank transfers must conserve funds');
t.civic.player.wallet=0;
assert.match(t.buyItem('store','bread'),/need/);
assert.equal(t.civic.player.wallet,0,'failed purchase must not create debt');
assert.equal(t.shelves(shop).bread,before,'failed purchase must not take stock');
console.log('PASS: finite local trades, bank transfers, stock and insufficient funds');
