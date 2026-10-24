/* The Undercity: original personal ambitions and four Making Your Name arcs.
   Loaded as ordinary script before the self-contained game. */
(function(){
"use strict";
const e=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};
Object.assign(e.items,{
"moth-sigil":"A moth scale inscribed with a royal debt",
"moth-lance":"The Lantern Lance",
"salt-testament":"Testament of the drowned",
"quiet-bell":"The Quiet Bell",
"glass-duplicate":"A counterfeit childhood in glass",
"mirror-key":"Key to the second reflection",
"ember-contract":"A contract written in warm ash",
"ember-crown":"The Ash Crown",
"reader-lens":"Lens of Thirteen Margins",
"runner-token":"Token of the Unseen Roads",
"warden-scar":"The Defender's Honour Scar",
"speaker-song":"The Unwritten Anthem"
});
const paths=[
 {id:"moth",name:"The Debt of the Moth King",description:"Track the thing which steals lamps from the Ash Wardens. Find out who made it sovereign and who pays for its hunger.",stat:"resolve",other:"observation",reward:"moth-lance",places:["court","soot","quays","ink","market","choir","stairs","edge"],
 steps:[
 ["A crown of scorched wings","Old Eda produces a bounty proclamation: every lamp lost on the northern roofs bears a moth-shaped bite. She has circled an unfamiliar royal seal.","Accept Eda's warrant and inspect the seal","Ask which roof was struck first","Eda says the Moth King is not a beast but a title inherited whenever a city forgets to keep its promises."],
 ["The foundry's third furnace","Three furnaces burn coal. A fourth runs on captured lamplight. Its foreman swears nobody gave the order to start it.","Enter the cold inspection shaft","Interview the exhausted stokers","The workers describe a monarch made of abandoned oaths. Each night the furnace pays it in stolen light."],
 ["A barge loaded with dark","The harbour master has signed for twenty crates of darkness. A child's chalk drawing identifies the cargo as the wings of something immense.","Break the customs seal","Trace the delivery stamps","The crates contain fragments of the King's old shell and a shipping receipt signed by the Council."],
 ["The oldest mention","The first recorded moth attack occurred before the Undercity was founded. The account is hidden in a book whose pages have been cut into narrow strips.","Reassemble the forbidden account","Persuade the archivist to read the missing sentence","The Council promised the King a place under the false sky, then failed to build one."],
 ["The shop of discarded vows","A woman sells promises their owners would rather forget. The Moth King's first oath lies inside a velvet case, still warm.","Buy the oath's true wording for three pennies","Trade a truthful confession for the oath","The promise is painfully simple: nobody beneath the stone roof will be left in darkness alone."],
 ["A garden of luminous eggs","Among the Moss Choir's flowering lamps lie seven eggs. Their caretaker says each is a street the King was promised but never given.","Guard the eggs from the Council's collectors","Translate the nursery's whispered lullaby","The eggs will hatch into lights if someone takes responsibility for them. The monster's hunger may be grief."],
 ["The staircase of discarded crowns","At a landing carved from black stone, the King waits in a skin of ash and silver. The bounty notice curls in your pocket.","Face the King's watchers","Study the oath carved on its crown","It offers you its last possession: the names of households the Council abandoned."],
 ["A sovereign without a throne","The Moth King kneels above the Listening Edge and offers you the names of the families whose lamps were stolen. The Wardens expect you to kill it today. Yet no bargain is possible until the witnesses are safe and the records restored.","Demand the names of the abandoned households","Ask the King to postpone judgement until the witnesses can speak","The King gives you a list of people the Council erased. Its hunger is not yet ended; first you must establish what the living are owed."]
 ]},
 {id:"tide",name:"The River's Unfinished Testament",description:"Find the author of a will written by the river itself, and decide who inherits the city's stolen shores.",stat:"observation",other:"persuasion",reward:"quiet-bell",places:["court","quays","ink","market","soot","choir","stairs","edge"],
 steps:[
 ["The drowned solicitor","A lawyer arrives dripping water that refuses to touch the floor. Their client is the Siltway, which has drafted its own will.","Examine the watermarked signature","Ask the solicitor who is being disinherited","The will names a place that has never appeared on a city map: the shore beyond the stones."],
 ["A ferry without an oarsman","An abandoned ferry returns from the dark with a passenger's hat and a legal seal made of river mud.","Search the vessel for testimony","Interview the quay's oldest ferryman","The passengers were Council surveyors sent to prove that the far bank did not exist."],
 ["The filed impossibility","An Archive clerk reveals a case marked 'An estate without land'. Every page is legally valid and geographically impossible.","Restore a torn boundary map","Persuade the clerk to open the sealed appeal","The river was promised a second bank in exchange for carrying the city's refuse."],
 ["Auction of absent land","The Glass Arcade auctions a deed to a shoreline no purchaser may visit. The bids are paid in hours of remembered sunlight.","Inspect the deed's false boundary","Ask a bidder why it matters","You learn the buyers intend to fence the river into a canal and silence its testimony."],
 ["The flood tax","At the Sootworks, workers pay a levy for river water they never receive. The records list payments to a 'shoreline restoration fund'.","Audit the payroll","Speak privately with a foreman","The Council has spent the restoration fund to maintain the false sky."],
 ["The songs of a dry sea","The Choir has a song for a coastline none of its singers have seen. One verse gives directions to a staircase underneath the riverbed.","Transcribe the lost verse","Sing with the oldest gardener","The song is the river's memory of what it was before the city sealed the cavern."],
 ["A stair under the current","You descend beneath a stone bridge to where the water stops in mid-air. The river invites you to hear its final witness.","Collect the witness's evidence","Ask the witness what justice looks like","The river wants a place to end, not endless revenge on the city that diverted it."],
 ["The will's last beneficiary","At the Listening Edge the Siltway names you executor. You may return its forgotten shore or leave the city dry and safe.","Restore the river's right to its shore","Preserve the city and establish a public water trust","Your ruling is entered into the river's own ledger, where no clerk can alter it."]
 ]},
 {id:"mirror",name:"The Child Behind the Glass",description:"Recover the stolen childhoods sold beneath the Glass Arcade, knowing one of them may be your own.",stat:"guile",other:"persuasion",reward:"mirror-key",places:["court","market","choir","ink","quays","soot","stairs","edge"],
 steps:[
 ["The wrong photograph","A street photographer hands you a picture of a child holding your hand. Neither of you exists in the register for that year.","Pocket the image before the photographer notices","Ask how they obtained the impossible negative","The child is trapped in an inventory of memories sold to finance the Council's silence."],
 ["Glass that remembers","A mirror seller stocks reflections with price tags pinned to the reverse. A young voice is reciting your name from inside one.","Swap the labelled mirrors unnoticed","Persuade the dealer to tell you who supplied them","Each mirror contains part of someone's childhood; the supplier signs receipts in erased ink."],
 ["The nursery of borrowed voices","In the Choir gardens, children play with songs that belong to strangers. One child hums the lullaby from your impossible photograph.","Follow the melody through the glasshouse","Ask the gardener whose voice it was","A gardener remembers the missing child. Nobody agrees on the child's name."],
 ["An index of first memories","The Archive keeps every person's earliest memory in a ledger, except for one column deliberately left blank.","Lift the sealed index without breaking it","Convince an archivist to compare two records","Your own entry and the child's were both revised by the same Council officer."],
 ["Cargo marked fragile","A customs officer confiscated a box of mirrors and hid it aboard a ferry that has not sailed in years.","Recover the manifest","Talk the officer into opening the hold","The box holds your missing recollection of a voice saying, 'You were there when the bells stopped.'"],
 ["The furnace of lost faces","The Council burns unclaimed childhoods for heat. Workers swear the flames occasionally weep.","Stop the next consignment","Interview the furnace keeper","The stolen memories keep the city's roof intact by allowing it to forget how much danger lies beyond."],
 ["The twelfth reflection","On a Forgotten Stair you meet a child who looks into mirrors and sees adults who have forgotten them.","Help the child assemble the glass pieces","Ask the child what they most want remembered","The child asks not for revenge but to be able to grow old in the same name."],
 ["A face you must choose","At the Edge, every recovered memory presses against the glass. Returning them may awaken a dangerous truth; keeping them sealed preserves the false childhoods.","Break the mirrors and restore the memories","Make a safe record and free the child first","The child steps out with a name of their own. Your memory of this choice will not be altered."]
 ]},
 {id:"ember",name:"The Last Fire of the Council",description:"Infiltrate the furnace that holds up the false sky and choose whether power should be broken or shared.",stat:"persuasion",other:"guile",reward:"ember-crown",places:["court","soot","market","ink","choir","quays","stairs","edge"],
 steps:[
 ["An invitation written in ash","A Council messenger asks you to attend a hearing about furnace failures. The letter burns cold in your hand.","Accept the invitation under an assumed name","Confront the messenger in public","Somebody has made a fire that powers the sky and a law that forbids questioning it."],
 ["The wages of warmth","Sootworks children are paid to gather scraps from a furnace that burns without fuel. A foreman has an unsigned order to increase production.","Enter the workers' meeting","Copy the production order","The furnace consumes the names of people nobody is allowed to remember."],
 ["A fire sold as daylight","A Glass Arcade merchant sells jars of light from the Council's engine. Each jar has a citizen's birth date scratched into the glass.","Trace the dates to their owners","Persuade the merchant to testify","The light has been borrowed from people who never consented."],
 ["The Council's red ledger","An archivist shows you the engine's maintenance cost: every seven nights, a name disappears.","Read the ledger without the librarian's leave","Argue for access under the city charter","You have proof that the false sky is sustained by an organised injustice."],
 ["Flowers grown without consent","The Moss Choir grows a kind of moss that could safely light whole streets. The Council has classified the discovery as treason.","Protect the botanist's notes","Recruit a witness from the Choir","A safe replacement exists, but its release would end the Council's monopoly on light."],
 ["The cold bargemen","Barges carry moss fertiliser to a secret experimental district. Its lamps have shone for twelve weeks without the furnace.","Follow the shipment in disguise","Win the bargemen's trust","The Council's claim that the engine must continue is a lie. The city can survive its shutdown."],
 ["The chamber above the stairs","The Council offers you a seat in its chamber if you abandon the workers. Through the floor you hear the furnace cough.","Steal the control key","Refuse the offer and rally the workers","You hold the means to end the Council's fire and a chance to choose what replaces it."],
 ["When the furnace goes quiet","At the Listening Edge, you can shatter the engine and risk a dark transition, or organise a slower handover under public oversight.","Break the engine and release the stolen names","Transfer control to workers and reopen the charter","The city's lamps flicker. For the first time, everyone knows who has the right to relight them."]
 ]}
];
e.ambitions=paths.map(p=>({id:p.id,name:p.name,description:p.description,reward:p.reward,stat:p.stat}));
e.stories.push({
 id:"choose-personal-ambition",where:["court"],title:"A question no clerk can answer",
 description:"The clockmaker explains that her commission concerns the whole city. But each of its streets holds a private mystery: a king who steals light, a river trying to write a will, a child locked behind glass and a furnace that eats names. You can follow only one of these great undertakings in this life. Your earlier city investigation remains open.",
 when:s=>!s.path,
 choices:paths.map(p=>({label:"Choose: "+p.name,desc:p.description,cost:0,effects:{path:p.id},success:"You commit to "+p.name+". Your first lead begins in Lantern Court. The city records your decision, and the other ambitions close for this character."}))
});
for(const p of paths){
 p.steps.forEach(([title,description,actA,actB,revelation],i)=>{
   const done=false; // Original chapter eight is an interlude; the new finale is chapter 32.
   const effects=(ending)=>Object.assign({pathProgress:1,coin:3,clues:(i===0||i===2||i===5)?1:0},
     done?{pathEnding:p.id+":"+ending,items:{[p.reward]:1},relation:{[p.id==="moth"?"wardens":p.id==="tide"?"hands":p.id==="mirror"?"choir":"dawn"]:2}}:{});
   e.stories.push({id:"path-"+p.id+"-"+(i+1),where:[p.places[i]],title:(i+1)+". "+title,description,
     category:"ambition",once:true,when:s=>s.path===p.id&&s.pathProgress===i,
     choices:[
       {label:actA+" ("+p.stat+")",stat:p.stat,difficulty:4+Math.min(i,4),
        effects:effects("first"),fail:i%2===0?{sanity:-1}:{suspicion:1},success:revelation,
        failure:"You get close enough to learn what is at stake, but your attempt fails. You can gather yourself and try another approach."},
       {label:actB+" ("+p.other+")",stat:p.other,difficulty:4+Math.min(i,4),
        effects:effects("second"),fail:i%2===0?{notoriety:1}:{health:-1},
        success:revelation+" The witness you persuaded will remember that you chose this approach.",
        failure:"An important detail slips away. You learn which voice to question next, but have not secured the proof."}
     ]});
 });
}
const names=[
 {stat:"observation",name:"A Name Written Between the Lines",places:["ink","ink","court","ink","stairs","ink","court"],reward:"reader-lens",faction:"ledger",
 scenes:[
 ["An index of missing vowels","An archivist asks you to reconstruct the name cut from a municipal index.","Restore the missing letters","Interview a nervous cataloguer"],
 ["The ink that cannot dry","A writing desk is stained with black ink that moves uphill when the lamps go out.","Test the ink against a blank page","Consult the oldest lexicographer"],
 ["A census of uncounted doors","A census has counted every door in Lantern Court except the entrance used by its clerk.","Compare each tally by hand","Question the exhausted enumerator"],
 ["A footnote at war","Two annotations contradict one another about the Council's first meeting. One is written in your hand.","Follow the older citation","Read the paper under reflected light"],
 ["The map under the stairs","A map of the Forgotten Stairs has been corrected by someone who knew the way out.","Compare the erasures","Measure the stair landings"],
 ["The witness behind the books","A librarian confesses that the most dangerous book in the archive is still being written.","Read its newest chapter","Ask who is allowed to add a line"],
 ["A name in permanent ink","The city offers to put your discovery into its official record. The price is that your own signature becomes public.","Sign the final finding","Preserve an independent copy"]
 ]},
 {stat:"guile",name:"A Name Passed Hand to Hand",places:["quays","market","quays","soot","market","stairs","court"],reward:"runner-token",faction:"hands",
 scenes:[
 ["The parcel with no sender","A courier pays you to deliver a parcel that ticks whenever it hears your footsteps.","Carry it past the harbour watch","Open a second route through the loading docks"],
 ["A stall selling alibis","The Glass Arcade sells proof that you were somewhere else. None of the certificates names a place.","Swap the certificates","Persuade the seller to tell you the method"],
 ["The invisible consignment","A barge's cargo weight suggests it carries a passenger nobody has counted.","Find the false floor","Distract the customs officers"],
 ["A factory with a back door","At the Sootworks, every service door is watched except the one marked NO EXIT.","Trace the guards' blind spot","Bribe a shift supervisor"],
 ["The exchange of an empty envelope","A broker offers a sealed envelope in return for the name you used at the Bell-Cage.","Replace the envelope unseen","Negotiate a safer trade"],
 ["The road that crosses itself","A stairway courier has been using a route that makes tomorrow's parcels arrive yesterday.","Follow the chalk arrows","Ask the courier what they fear"],
 ["The final delivery","You must choose whom to trust with evidence of the Council's secret couriers.","Deliver it openly to the people","Place it in a secure anonymous archive"]
 ]},
 {stat:"resolve",name:"A Name Kept Through the Dark",places:["soot","quays","soot","stairs","choir","edge","court"],reward:"warden-scar",faction:"wardens",
 scenes:[
 ["A roof that moves","An Ash Warden asks you to hold a ladder while something enormous crosses the cavern roof.","Hold the line","Study the creature's direction"],
 ["A bell in the flooded watch","A night watchman will not abandon a post even as black water fills the room.","Help him leave alive","Carry the alarm to the harbour"],
 ["A furnace that demands names","A foreman asks workers to recite their names before opening the third furnace.","Refuse the ritual","Lead the workers to safety"],
 ["The thirteenth landing","A patrol returns from the Stairs missing one member and every memory of that person.","Search the abandoned lanterns","Question the survivors patiently"],
 ["The garden under siege","The Moss Choir must protect a luminous greenhouse from something that feeds on fear.","Stand at the entrance","Lead a quiet evacuation"],
 ["The dark beyond the rail","A young Warden is trapped beyond the city's last lamp, too afraid to call for help.","Go after the Warden","Guide them home by sound"],
 ["The night's last watch","A final oath asks whether protection means standing beside the frightened, or standing between them and the truth.","Renew the public watch","Promise to protect the witnesses"]
 ]},
 {stat:"persuasion",name:"A Name Sung into Memory",places:["choir","market","court","choir","ink","market","court"],reward:"speaker-song",faction:"choir",
 scenes:[
 ["A song with an empty verse","The Moss Choir will let you join only if you can name a person the city has forgotten.","Offer a true story","Ask the singers to teach you the refrain"],
 ["A bargain in borrowed voices","A Glass Arcade dealer sells the perfect voice for a single evening.","Expose the trick before an audience","Convince a singer to reclaim their song"],
 ["The silent debate","Two Council envoys argue using empty chairs because neither will speak to the other.","Chair the meeting","Find one thing they still agree on"],
 ["The flower that accuses","A blossom repeats an accusation whenever a councillor approaches.","Ask it for the complete story","Gather people willing to hear it"],
 ["The audience of blank pages","A public reading is attended by clerks who have been ordered not to write down any words.","Speak without notes","Pass the testimony through whispers"],
 ["An offer from the glass stage","A promoter offers fame in exchange for removing every reference to the forgotten people.","Refuse the edit","Write a new performance for the forgotten"],
 ["The chorus of the living","At Lantern Court the singers invite you to lead their final anthem. The Council has sent listeners to count who joins.","Conduct the anthem openly","Let the audience finish the song"]
 ]}
];
e.makingNames=names.map(({stat,name,reward})=>({stat,name,reward,levels:7}));
for(const n of names){
 n.scenes.forEach(([title,description,a,b],i)=>{
   const final=i===6,rew=final?{items:{[n.reward]:1},relation:{[n.faction]:2}}:{};
   e.stories.push({id:"name-"+n.stat+"-"+(i+1),where:[n.places[i]],title:"Making Your Name "+(i+1)+"/7: "+title,
     description,category:"making-name",once:true,when:s=>(s.renown?.[n.stat]||0)===i,
     choices:[
      {label:a,stat:n.stat,difficulty:4+Math.min(i,4),effects:{renown:{[n.stat]:1},coin:3,...rew},
       fail:{sanity:-1},success:"You earn the next measure of trust. "+description+" The people who saw you act will remember your name.",
       failure:"Your approach does not yet convince anyone. The witnesses remain, and you may return better prepared."},
      {label:b,stat:n.stat,difficulty:3+Math.min(i,4),effects:{renown:{[n.stat]:1},coin:1,...rew},
       fail:{notoriety:1},success:"You win a quieter kind of recognition. A witness offers to speak for you when your name is questioned again.",
       failure:"You are heard but not believed. The memory of the attempt lingers; the proof must come later."}
     ]});
 });
}
})();