/* Generated from rules.js; verify parity with tests. Do not edit directly. */
(function(){
"use strict";
/**
 * THE UNDERCITY — Core Quality-Based Narrative rules engine.
 * Canonical ES module. rules.global.js is the generated classic-script build.
 * The formulas and game terminology follow the supplied Undercity specification.
 */
// Fourteen enumerable quality categories; legacy synonyms remain available as
// non-enumerable aliases so older authored stories remain compatible.
const qualityTypes={
 PRIMARY_STAT:"primary_stat", MENACE:"menace", DISPOSITION:"disposition",
 AFFILIATION:"affiliation", REVERIE:"reverie", STORY:"story",
 ITEM:"item", CONDITION:"condition", DEED:"deed", PASSAGE:"passage",
 STATUS:"status", CIRCUMSTANCE:"circumstance",
 ACCOMPLISHMENT:"accomplishment", FATE_MARKER:"fate_marker"
};
Object.defineProperties(qualityTypes,{
 ROUTE:{value:"passage"},LIVING_STORY:{value:"pending_event"},
 DREAM:{value:"reverie"},QUIRK:{value:"disposition"},
 PENDING_EVENT:{value:"pending_event"},METAQUALITY:{value:"status"}
});
const QualityType=Object.freeze(qualityTypes);
const PYRAMIDAL=new Set([
 QualityType.PRIMARY_STAT,QualityType.MENACE,QualityType.DISPOSITION,
 QualityType.AFFILIATION,QualityType.REVERIE,QualityType.DREAM
]);
function isPyramidal(type){return PYRAMIDAL.has(type);}
const LEVEL_THRESHOLD=70;
const CP_PER_LEVEL_AFTER_THRESHOLD=70;
function levelToTotalCp(level,threshold=LEVEL_THRESHOLD){
 if(level<=0)return 0;
 if(level<threshold)return level*(level+1)/2;
 return threshold*(threshold+1)/2+(level-threshold)*CP_PER_LEVEL_AFTER_THRESHOLD;
}
function cpToLevel(cp,threshold=LEVEL_THRESHOLD){
 if(cp<=0)return 0;
 const thresholdCp=threshold*(threshold+1)/2;
 if(cp<thresholdCp)return Math.floor((Math.sqrt(8*cp+1)-1)/2);
 return threshold+Math.floor((cp-thresholdCp)/CP_PER_LEVEL_AFTER_THRESHOLD);
}
function cpToNextLevel(cp,threshold=LEVEL_THRESHOLD){
 return levelToTotalCp(cpToLevel(cp,threshold)+1,threshold)-cp;
}
function addCp(state,amount,maxLevel=Infinity,threshold=LEVEL_THRESHOLD){
 const newCp=Math.max(0,(Number(state.cp)||0)+amount);
 const cappedCp=Math.min(newCp,levelToTotalCp(maxLevel,threshold));
 return {id:state.id,cp:cappedCp,level:cpToLevel(cappedCp,threshold)};
}
const DEFAULT_SCALER=.60;
const MIN_BROAD_CHANCE=10;
const DEFAULT_RARE_SUCCESS_CHANCE=.04;
function broadChance(qualityLevel,difficultyLevel,scaler=DEFAULT_SCALER){
 // This early success is an explicit rule in the supplied implementation.
 if(difficultyLevel<=0||qualityLevel>=difficultyLevel)return 100;
 const raw=Math.floor(scaler*qualityLevel/difficultyLevel*100);
 return Math.max(MIN_BROAD_CHANCE,Math.min(100,raw));
}
function roll(chancePercent){return Math.random()*100<chancePercent;}
function cpAward(chance,success){return !success?1:chance>=80?1:2;}
function resolveChallenge(challenge,qualityLevel){
 const narrow=challenge.narrow!==undefined;
 const chance=narrow
  ?Math.max(0,Math.min(100,challenge.narrow))
  :broadChance(qualityLevel,challenge.difficulty,challenge.scaler??DEFAULT_SCALER);
 const success=roll(chance);
 const rare=!narrow&&success&&roll((challenge.rareChance??DEFAULT_RARE_SUCCESS_CHANCE)*100);
 return {outcome:!success?"failure":rare?"rare_success":"success",
  chance,rare,cpAwarded:cpAward(chance,success)};
}
const EquipmentSlot=Object.freeze({
 HAT:"hat",COAT:"coat",ADORNMENT:"adornment",GLOVES:"gloves",
 WEAPON:"weapon",BOOTS:"boots",LUGGAGE:"luggage",COMPANION:"companion",
 TREASURE:"treasure",DESTINY:"destiny",TOOLS:"tools",AFFILIATION:"affiliation",
 TRANSPORT:"transport",LODGING:"lodging",VESSEL:"vessel",CREW:"crew",
 AIRSHIP:"airship",SPOUSE:"spouse",CLUB:"club",BOON:"boon"
});
function getEffectiveStat(player,statId,qualityDefs){
 let base=player.qualities?.[statId]?.level??0;
 for(const itemId of Object.values(player.equipped||{})){
  if(!(player.inventory?.[itemId]>0))continue;
  base+=qualityDefs[itemId]?.stat_bonuses?.[statId]??0;
 }
 return base;
}
function applyEffect(player,effect,qualityDefs){
 const def=qualityDefs[effect.quality];
 if(!def){console.warn("Unknown quality in effect: "+effect.quality);return player;}
 player.qualities??={};
 if(effect.remove){delete player.qualities[effect.quality];return player;}
 if(effect.set!==undefined){
  const level=Math.max(0,Math.min(def.max??Infinity,Number(effect.set)||0));
  const cp=isPyramidal(def.type)?levelToTotalCp(level):level;
  player.qualities[effect.quality]={id:effect.quality,cp,level};
  return player;
 }
 if(effect.cp===undefined)return player;
 const current=player.qualities[effect.quality]??{id:effect.quality,cp:0,level:0};
 if(isPyramidal(def.type)){
  player.qualities[effect.quality]=addCp(current,effect.cp,def.max??Infinity);
  if(def.type===QualityType.DISPOSITION&&effect.cp>0&&def.opposite){
   for(const oppId of (Array.isArray(def.opposite)?def.opposite:[def.opposite])){
    const oppDef=qualityDefs[oppId];if(!oppDef)continue;
    const opp=player.qualities[oppId]??{id:oppId,cp:0,level:0};
    player.qualities[oppId]=addCp(opp,-Math.abs(effect.cp),oppDef.max??Infinity);
   }
  }
 }else{
  const max=[QualityType.FATE_MARKER,QualityType.CIRCUMSTANCE].includes(def.type)?1:def.max??Infinity;
  const level=Math.max(0,Math.min(max,current.level+effect.cp));
  player.qualities[effect.quality]={id:effect.quality,cp:level,level};
 }
 return player;
}
const MENACE_THRESHOLD=8;
const MENACE_PENALTY_HUBS=Object.freeze({
 suspicion:"the_watch_house",notoriety:"the_tribunal",
 wounds:"the_ward",delirium:"the_pale_rooms"
});
function checkMenaceThreshold(player){
 for(const [menace,hub] of Object.entries(MENACE_PENALTY_HUBS))
  if((player.qualities?.[menace]?.level??0)>=MENACE_THRESHOLD)return hub;
 return null;
}
function sendToPenaltyHub(player,menace){
 const hub=MENACE_PENALTY_HUBS[menace];if(!hub)return player;
 player.current_location=hub;
 if(menace==="suspicion"){
  player.qualities??={};
  const prior=Math.max(0,Number(player.qualities.the_record?.level)||0);
  const level=Math.min(7,prior+1);
  player.qualities.the_record={id:"the_record",level,cp:level};
 }
 return player;
}
const ACTION_REGEN_MS=600000;
function regenerateActions(player){
 const now=Date.now();
 const elapsed=Math.max(0,now-player.last_action_tick);
 const toAdd=Math.floor(elapsed/ACTION_REGEN_MS);
 if(toAdd>0){
  player.actions=Math.min(player.max_actions,player.actions+toAdd);
  player.last_action_tick+=toAdd*ACTION_REGEN_MS;
 }
 if(player.actions>=player.max_actions)player.last_action_tick=now;
 return player;
}
function spendActions(player,cost){
 if(!Number.isFinite(cost)||cost<0||player.actions<cost)return false;
 player.actions-=cost;return true;
}
const UndercityRules = {
 QualityType,isPyramidal,LEVEL_THRESHOLD,CP_PER_LEVEL_AFTER_THRESHOLD,
 levelToTotalCp,cpToLevel,cpToNextLevel,addCp,
 DEFAULT_SCALER,MIN_BROAD_CHANCE,DEFAULT_RARE_SUCCESS_CHANCE,
 broadChance,roll,resolveChallenge,cpAward,
 EquipmentSlot,getEffectiveStat,applyEffect,
 MENACE_THRESHOLD,MENACE_PENALTY_HUBS,checkMenaceThreshold,sendToPenaltyHub,
 ACTION_REGEN_MS,regenerateActions,spendActions
};

window.UndercityRules=UndercityRules;
})();
