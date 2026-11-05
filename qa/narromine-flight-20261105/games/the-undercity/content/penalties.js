/* Four narratively distinct penalty hubs with free arrival stories and recovery options.
   Triggered by the rule-engine quality CP threshold; not a permanent game over. */
(function(){
"use strict";
const entries={
 suspicion:{
  place:"the_watch_house",menace:"suspicion",title:"The Watch House",
  arrival:"The brass gate of the Watch House closes without a sound. The clerk reads aloud the wrong name and then makes a correction in permanent ink. Your Record will not entirely forget this visit.",
  options:[
   {label:"Submit your evidence to the night clerk",description:"1 action; reduce Suspicion by four levels.",cost:1,reduce:4,fee:0,outcome:"The clerk cannot deny what you have documented. Your release is entered in the book, but the arrest remains."},
   {label:"Pay the appointed solicitor",description:"1 action, 6 pennies; reduce Suspicion by six.",cost:1,reduce:6,fee:6,outcome:"A solicitor argues you out of the cells before midnight. There is a receipt with a price and a date."},
   {label:"Perform a shift for the Watch",description:"2 actions; reduce Suspicion by five.",cost:2,reduce:5,fee:0,outcome:"You sort testimony that ought to have been believed the first time. At dawn the guard returns your belongings."}
  ]},
 notoriety:{
  place:"the_tribunal",menace:"notoriety",title:"The Unspoken Tribunal",
  arrival:"Twelve judges sit in a room without voices. A thirteenth chair has been left for the public figure you have accidentally become. Every spectator is taking notes.",
  options:[
   {label:"Deliver a quiet apology",description:"1 action; reduce Notoriety by four.",cost:1,reduce:4,fee:0,outcome:"Your words satisfy the court, though their meaning travels through the crowd in several contradictory versions."},
   {label:"Hire a skilled advocate",description:"1 action, 6 pennies; reduce Notoriety by six.",cost:1,reduce:6,fee:6,outcome:"The advocate convinces the Tribunal to dismiss the hearing, then asks you never to repeat their methods."},
   {label:"Publish a carefully documented correction",description:"2 actions; reduce Notoriety by five.",cost:2,reduce:5,fee:0,outcome:"The correction does not make you popular, but it makes the rumours harder to defend."}
  ]},
 wounds:{
  place:"the_ward",menace:"wounds",title:"The Quiet Ward",
  arrival:"A physician lifts your coat and counts the hurts by their stories. The instruments on her desk are spotless; the old notebook beside them is not.",
  options:[
   {label:"Accept ordinary treatment",description:"1 action; reduce Wounds by four.",cost:1,reduce:4,fee:0,outcome:"Your physician stitches the visible injuries and advises you to avoid heroic entrances for the next week."},
   {label:"Pay for the restorative moss draught",description:"1 action, 5 pennies; reduce Wounds by six.",cost:1,reduce:6,fee:5,outcome:"The moss draught tastes of rain that has never reached the city. You can stand again."},
   {label:"Rest and follow the nurse's instructions",description:"2 actions; reduce Wounds by five.",cost:2,reduce:5,fee:0,outcome:"The long rest is humbling and necessary. You leave with a bandage and a note of what must heal next."}
  ]},
 delirium:{
  place:"the_pale_rooms",menace:"delirium",title:"The Pale Rooms",
  arrival:"The ceiling here holds the memory of a sky. A nurse moves the clocks out of your sight and asks which of your names still feels like yours.",
  options:[
   {label:"Describe your dreams to the nurse",description:"1 action; reduce Delirium by four.",cost:1,reduce:4,fee:0,outcome:"You tell the nurse everything, including the part that sounded true. She names the fears without treating them as facts."},
   {label:"Purchase the quiet-room treatment",description:"1 action, 5 pennies; reduce Delirium by six.",cost:1,reduce:6,fee:5,outcome:"You sleep without the thirteenth bell for once. When you wake, the city is recognisably itself."},
   {label:"Practice the slow count of the lamps",description:"2 actions; reduce Delirium by five.",cost:2,reduce:5,fee:0,outcome:"A real lamp, a real breath, a real street. The city may be strange, but for now you know where you stand."}
  ]}
};
const expansion=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};
for(const [key,entry] of Object.entries(entries)){
 expansion.stories.push({
  id:"penalty-arrival-"+key,where:[entry.place],title:entry.title+": Arrival",
  description:entry.arrival,category:"penalty-arrival",autofire:true,
  choices:[{label:"Acknowledge your arrival",cost:0,success:entry.arrival,effects:{}}]});
 for(const [i,option] of entry.options.entries())
  expansion.stories.push({
   id:"penalty-recovery-"+key+"-"+i,where:[entry.place],category:"penalty-recovery",
   title:option.label,description:option.description,
   choices:[{label:option.label,cost:option.cost,need:option.fee?{coin:option.fee}:undefined,
     effects:{},success:option.outcome}]});
}
window.UndercityPenalties=entries;
})();