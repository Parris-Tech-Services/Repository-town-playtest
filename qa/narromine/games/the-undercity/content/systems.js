/* Supporting systems for The Undercity: no external dependencies. */
(function(){
"use strict";
// All twenty categories explicitly named in the design specification.
const slots=["boon","hat","clothing","adornment","gloves","weapon","boots","luggage","companion","treasure","destiny","tools of the trade","affiliation","transport","home comfort","ship","crew","airship","spouse","club"];
const gear={
charcoal:["tools of the trade","observation",1],hook:["weapon","guile",1],silk:["gloves","persuasion",1],
badge:["affiliation","resolve",1],lure:["companion","observation",1],map:["luggage","observation",1],
"moth-lance":["weapon","resolve",4],"quiet-bell":["tools of the trade","observation",3],
"mirror-key":["treasure","guile",3],"ember-crown":["hat","persuasion",3],
"reader-lens":["hat","observation",4],"runner-token":["transport","guile",4],
"warden-scar":["clothing","resolve",4],"speaker-song":["affiliation","persuasion",4],
"silver-flame":["tools of the trade","resolve",1],"margin-pen":["tools of the trade","observation",1],
"runner-boots":["boots","guile",1],"songbook":["treasure","persuasion",1],
"roof-whistle":["tools of the trade","resolve",1],"surveyor-lens":["hat","observation",2],
"new-charter":["treasure","persuasion",2]
};
const living=[
 {id:"clockmaker-post",trigger_quality:"ambition >= 1",delay_hours:1,storylet_id:"ambition2",delay:3600000,title:"A note from the clockmaker",
 text:"Eda found a fingerprint inside the handless clock that belongs to nobody on the city register. She encloses three pennies for your investigation.",
 trigger:s=>s.ambition>=1,effects:{coin:3,clues:1}},
 {id:"personal-warning",trigger_quality:"pathProgress >= 2",delay_hours:4,storylet_id:"court_market",delay:14400000,title:"A warning for your private undertaking",
 text:"A stranger has written down the cause you chose. The signature is missing, but the warning is clear: the Council is listening.",
 trigger:s=>s.pathProgress>=2,effects:{coin:4}},
 {id:"choir-reply",trigger_quality:"choir renown >= 2 or relation >= 4",delay_hours:24,storylet_id:"quirk-generous",delay:86400000,title:"The Choir remembers",
 text:"The Moss Choir has composed a verse for somebody you helped. They invite you back to hear it among the flowers.",
 trigger:s=>(s.renown?.persuasion||0)>=2||(s.relation?.choir||0)>=4,effects:{relation:{choir:1},sanity:1}},
 {id:"watch-response",trigger_quality:"clues >= 4",delay_hours:168,storylet_id:"stairs_echowell",delay:604800000,title:"A letter from the Ash Wardens",
 text:"A place has been prepared beside the Wardens' watch fires. The sealed letter is an invitation rather than a summons.",
 trigger:s=>s.clues>=4,effects:{relation:{wardens:2},coin:5}}
];

const shopCatalog=[
 ["lamp-oath","boon","resolve",1,12,"The Lamp-Lighter's Oath"],
 ["felt-hat","hat","observation",1,10,"Hat of the Patient Surveyor"],
 ["moss-coat","clothing","resolve",1,14,"Stitched Moss Coat"],
 ["promise-pendant","adornment","persuasion",2,18,"Pendant of an Honest Promise"],
 ["archivist-gloves","gloves","observation",1,9,"Reader's Soft Gloves"],
 ["watch-stick","weapon","resolve",2,15,"The Watchman's Walking Stick"],
 ["river-boots","boots","guile",1,11,"Riverproof Boots"],
 ["courier-trunk","luggage","guile",2,20,"Locked Courier's Trunk"],
 ["friendly-moth","companion","persuasion",1,12,"Paper Moth Companion"],
 ["moon-moss-bottle","treasure","observation",2,25,"A Bottle of Patient Moon-Moss"],
 ["sealed-future","destiny","resolve",1,24,"Sealed Promise of Tomorrow"],
 ["trade-calipers","tools of the trade","observation",2,22,"Surveyor's Brass Calipers"],
 ["civic-lapel","affiliation","persuasion",2,18,"Public Witness Lapel Pin"],
 ["river-pass","transport","guile",2,21,"Free Passage River Ticket"],
 ["warm-window","home comfort","resolve",1,16,"A Little Warm Window"],
 ["lantern-skiff","ship","guile",2,35,"The Lamplighter's Skiff"],
 ["volunteer-crew","crew","persuasion",2,32,"The Names of Your Volunteer Crew"],
 ["clockwork-airship","airship","observation",3,45,"A Tiny Clockwork Airship"],
 ["mutual-promise","spouse","persuasion",1,20,"A Mutual Promise, Freely Given"],
 ["garden-club-token","club","persuasion",2,23,"The Moss Garden's Membership Token"]
].map(([id,slot,stat,bonus,price,name])=>({id,slot,stat,bonus,price,name,sell:Math.max(1,Math.floor(price/2))}));
const expansion=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};
for(const item of shopCatalog){
 expansion.items[item.id]=item.name;
 gear[item.id]=[item.slot,item.stat,item.bonus];
}
const higherGear=[
 ["crown-of-beacons","hat","resolve",3],["archive-coat","clothing","observation",3],
 ["sealed-dispatch","luggage","guile",3],["chorister-adornment","adornment","persuasion",3],
 ["furnace-license","tools of the trade","observation",3],["diplomatic-luggage","luggage","persuasion",3],
 ["commandant-boon","boon","resolve",3],["charter-club","club","guile",3],
 ["perpetual-lamp","treasure","resolve",4],["witness-treasure","treasure","observation",4],
 ["river-ship","ship","guile",4],["choir-companion","companion","persuasion",4],
 ["engine-airship","airship","observation",4],["envoy-hat","hat","persuasion",4],
 ["edge-crew","crew","resolve",4],["civic-home","home comfort","guile",4]
];
for(const [id,slot,stat,bonus] of higherGear)gear[id]=[slot,stat,bonus];
for(const entry of Object.values(gear)){
 const old=entry[0];entry[0]=({"tool":"tools of the trade","route":"luggage","possession":"adornment","burden":"luggage","menace":"boon"})[old]||old;
}
window.UndercitySystems={slots,gear,living,shopCatalog};
})();