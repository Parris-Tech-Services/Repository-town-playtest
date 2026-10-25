#!/usr/bin/env node
/**
 * The Undercity content auditor.
 * Use: node scripts/validate-content.mjs
 * Checks versioned JSON + legacy browser-authored JS, without executing gameplay.
 * Exits nonzero on broken references, malformed choices, duplicate IDs, missing qualities.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const errors=[],warn=[],fail=(scope,message)=>errors.push(scope+": "+message);
const parsed=p=>JSON.parse(read(p));
const doc=parsed("content/storylets/ambitions/moth.json");
const schema=parsed("content/schema/storylet.schema.json");
/** Small built-in JSON Schema subset; cross-document checks below remain authoritative. */
function validateSchema(value,rule,where){
 if(rule.$ref){
  const pointer=rule.$ref;
  if(!pointer.startsWith("#/$defs/"))return fail(where,"unsupported schema ref "+pointer);
  rule=schema.$defs[pointer.slice(8)];
  if(!rule)return fail(where,"unknown schema ref "+pointer);
 }
 if(Object.hasOwn(rule,"const")&&value!==rule.const)fail(where,"expected constant "+JSON.stringify(rule.const));
 if(rule.enum&&!rule.enum.includes(value))fail(where,"value not in enum");
 const kind=value===null?"null":Array.isArray(value)?"array":typeof value;
 if(rule.type&&!(Array.isArray(rule.type)?rule.type:[rule.type]).includes(kind==="number"&&Number.isInteger(value)?"integer":kind)){
  // An integer is also a valid JSON Schema number.
  if(!(kind==="number"&&Number.isInteger(value)&&rule.type==="number")){
   fail(where,"invalid type "+kind);return;
  }
 }
 if(kind==="string"){
  if(rule.minLength!=null&&value.length<rule.minLength)fail(where,"string shorter than "+rule.minLength);
  if(rule.pattern&&!new RegExp(rule.pattern).test(value))fail(where,"invalid string pattern");
 }
 if(kind==="number"){
  if(rule.minimum!=null&&value<rule.minimum)fail(where,"number below minimum");
 }
 if(kind==="array"){
  if(rule.minItems!=null&&value.length<rule.minItems)fail(where,"too few array items");
  value.forEach((item,i)=>rule.items&&validateSchema(item,rule.items,where+"["+i+"]"));
 }
 if(kind==="object"){
  for(const k of rule.required||[])if(!Object.hasOwn(value,k))fail(where,"missing required property "+k);
  if(rule.minProperties!=null&&Object.keys(value).length<rule.minProperties)fail(where,"too few properties");
  for(const [k,v] of Object.entries(value)){
   if(rule.properties?.[k])validateSchema(v,rule.properties[k],where+"."+k);
   else if(rule.additionalProperties===false)fail(where,"unexpected property "+k);
   else if(rule.additionalProperties&&typeof rule.additionalProperties==="object")
    validateSchema(v,rule.additionalProperties,where+"."+k);
  }
 }
}

validateSchema(doc,schema,"moth.json");
const html=read("index.html");
const main=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
if(!main)fail("index.html","inline game script is missing");
const context=vm.createContext({window:{},console});
for(const p of ["content/ambitions.js","content/moth.generated.js","content/second-acts.generated.js","content/late-ambitions.js","content/cms-published.js","content/world.js","content/penalties.js","content/callings.js","content/systems.js"]){
 try{vm.runInContext(read(p),context,{filename:p,timeout:4000})}
 catch(e){fail(p,e.message)}
}
let base={PLACES:{},STORIES:[],CARDS:[],ITEMS:{},STATS:{}};
if(main){
 const cut=main.indexOf("const EXT=");
 if(cut<0)fail("index.html","missing content merge marker");
 else {
  try{vm.runInContext(main.slice(main.indexOf("const SAVE="),cut),context,{timeout:4000});
   base=vm.runInContext("({PLACES,STORIES,CARDS,ITEMS,STATS})",context)}
  catch(e){fail("base-content",e.message)}
 }
}
const ext=context.window.UndercityExpansions||{};
const sys=context.window.UndercitySystems||{};
const stories=[...(base.STORIES||[]),...(ext.stories||[])];
const cards=[...(base.CARDS||[]),...(ext.cards||[])];
const itemIds=new Set([...Object.keys(base.ITEMS||{}),...Object.keys(ext.items||{})]);
const placeIds=new Set(Object.keys(base.PLACES||{}));
const qualityIds=new Set([...Object.keys(base.STATS||{}),
 "suspicion","notoriety","health","sanity","wounds","delirium","the_record","ambition","pathProgress","clues","coin",
 "path","pathEnding",...Object.keys(ext.qualityDefs||{})]);
for(const p of Object.keys(ext.qualities||{}))qualityIds.add(p);
for(const f of Object.keys(ext.quirks||{}))qualityIds.add(f);
for(const f of Object.keys(ext.ambitions||{}))qualityIds.add(f);
const ids=new Set(),cardIds=new Set();
for(const st of stories){
 const scope="story "+st.id;
 if(!st.id||!st.title||!st.description)fail(scope,"required id/title/description missing");
 if(ids.has(st.id))fail(scope,"duplicate ID");ids.add(st.id);
 if(!Array.isArray(st.where)||!st.where.length)fail(scope,"missing district");
 for(const place of st.where||[])if(!placeIds.has(place))fail(scope,"unknown district "+place);
 if(!Array.isArray(st.choices)||!st.choices.length)fail(scope,"no choices");
 st.choices?.forEach((c,i)=>{
  const at=scope+" choice "+i;
  if(!c.label)fail(at,"missing choice text");
  if(c.stat&&!qualityIds.has(c.stat))fail(at,"unknown quality "+c.stat);
  if(c.difficulty!=null&&(!Number.isFinite(c.difficulty)||c.difficulty<0))fail(at,"invalid difficulty");
  if(c.need?.item&&!itemIds.has(c.need.item))fail(at,"missing item "+c.need.item);
  for(const effects of [c.effects,c.fail,c.rare]){
   if(!effects)continue;
   for(const item of Object.keys(effects.items||{}))if(!itemIds.has(item))fail(at,"missing item "+item);
   for(const k of Object.keys(effects.renown||{}))if(!qualityIds.has(k))fail(at,"unknown renown quality "+k);
   for(const key of Object.keys(effects.quality||{}))if(!qualityIds.has(key))fail(at,"unknown effect quality "+key);
  }
  if(c.next_storylet&&!stories.some(x=>x.id===c.next_storylet))fail(at,"broken next_storylet "+c.next_storylet);
 });
 if(st.next_storylet&&!stories.some(x=>x.id===st.next_storylet))fail(scope,"broken next_storylet "+st.next_storylet);
}
for(const [place,data] of Object.entries(base.PLACES||{})){
 for(const id of data.stories||[])if(!ids.has(id))fail("location "+place,"missing referenced storyId "+id);
 for(const adjacent of data.adj||[])if(!placeIds.has(adjacent))fail("location "+place,"missing linked district "+adjacent);
}
for(const card of cards){
 if(cardIds.has(card.id))fail("card "+card.id,"duplicate ID");cardIds.add(card.id);
 if(!card.choices?.length)fail("card "+card.id,"no choice");
 for(const place of card.where||[])if(!placeIds.has(place))fail("card "+card.id,"invalid district "+place);
 for(const c of card.choices||[]){
  if(c.stat&&!qualityIds.has(c.stat))fail("card "+card.id,"unknown quality "+c.stat);
  for(const item of Object.keys(c.effects?.items||{}))if(!itemIds.has(item))fail("card "+card.id,"unknown item "+item);
 }
}
if(doc.schema_version!==1)fail("moth.json","unexpected schema version");
if(doc.content_type!=="ambition"||doc.id!=="moth-expansion")fail("moth.json","content type/id mismatch");
if(!Array.isArray(doc.chapters)||doc.chapters.length!==24)fail("moth.json","expected 24 authored chapters");
const byProgress=[...doc.chapters||[]].sort((a,b)=>a.progress-b.progress);
byProgress.forEach((st,i)=>{
 const at="moth.json "+st.id,expected=8+i;
 if(st.storyId!==st.id)fail(at,"storyId mismatch");
 if(st.progress!==expected||st.unlock?.ambition_progress!==expected||st.unlock?.path!=="moth")fail(at,"not a valid simple-chain gate "+expected);
 if(i<23&&st.next_storylet!==byProgress[i+1].id)fail(at,"broken sequence link");
 if(i===23&&st.next_storylet!==null)fail(at,"terminal story must have null next");
 if(st.choices.length<3)fail(at,"expected three materially different branches");
 const statSet=new Set(st.choices.map(c=>c.stat));
 if(statSet.size<2)fail(at,"must test two different qualities");
 for(const choice of st.choices){
  if(choice.effects?.pathProgress!==1)fail(at,"successful branch must increment pathProgress by one");
  if(choice.requirement){
   for(const [quality,v] of Object.entries(choice.requirement)){
    if(!["background","faction"].includes(quality))fail(at,"unsupported character gate quality "+quality);
    if(typeof v!=="string"||!v)fail(at,"invalid character gate");
   }
  }
 }
});
const late=parsed("content/storylets/ambitions/late-main.v1.json");
if(late.schema_version!==1||late.content_type!=="ambition-main-collection"||late.chapters?.length!==72)
 fail("late-main.v1.json","expected 72 late main chapters, schema_version 1");
for(const ambition of ["tide","mirror","ember"]){
 const byStage=late.chapters.filter(st=>st.id.startsWith("path-"+ambition+"-")).sort((a,b)=>a.progress-b.progress);
 if(byStage.length!==24)fail(ambition,"expected 24 late chapters");
 byStage.forEach((st,i)=>{
  const stage=i+9,at="late-main "+st.id;
  if(st.id!=="path-"+ambition+"-"+stage||st.storyId!==st.id)fail(at,"noncanonical ID");
  if(st.progress!==stage-1||st.unlock?.path!==ambition||st.unlock.ambition_progress!==stage-1)
   fail(at,"broken simple-chain gate");
  if(st.next_storylet!==(stage===32?null:"path-"+ambition+"-"+(stage+1)))fail(at,"next_storylet broken");
  if(!st.title||!st.description||!Array.isArray(st.where)||!st.where.every(x=>placeIds.has(x)))
   fail(at,"missing copy or invalid district");
  if(!Array.isArray(st.choices)||st.choices.length<3)fail(at,"needs several choices");
  for(const c of st.choices||[]){
   if(!c.label||!c.success||!c.failure)fail(at,"missing dialogue outcome");
   if(!qualityIds.has(c.stat))fail(at,"unrecognised challenge quality "+c.stat);
   if(c.effects?.pathProgress!==1)fail(at,"success must advance one chapter");
   if(c.requirement_flag&&!c.requirement_flag.startsWith(ambition+"-witness-"))fail(at,"invalid saved-witness gate");
   if(c.requirement_extra){
    for(const [k,v] of Object.entries(c.requirement_extra))
     if(![ambition+"Evidence",ambition+"Witnesses"].includes(k)||!Number.isInteger(v)||v<0)
      fail(at,"invalid earned-coalition gate "+k);
   }
   for(const item of Object.keys(c.effects?.items||{}))if(!itemIds.has(item))fail(at,"unknown reward item "+item);
  }
 });
}
for(const [key,gear] of Object.entries(sys.gear||{})){
 if(!itemIds.has(key))fail("equipment "+key,"undeclared inventory item");
 if(!(sys.slots||[]).includes(gear[0]))fail("equipment "+key,"unknown slot "+gear[0]);
 if(!qualityIds.has(gear[1]))fail("equipment "+key,"unknown stat "+gear[1]);
}
for(const profession of ext.professions||[]){
 if(!placeIds.has(profession.place))fail("profession "+profession.id,"unknown work location "+profession.place);
 if(!itemIds.has(profession.item))fail("profession "+profession.id,"unknown profession item "+profession.item);
}
if(errors.length){
 console.error("\nCONTENT INVALID — "+errors.length+" issue(s)");
 for(const e of errors.slice(0,200))console.error("✗ "+e);
 process.exitCode=1;
}else console.log("CONTENT VALID: "+stories.length+" storylets, "+cards.length+" cards, "+
 placeIds.size+" districts, "+itemIds.size+" items, "+(ext.professions||[]).length+
 " professions; "+doc.chapters.length+" JSON moth chapters; "+
 (sys.slots||[]).length+" equipment slots");
