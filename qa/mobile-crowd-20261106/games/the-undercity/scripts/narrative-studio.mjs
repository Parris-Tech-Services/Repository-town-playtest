#!/usr/bin/env node
// Editorial validation gate; does not modify shipped game content.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const docs=path.join(root,"docs/narrative-studio");
const dir=path.join(root,"content/narrative-studio");
const contract=JSON.parse(fs.readFileSync(path.join(dir,"schema.v1.json"),"utf8"));
const problems=[];
for(const name of ["bible.md","secrets.md","style.md","agents.md","README.md"]){
 const file=path.join(docs,name);
 if(!fs.existsSync(file)||fs.readFileSync(file,"utf8").length<400)problems.push("Missing/empty "+name);
}
const ledger=fs.readFileSync(path.join(docs,"secrets.md"),"utf8");
const ids=new Set([...ledger.matchAll(/^\| (UC-S\d{2}) \|/gm)].map(x=>x[1]));
if(ids.size!==40)problems.push("Secrets ledger must contain exactly 40 unique IDs, found "+ids.size);
const subdir=path.join(dir,"submissions");
if(!fs.existsSync(subdir))fs.mkdirSync(subdir,{recursive:true});
const rows=[];
for(const name of fs.readdirSync(subdir).filter(x=>x.endsWith(".json"))){
 let raw;
 try{raw=JSON.parse(fs.readFileSync(path.join(subdir,name),"utf8"))}catch(e){problems.push(name+" invalid JSON "+e.message);continue}
 if(raw.format==="qbn-studio-export"&&!Array.isArray(raw.stories)){problems.push(name+" missing exported stories");continue}
 const incoming=raw.format==="qbn-studio-export"?raw.stories:[raw];
 for(const source of incoming){
 const cms=Array.isArray(source.choices);
 const stages={"pitch":"pitch","midflight":"skeleton","prose":"prose","content-qa":"qa","design-qa":"qa","mechanical-qa":"qa","continuity":"qa","review":"qa","approved":"approved"};
 const record=cms?{...source,game:"The Undercity",stage:stages[source.status]??"pitch",
  branches:source.choices.map(c=>({id:c.id,challenge:{stat:c.stat,difficulty:c.difficulty},action_cost:Number(c.action_cost),success:c.success,failure:c.failure})),
  qa:Object.fromEntries(["content","design","mechanical","continuity"].map(k=>[k,source.qa?.[k]?"pass":"pending"])),
  human_approved:Boolean(source.qa?.peer&&source.reviewer&&source.reviewer.toLowerCase()!==source.author?.toLowerCase()),creator_approved:source.review_mode==="solo-creator"&&source.creator_approval?.method==="creator-confirmed"&&source.creator_approval?.schema_qa_passed===true}:source;
 rows.push(record);
 const fail=s=>problems.push(name+": "+s);
 if(record.schema_version!==1||record.game!=="The Undercity")fail("wrong schema/game");
 if(!/^[a-z0-9][a-z0-9_-]+$/.test(record.id??""))fail("invalid story ID");
 if(!contract.stages.includes(record.stage))fail("invalid stage");
 if(!record.title?.trim()||!record.location?.trim()||!record.pitch?.trim())fail("missing pitch/title/location");
 if(!Number.isInteger(record.reveal_depth)||record.reveal_depth<1||record.reveal_depth>5)fail("invalid reveal depth");
 for(const id of record.secret_ids??[]){
   if(!ids.has(id))fail("secret "+id+" is undeclared");
   else{const row=ledger.split("\n").find(x=>x.startsWith("| "+id+" |"));const d=Number(row?.split("|")[2]?.trim());if(d>record.reveal_depth)fail("secret "+id+" is deeper than approved reveal");}
 }
 if(record.stage!=="pitch"&&(!Array.isArray(record.branches)||record.branches.length<2||record.branches.length>5))fail("2–5 branches required");
 const seen=new Set();
 for(const [i,branch] of (record.branches??[]).entries()){
   if(!branch.id||seen.has(branch.id))fail("branch ID missing/duplicate at "+i);seen.add(branch.id);
   if(!contract.primary_stats.includes(branch.challenge?.stat))fail("invalid challenge.stat "+i);
   if(!Number.isFinite(branch.challenge?.difficulty)||branch.challenge.difficulty<1)fail("invalid difficulty "+i);
   if(![0,1].includes(branch.action_cost))fail("action cost 0 or 1 required "+i);
   for(const k of ["success","failure"]){
     if(typeof branch[k]?.text!=="string")fail("missing "+k+" text "+i);
     else if(["prose","qa","approved"].includes(record.stage)&&(!branch[k].text.trim()||branch[k].text.includes("[PROSE PENDING]")))fail("unfinished "+k+" text "+i);
   }
 }
 if(["prose","qa","approved"].includes(record.stage)&&(!record.description?.trim()||record.description.includes("[PROSE PENDING]")))fail("unfinished story description");
 if(record.stage==="approved"){
   if(!record.human_approved&&!record.creator_approved)fail("creator confirmation or independent human sign-off required");
   if(record.human_approved){
    if(!record.reviewer?.trim())fail("named human reviewer required");
    for(const k of contract.qa_types)if(record.qa?.[k]!=="pass")fail("QA "+k+" not passed");
   }
   if(record.creator_approved&&record.human_approved)fail("Choose accurate review provenance: solo or independent");
   if(record.runtime_integration!=="verified")fail("runtime-integration testing required");
 }
}}
const statuses=Object.fromEntries(contract.stages.map(k=>[k,rows.filter(r=>r.stage===k).length]));
if(process.argv.includes("report"))console.log("Editorial pipeline: "+JSON.stringify(statuses));
if(problems.length){for(const p of problems)console.error("✗ "+p);process.exitCode=1;}
else console.log("Editorial studio: "+ids.size+" ledger IDs, "+rows.length+" review packets valid.");
