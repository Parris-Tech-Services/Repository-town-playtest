/* Original location stories, opportunity cards, quirks, seasonal encounters
   and three multi-stage exceptional stories for The Undercity. */
(function(){
"use strict";
const e=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};

/** Version 1 narrative quality taxonomy. The category tells the rules layer
 * whether CP is pyramidal or whether levels are additive/flag-like.
 * Internal aliases retain compatibility with existing saves and rule functions. */
e.qualityTypes=Object.freeze({
 primary_stat:{id:"primary_stat",pyramidal:true,label:"Primary ability"},
 menace:{id:"menace",pyramidal:true,label:"Menace"},
 quirk:{id:"disposition",pyramidal:true,label:"Quirk / disposition"},
 affiliation:{id:"affiliation",pyramidal:true,label:"Affiliation / reputation"},
 status:{id:"status",pyramidal:false,label:"Status"},
 circumstance:{id:"circumstance",pyramidal:false,label:"Circumstance"},
 accomplishment:{id:"accomplishment",pyramidal:false,label:"Accomplishment"},
 route:{id:"route",pyramidal:false,label:"Route"},
 living_story:{id:"living_story",pyramidal:false,label:"Living Story"},
 dream:{id:"dream",pyramidal:true,label:"Dream"},
 metaquality:{id:"metaquality",pyramidal:false,label:"Metaquality"},
 item:{id:"item",pyramidal:false,label:"Item / possession"},
 story:{id:"story",pyramidal:false,label:"Story progress"},
 fate_marker:{id:"fate_marker",pyramidal:false,label:"Once-only marker"}
});
e.qualityDefs={
 "status:resident":{type:"status",max:1,description:"Registered Undercity resident"},
 "status:lampkeeper":{type:"status",max:1,description:"Recognised guardian of a civic lamp"},
 "circumstance:under-surveillance":{type:"circumstance",max:5,description:"Attention from the Council"},
 "circumstance:protecting-witness":{type:"circumstance",max:1,description:"Currently shielding a named witness"},
 "accomplishment:found-royal-seal":{type:"accomplishment",max:1,description:"Recovered evidence of the King's oath"},
 "accomplishment:moth-ledger":{type:"accomplishment",max:1,description:"Verified the abandoned households"},
 "route:forgotten-stairs":{type:"route",max:1,description:"The lower foundations route"},
 "route:listening-edge":{type:"route",max:1,description:"The last light before the cavern"},
 "living_story:clockmaker-post":{type:"living_story",max:1,description:"The clockmaker's delayed letter"},
 "living_story:moth-warning":{type:"living_story",max:1,description:"A warning about the royal debt"},
 "dream:unsealed-sky":{type:"dream",max:20,description:"A dream of daylight above the stone roof"},
 "dream:thirteenth-bell":{type:"dream",max:20,description:"A night-voice counting absent hours"},
 "meta:criminal-record":{type:"metaquality",max:7,description:"Permanent record of arrests"},
 "meta:historical-truth":{type:"metaquality",max:1,description:"World ending marker"},
 "story:moth-oath":{type:"story",max:32,description:"Progress in the personal Moth King ambition"},
 "fate:city-remembers":{type:"fate_marker",max:1,description:"Irreversible city-wide ending"}
};

Object.assign(e.items,{
"spore-script":"A living script grown on moss","clock-key":"A key cut from a minute",
"stolen-name":"A name wrapped in clean paper","wardens-whistle":"An Ash Warden's silver whistle",
"river-writ":"An affidavit signed by the river","furnace-tally":"The tally of an impossible shift",
"choir-petal":"A petal that remembers its singer","roof-chalk":"Chalk dust from the cavern roof",
"hidden-compass":"A compass that points to promises",
"oracle-thread":"A thread from a speaking tapestry",
"winter-lamp":"A lamp lit for those still missing",
"official-seal":"A seal with no Council emblem",
"copper-gear":"A small, beautiful gear"
});
const quirkScenes=[
["merciful","Merciful","court","The petitioner and the thief","A young thief has stolen medicine for a feverish parent. The injured apothecary wants the Council to hear the whole truth.","Pay the apothecary for the medicine","Offer to bring the thief to judgement","coin",3],
["ruthless","Ruthless","soot","A furnace with one free seat","A foreman offers you the only warm seat while the night shift works beside an open furnace.","Give your place to an injured worker","Take the seat and negotiate a private wage","health",1],
["honest","Honest","ink","A mistake in the records","The librarian finds a useful error: an inheritance now names you as heir. The real family lives at the river.","Correct the entry publicly","Keep the inheritance but leave an anonymous warning","coin",4],
["subtle","Subtle","market","The sealed display case","A broker displays the names of informants, each written on a glass plate. One informant is an unknowing child.","Remove the child's plate quietly","Confront the broker before witnesses","suspicion",-1],
["curious","Curious","stairs","The note inside the wall","Someone has hidden a message between two blocks of the Stairs. It is addressed to whoever finds it.","Open it and read what the Council feared","Leave it sealed and report the location","clues",1],
["steadfast","Steadfast","quays","The vigil at low water","A boat has not returned, and a dockworker will keep watch until someone shares the night.","Stay until dawn beside the family","Take the paid shift at a safer pier","coin",3],
["generous","Generous","choir","Seedlings for strangers","An apprentice has grown seven singing seedlings, but cannot afford to plant them in the poorer wards.","Buy soil for the distant wards","Help sell the seedlings to patrons","coin",3],
["proud","Proud","court","An honour offered with strings","The Council offers you a public title provided you thank it for allowing you to survive the descent.","Decline the empty honour","Accept and speak your own truth","notoriety",1],
["cautious","Cautious","edge","The rope across the dark","An explorer asks you to anchor their line above a drop whose depth cannot be measured.","Test each knot and refuse a hurried start","Trust the old rope to save time","health",1]
];
e.quirks=quirkScenes.map(q=>({id:q[0],name:q[1]}));
for(const [key,name,place,title,description,kind,other,benefit,amount] of quirkScenes){
 e.stories.push({id:"quirk-"+key,where:[place],title,description,once:true,category:"quirk",
 choices:[
  {label:kind,desc:"Act according to "+name.toLowerCase()+".",effects:{quirks:{[key]:1},coin:2},
   success:"Your action costs you something small, and earns a reputation that will outlast this encounter. The story of your choice travels beyond this street."},
  {label:other,effects:{coin:amount>0?amount:1,[benefit]:amount},success:"You choose a different good, or a different risk. A witness notes what mattered to you, and the city carries on."}
 ]});
}
const exceptional=[
 {id:"lantern-wedding",name:"The Wedding of Thirteen Lamps",places:["court","market","choir"],stages:[
 ["An invitation that does not name the couple","A courier brings an invitation for a wedding at Lantern Court. Thirteen empty chairs have been reserved for relatives the city insists never existed.","Read the names scratched on the backs of the chairs","Ask the bride why the guests are missing"],
 ["A dowry of broken hours","At the Glass Arcade, the groom's family offers a clock that can restore one missing hour. It will also erase the memory of the ceremony.","Verify what the clock can actually do","Persuade the families to use a different gift"],
 ["The vow no clerk may witness","Beneath the Choir's moss canopy, the couple must decide whether to marry under their erased family names or accept the Council's invented ones.","Stand as a public witness","Keep the vows in the family's private book"]
 ]},
 {id:"water-audit",name:"The Audit of the Unending Rain",places:["quays","ink","soot"],stages:[
 ["A tax on rain that never falls","Harbour merchants have been charged a rain levy for forty years. Every receipt is signed by the same dead collector.","Trace the collector's signature","Interview the oldest bargeman"],
 ["An accountant in the margins","In the Inkward, a calculation changes whenever someone says the word 'surface'. The figures add up to the cost of one missing century.","Balance the altered accounts","Ask the librarian who receives the tax"],
 ["The furnace that eats receipts","At the Sootworks, a hidden furnace burns every unpaid levy. A worker wants the accounts made public before the fire spreads.","Save the ledger from the flames","Help the workers publish the debt"]
 ]},
 {id:"starless-concert",name:"A Concert Without Stars",places:["choir","stairs","edge"],stages:[
 ["A melody beneath the moss","An elderly singer hears an answering note above the cavern roof. Her final concert may be the only chance to hear who is singing back.","Record the first answering note","Invite the frightened singers to rehearse"],
 ["The acoustics of the Forgotten Stairs","A stair between two floors rings as though the stone were hollow. Each note sounds like the name of someone missing.","Listen for the absent voice","Measure the stones with a tuning fork"],
 ["The audience beyond the light","At the Listening Edge, the choir's last note hangs above the abyss. The singers ask whether to finish the concert or let the silence remain unbroken.","Sing the last note with them","Preserve the melody without calling into the dark"]
 ]}
];
e.exceptionalStories=exceptional.map(x=>({id:x.id,name:x.name,stages:3}));
for(const x of exceptional){
 x.stages.forEach(([title,description,a,b],i)=>{
   e.stories.push({id:"exception-"+x.id+"-"+i,where:[x.places[i]],once:true,category:"exceptional",
    title:x.name+" — "+(i+1)+"/3: "+title,description,
    when:s=>(s.extras?.[x.id]||0)===i,
    choices:[
      {label:a,stat:["observation","guile","resolve"][i],difficulty:4+i,effects:{extras:{[x.id]:1},coin:i===2?12:3,items:i===2?{"official-seal":1}:{}},fail:{sanity:-1},
       success:"You carry the evidence into the next part of the story. "+description,
       failure:"You are heard, but you have not yet secured what you came for. There is still time to try again."},
      {label:b,stat:"persuasion",difficulty:4+i,effects:{extras:{[x.id]:1},coin:i===2?8:2,relation:{choir:1}},fail:{notoriety:1},
       success:"The people involved agree to remember what happened. The next lead can now be followed.",
       failure:"The witness hesitates. The city is not yet prepared to believe the account."}
    ]});
 });
}
const seasonals=[
 {id:"mosswake",months:[0,1],place:"choir",name:"The Mosswake",text:"The Choir begins the year by planting light for those who have not returned from the dark.",a:"Plant a lantern for the missing",b:"Record each name in the gardeners' ledger"},
 {id:"bellfast",months:[2,3],place:"court",name:"The Bellfast",text:"For two months the market avoids ringing bells. Children collect their silences in little jars.",a:"Keep the silence with the families",b:"Study which bells have gone missing"},
 {id:"floodcall",months:[4,5],place:"quays",name:"The Floodcall",text:"The Siltway rises without rain. Each barge carries flowers for a shoreline that may not exist.",a:"Help secure the barges",b:"Question the river's strange tide"},
 {id:"ashvigil",months:[6,7],place:"soot",name:"The Ash Vigil",text:"The foundries dim their fires in memory of workers erased from the wage book.",a:"Join the workers' vigil",b:"Copy their testimony"},
 {id:"thirteenth-feast",months:[8,9],place:"market",name:"The Feast of the Thirteenth Hour",text:"An extra place is laid at every stall. Nobody may ask who the empty chair is for.",a:"Offer a meal to the absent guest",b:"Find out who started the custom"},
 {id:"long-lamplight",months:[10,11],place:"court",name:"The Long Lamplight",text:"Every surviving lantern is lit at once. For one evening, shadows can be recognised by their owners.",a:"Keep a light for a neighbour",b:"Examine the oldest lit lamp"}
];
e.seasonalEvents=seasonals.map(({id,name,months})=>({id,name,months}));
const year=new Date().getFullYear();
for(const x of seasonals){
 e.stories.push({id:"season-"+x.id,where:[x.place],title:x.name,description:x.text,category:"seasonal",
  when:s=>x.months.includes(new Date().getMonth())&&!s.flags["season-"+x.id+"-"+new Date().getFullYear()],
  choices:[
   {label:x.a,effects:{flag:"season-"+x.id+"-"+year,coin:5,quirks:{generous:1}},success:"The celebration changes a small part of your neighbourhood. Next year, somebody will tell the story of your kindness."},
   {label:x.b,stat:"observation",difficulty:5,effects:{flag:"season-"+x.id+"-"+year,clues:1,coin:3},fail:{sanity:-1},success:"Your notes preserve a truth that might otherwise vanish between seasons.",failure:"The crowd closes around the evidence. The custom remains a mystery for now."}
  ]});
}
const encounters=[
 ["court","The council's broken promise","A public notice promises fresh air for every family, though nobody can remember feeling the wind.","Read the Council's arithmetic","Interview the cleaner who hung the notice","observation"],
 ["court","The keeper of the empty bench","A woman keeps a bench empty for someone who has been missing twenty-three years.","Sit with her until the lamps dim","Ask about the name carved underneath","persuasion"],
 ["ink","The library's second shadow","At sunset a bookcase casts two shadows, although the Archive has only one lamp.","Trace the second shadow","Ask whether anyone else has seen it","observation"],
 ["ink","A receipt for one vanished hour","The date on a merchant's invoice falls between midnight and midnight.","Examine the ink and paper","Check the vendor's account","guile"],
 ["quays","The silent swimmer","A swimmer surfaces from the Siltway clutching an oar made from petrified moss.","Help the swimmer ashore","Question where the oar came from","resolve"],
 ["quays","The river's locked box","A box drifts upriver every week, always bearing a new lock.","Open it beneath the quay","Ask the ferryman to identify the seal","guile"],
 ["soot","A machine that knows your birthday","One furnace stops whenever you tell it your age.","Test its mechanism","Speak with the exhausted engineer","observation"],
 ["soot","The apprentices' third shift","A young worker has completed three shifts today, though the clocks say it is still morning.","Make the foreman change the roster","Find the clock that keeps repeating","persuasion"],
 ["choir","A seed that sings backwards","A gardener has nurtured a seed that sings the first word of a song last.","Plant it where the public may hear","Ask it to remember a missing verse","resolve"],
 ["choir","The botanist's apology","An experimental flower has learned to apologise for something it has not done.","Listen to its confession","Trace the seeds to their supplier","persuasion"],
 ["market","The shop of deliberate mistakes","An engraver sells errors for customers who cannot bear to be perfect.","Commission a harmless mistake","Read the corrections in the shop register","guile"],
 ["market","The invisible customer","An empty chair pays for tea every day. The shopkeeper refuses to move it.","Pay for another cup","Watch who clears the dishes","observation"],
 ["stairs","The stair's last witness","A handrail bears scorch marks from a lamp no one brought here.","Measure the marks","Ask the stonekeeper who was lost","resolve"],
 ["edge","A voice that says 'not yet'","Beyond the last rail, a patient voice tells strangers not to jump. No one knows whether it belongs to the city.","Wait with the voice","Record the words before they fade","persuasion"]
];
for(const [place,title,description,a,b,stat] of encounters){
 const id="district-"+place+"-"+e.stories.filter(s=>s.id.startsWith("district-"+place)).length;
 e.stories.push({id,where:[place],title,description,category:"encounter",
 choices:[
 {label:a,stat,difficulty:5,effects:{coin:5,clues:1},fail:{sanity:-1},success:"Your decision exposes a small, overlooked piece of the city's past. You make a note of it before someone can order it forgotten.",failure:"You find a trace of evidence, but not enough to prove your theory. You can try again."},
 {label:b,stat:"persuasion",difficulty:5,effects:{coin:3,relation:{ledger:1}},fail:{notoriety:1},success:"Your questions uncover the human cost of a tidy official story. The witness asks only that you use the answer carefully.",failure:"The witness withdraws. Your manner or timing did not earn their confidence."}
 ]});
}
const cardDefs=[
 ["A moth in a paper crown","An unusually polite moth demands tribute from your lamp.","Offer a penny to the tiny court","Study the letters on its wings","resolve"],
 ["A letter addressed to the city","The courier asks you to deliver a letter to the pavement itself.","Set the letter under a stone","Ask who wrote it","observation"],
 ["The market's lost receipt","A receipt lists the sale of a peaceful evening and names you as buyer.","Keep the evening for yourself","Return it to the buyer","guile"],
 ["A song heard from a drain","A beautiful tenor rises from a place where there should be only runoff.","Harmonise with the stranger","Trace the song's underground course","persuasion"],
 ["The shadow seller","A vendor offers a spare shadow that fits you almost perfectly.","Try the shadow on","Ask how it was removed","guile"],
 ["The gardener's sealed seed","A gardener offers you a seed that remembers sunlight, provided you promise to water it.","Accept the responsibility","Examine its little brass roots","resolve"],
 ["A warning written in chalk","The word TOMORROW is written in chalk across last night's newspaper.","Copy the warning","Follow its author","observation"],
 ["A creature made of lost buttons","A small figure collects buttons from the clothes of people who are officially absent.","Give it a spare penny","Ask about the missing people","persuasion"],
 ["A silent mechanical lark","A clockwork bird opens its beak when you mention the Council.","Repair its broken spring","Listen for its hidden note","observation"],
 ["The thirteenth candle","You find a lit candle where the clock insists there is no hour left.","Keep it from the wind","Ask who placed it there","resolve"]
];
for(const [title,desc,a,b,stat] of cardDefs){
 const id="card-expanded-"+e.cards.length;
 e.cards.push({id,title,desc,weight:2,choices:[
 {label:a,effects:{coin:3,sanity:1},success:"You leave with something tangible and a small reminder that wonder can be ordinary in this city."},
 {label:b,stat,difficulty:6,effects:{clues:1,coin:2},fail:{suspicion:1},success:"The answer is stranger than the question. You preserve one useful detail in your journal.",failure:"A nearby official takes notice, and the trail goes cold."}
 ]});
}
})();