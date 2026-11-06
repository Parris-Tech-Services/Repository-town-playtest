/* Careers and destinies: player-facing choices for theUndercity, all original. */
(function(){
"use strict";
const e=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};
const first=[
["lamp-tender","Lamp Tender","resolve","wardens","court",9,"silver-flame","A shift keeping the public lanterns alight when the roof begins to move."],
["margin-clerk","Margin Clerk","observation","ledger","ink",8,"margin-pen","File a correct account of something the city prefers to forget."],
["harbour-runner","Harbour Runner","guile","hands","quays",10,"runner-boots","Carry an urgent parcel through customs without breaking an innocent person's trust."],
["street-poet","Street Poet","persuasion","choir","choir",8,"songbook","Give a crowd a song about the names no longer written in the municipal register."],
["furnace-minder","Furnace Minder","resolve","hands","soot",9,"ember-tool","Keep an exhausted crew safe during a shift the clocks insist has already ended."],
["glass-appraiser","Glass Appraiser","observation","ledger","market",9,"glass-rule","Determine which of two identical memories is a forgery."],
["whisper-broker","Whisper Broker","guile","ledger","market",11,"coded-card","Sell information without exposing the person who trusted you with it."],
["roof-patroller","Roof Patroller","resolve","wardens","soot",10,"roof-whistle","Patrol the high roofs where something enormous scratches at the false sky."],
["choir-gardener","Choir Gardener","persuasion","choir","choir",8,"singing-pot","Grow a light-bearing plant in a ward that cannot afford oil."],
["court-mediator","Court Mediator","persuasion","dawn","court",9,"civic-ribbon","Resolve a dispute between neighbours whose homes are missing from official plans."]
];
const advanced=[
["light-warden","Light Warden","resolve","wardens","court",22,"silver-oath","Lead a watch that must decide whether to guard the law or the people it has failed."],
["chief-archivist","Chief Archivist","observation","ledger","ink",21,"sealed-index","Protect the truth of an erased person against an order from above."],
["night-courier","Night Courier","guile","hands","quays",23,"shadow-route","Bring medicine through a street closed by the Council without endangering a household."],
["master-chorister","Master Chorister","persuasion","choir","choir",22,"harmonic-stone","Lead a forbidden concert that can restore a name to public memory."],
["furnace-surveyor","Furnace Surveyor","observation","hands","soot",21,"surveyor-lens","Expose the mechanism by which the city's fires consume more than fuel."],
["veil-diplomat","Veil Diplomat","persuasion","ledger","market",24,"silver-invitation","Negotiate a peaceful passage between factions that no longer speak."],
["cavern-sentinel","Cavern Sentinel","resolve","wardens","stairs",23,"sentinel-badge","Find a lost patrol beneath the Stairs before the thirteenth bell."],
["charter-keeper","Charter Keeper","guile","dawn","court",24,"new-charter","Make the Council honour a civic promise hidden from the public for decades."]
];
const professions=(data,tier)=>data.map(([id,name,stat,faction,place,wage,item,scene])=>({id,name,stat,faction,place,wage,tier,item,scene}));
e.professions=[...professions(first,1),...professions(advanced,2)];
Object.assign(e.items,Object.fromEntries(e.professions.map(p=>[p.item,p.name+"'s emblem"])));
for(const p of e.professions){
 e.stories.push({id:"profession-work-"+p.id,where:[p.place],title:"At work: "+p.name,description:p.scene,
  category:"profession",when:s=>s.profession===p.id,
  choices:[
   {label:"Perform the work carefully ("+p.stat+")",stat:p.stat,difficulty:p.tier===1?5:7,
    effects:{coin:p.tier===1?5:9,relation:{[p.faction]:1}},
    fail:p.stat==="resolve"?{health:-1}:{suspicion:1},
    success:"The work is done, though you know the city is not made safer by one shift. Your employer pays fairly for once.",
    failure:"The shift goes badly. Someone is helped, but you do not earn the extra payment or reputation this time."},
   {label:"Help a colleague with the most dangerous task",stat:"persuasion",difficulty:p.tier===1?5:7,
    effects:{coin:2,quirks:{generous:1},relation:{[p.faction]:1}},fail:{health:-1},
    success:"You share the work and learn the name of a person who has been trying to get by without being seen.",
    failure:"The colleague is grateful, but your help makes you both late. Neither forgets the effort."}
  ]});
}
const ordinary=[
["keeper-of-lanterns","Keeper of Lanterns","Your home will always have a light for a neighbour in need.","wardens"],
["river-witness","River Witness","You become a keeper of testimony that the Siltway cannot speak aloud.","hands"],
["friend-of-moss","Friend of Moss","The singing gardens will recognise your footsteps and open their gates.","choir"],
["margin-reader","Margin Reader","You are allowed to correct the smallest errors in the city's ledgers.","ledger"],
["unclaimed-courier","Unclaimed Courier","Letters without names will still find their way through your hands.","hands"],
["night-watch-guest","Guest of the Night Watch","The Wardens will share their fires with you on cold patrols.","wardens"],
["harbour-memory","The Harbour's Memory","Every boat that returns will carry a story you can remember.","dawn"],
["glass-hearted","The Glass-Hearted","You learn to recognise a counterfeit memory without hating its owner.","choir"],
["quiet-citizen","A Quiet Citizen","You build a small, defended peace, knowing what it does and does not cost.","dawn"]
];
const greater=[
["thirteenth-hour","Keeper of the Thirteenth Hour","You can hear when an erased hour begins, and bear witness to its passing.","ledger"],
["sunless-architect","Architect of the Sunless City","You help the city's districts design a safer light than the Council's furnace.","dawn"],
["moth-oath","Oath-Bearer of the Moths","No lamp may be denied to a household merely because its name is missing.","wardens"],
["true-shore","Witness of the True Shore","You preserve the river's promised coastline in law and in memory.","hands"],
["mirror-guardian","Guardian of First Memories","You defend the right of children to own their own remembered lives.","choir"],
["ash-honour","Honour of the Ash","The foundry workers choose you to keep the engine's cost visible.","hands"],
["unwritten-judge","Judge of the Unwritten","You weigh public truth against protection for those who cannot safely be named.","ledger"],
["singer-above","The Singer Above","You help every voice in the Moss Choir find its own verse.","choir"],
["night-ambassador","Ambassador to the Dark","You speak for the city at the very edge of things that refuse to be named.","dawn"],
["council-end","Breaker of the Council's Seal","You can call a public assembly when law is used to bury a person.","dawn"],
["last-light","The Last Light","You carry an independent lantern that burns when all official lamps fail.","wardens"]
];
e.destinies=[
 ...ordinary.map(([id,name,description,faction],i)=>({id,name,description,faction,tier:"ordinary",bonus:4,stat_bonus:{[["resolve","observation","persuasion","guile"][i%4]]:5}})),
 ...greater.map(([id,name,description,faction],i)=>({id,name,description,faction,tier:"greater",bonus:10,stat_bonus:{[["resolve","observation","persuasion","guile"][i%4]]:5,[["guile","resolve","observation","persuasion"][i%4]]:3}}))
];

/** Full specialist career progression. Promotion scenes, not buttons, admit Tier 3/4. */
const higher=[
 ["grand-light-warden","Grand Light Warden","light-warden","resolve","wardens","court",38,"crown-of-beacons","Coordinate the street lamps in a district abandoned by official inspectors."],
 ["keeper-of-black-archives","Keeper of the Black Archives","chief-archivist","observation","ledger","ink",37,"archive-coat","Restore an erased census without giving Council officers an address book of witnesses."],
 ["dispatchmaster","Dispatchmaster of the Silent Roads","night-courier","guile","hands","quays",39,"sealed-dispatch","Protect courier routes when the city begins to watch its own shadows."],
 ["high-chorister","High Chorister","master-chorister","persuasion","choir","choir",38,"chorister-adornment","Lead a performance that turns a disputed memory into a public song."],
 ["engine-provost","Engine Provost","furnace-surveyor","observation","hands","soot",37,"furnace-license","Prove which machines can safely replace the furnace of stolen names."],
 ["treaty-bearer","Treaty Bearer","veil-diplomat","persuasion","ledger","market",39,"diplomatic-luggage","Carry a treaty through a crowd whose interests are not aligned."],
 ["watch-commandant","Watch Commandant","cavern-sentinel","resolve","wardens","stairs",38,"commandant-boon","Guard the last lit stair without abandoning those already beyond it."],
 ["keeper-of-the-charter","Keeper of the Charter","charter-keeper","guile","dawn","court",40,"charter-club","Defend the city's oldest rights against an official rewriting of the law."],
 ["city-luminary","City Luminary","grand-light-warden","resolve","wardens","court",66,"perpetual-lamp","Make the city's public light independent of any single monarch."],
 ["first-witness","First Witness","keeper-of-black-archives","observation","ledger","ink",64,"witness-treasure","Ensure that no living family is erased by a clerk's careless pen."],
 ["master-of-crossings","Master of Crossings","dispatchmaster","guile","hands","quays",68,"river-ship","Guarantee a passage for the last ferry of every night."],
 ["voice-of-the-choir","Voice of the Choir","high-chorister","persuasion","choir","choir",65,"choir-companion","Give every forgotten citizen the right to answer the city's song."],
 ["warden-of-the-engine","Warden of the Engine","engine-provost","observation","hands","soot",67,"engine-airship","Turn the dangerous engine into a museum whose flaws can be inspected."],
 ["envoy-of-the-twelve","Envoy of the Twelve","treaty-bearer","persuasion","ledger","market",67,"envoy-hat","Secure peace without purchasing it with a stranger's silence."],
 ["shield-of-the-edge","Shield of the Edge","watch-commandant","resolve","wardens","edge",69,"edge-crew","Protect travellers without keeping them ignorant of the abyss."],
 ["architect-of-consent","Architect of Consent","keeper-of-the-charter","guile","dawn","court",70,"civic-home","Draft a charter that ordinary people can amend without fear."]
];
for(const [id,name,requires,stat,faction,place,wage,item,scene] of higher){
 const tier=higher.findIndex(row=>row[0]===id)<8?3:4;
 const career={id,name,requires,stat,faction,place,wage,item,scene,tier,renown:tier===3?6:7};
 e.professions.push(career);
 e.items[item]=name+"'s sign of office";
 e.stories.push({id:"profession-promotion-"+id,where:[place],category:"profession-promotion",
  title:"A promotion offered: "+name,
  description:"Your employer has watched your work and the people you chose to protect. "+scene+" To be promoted, you must have the required Making Your Name reputation and the previous professional office.",
  once:true,when:s=>s.profession===requires&&(s.renown?.[stat]||0)>=career.renown,
  choices:[
   {label:"Accept the responsibilities of "+name,stat,difficulty:tier===3?7:8,
    effects:{profession:id,relation:{[faction]:2},coin:5},fail:{suspicion:1},
    success:"You receive the new title and its equipment. Your wage rises with your responsibilities. "+scene,
    failure:"The board requires more proof of your readiness. You keep your current office and may petition again."},
   {label:"Demand a public charter of duties",stat:"persuasion",difficulty:tier===3?7:8,
    effects:{profession:id,relation:{[faction]:3},coin:2},fail:{notoriety:1},
    success:"Your terms become part of the official register. The promotion is yours, with witnesses who can hold you accountable.",
    failure:"The board will not accept the terms yet. You can return with additional testimony."}
  ]});
 e.stories.push({id:"profession-work-"+id,where:[place],category:"profession",
  title:"A specialist shift: "+name,description:scene,
  when:s=>s.profession===id,
  choices:[
   {label:"Fulfil your office with care ("+stat+")",stat,difficulty:tier===3?7:8,
    effects:{coin:tier===3?14:22,relation:{[faction]:1}},fail:{health:-1},
    success:"Your specialist work is recognised in the city's public records, and the office pays you for the shift.",
    failure:"A mistake under scrutiny costs your office dearly. Your regular position remains, but the shift yields no additional pay."},
   {label:"Protect a junior colleague from the Council's pressure",stat:"persuasion",difficulty:tier===3?7:8,
    effects:{coin:tier===3?10:16,quirks:{generous:1}},fail:{notoriety:1},
    success:"The colleague keeps their name and their wage. Your office is respected for choosing to protect its people.",
    failure:"You could not shelter them this time. The experience makes the next choice more urgent."}
  ]});
}

})();