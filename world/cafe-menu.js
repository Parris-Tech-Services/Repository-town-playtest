// Commit Cafe menu: shared by the player-facing counter and the town economy.
// Every item is made from real stocks; prices are Australian dollars.
import { receipt } from './jobs.js';

export const CAFE_MENU = Object.freeze([
  {id:'espresso',name:'Espresso',category:'Coffee',price:4,ingredients:{coffee:1},hunger:2},
  {id:'long-black',name:'Long black',category:'Coffee',price:4,ingredients:{coffee:1},hunger:2},
  {id:'flat-white',name:'Flat white',category:'Coffee',price:5,ingredients:{coffee:1,milk:1},hunger:5},
  {id:'latte',name:'Latte',category:'Coffee',price:5,ingredients:{coffee:1,milk:1},hunger:6},
  {id:'cappuccino',name:'Cappuccino',category:'Coffee',price:5,ingredients:{coffee:1,milk:1},hunger:5},
  {id:'iced-latte',name:'Iced latte',category:'Cold drinks',price:6,ingredients:{coffee:1,milk:1},hunger:6},
  {id:'black-tea',name:'Pot of tea',category:'Tea',price:4,ingredients:{tea:1},hunger:2},
  {id:'milk-tea',name:'Tea with milk',category:'Tea',price:4,ingredients:{tea:1,milk:1},hunger:4},
  {id:'fruit-juice',name:'Fresh fruit juice',category:'Cold drinks',price:6,ingredients:{fruit:2},hunger:12},
  {id:'toast',name:'Toast',category:'Breakfast',price:5,ingredients:{bread:1},hunger:24},
  {id:'eggs-toast',name:'Eggs on toast',category:'Breakfast',price:13,ingredients:{eggs:2,bread:1},hunger:42},
  {id:'big-brekkie',name:'Big breakfast',category:'Breakfast',price:19,ingredients:{eggs:2,bread:1,veg:1},hunger:58},
  {id:'vegie-toastie',name:'Vegetable toastie',category:'Lunch',price:12,ingredients:{bread:2,veg:1},hunger:38},
  {id:'soup',name:'Vegetable soup with bread',category:'Lunch',price:13,ingredients:{veg:2,bread:1},hunger:43},
  {id:'pie',name:'Meat pie',category:'Lunch',price:9,ingredients:{pie:1},hunger:49},
  {id:'fruit-bowl',name:'Fresh fruit bowl',category:'Breakfast',price:9,ingredients:{fruit:2},hunger:27},
]);
export const cafeAvailable = (cafe,item) =>
  Object.entries(item.ingredients).every(([good,n])=>(cafe.stock[good]||0)>=n);

export function orderCafe(t,id) {
  const item=CAFE_MENU.find(x=>x.id===id);
  if(!item)return 'That item is not on the cafe menu.';
  const cafe=t.place('cafe'),player=t.civic.player;
  if(!t.open(cafe))return 'Commit Cafe is closed. It opens at 06:30.';
  if(!cafeAvailable(cafe,item))return item.name+' is sold out until the next delivery.';
  if(player.wallet<item.price)return 'You need $'+item.price+' for '+item.name+', but have $'+player.wallet+'.';
  for(const [good,n] of Object.entries(item.ingredients))cafe.stock[good]-=n;
  player.wallet-=item.price;
  t.sale(cafe,item.price);
  receipt(t,'purchase',item.name+' at Commit Cafe',-item.price);
  player.hunger=Math.max(0,(player.hunger??0)-item.hunger);
  player.lastAte=item.name+' (Day '+t.day+' '+t.time()+')';
  t.stats.meals++;
  t.stats.sold[id]=(t.stats.sold[id]||0)+1;
  t.rubbish(1);
  t.log('The visitor ordered '+item.name+' at Commit Cafe.');
  return 'Served '+item.name+' for $'+item.price+'. Hunger: '+Math.round(player.hunger)+'%.';
}
