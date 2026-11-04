#!/usr/bin/env node
/** Export a traceable inventory of the live narrative corpus.
 * --json prints coverage statistics; --csv prints a spreadsheet-compatible story tracker.
 */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const sourcePaths=["content/ambitions.js","content/moth.generated.js","content/world.js","content/penalties.js","content/callings.js","content/systems.js"];
export function inventory(){
 const ctx=vm.createContext({window:{},console});
 for(const file of sourcePaths)vm.runInContext(read(file),ctx,{filename:file,timeout:4000});
 const html=read("index.html"),main=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1]||"";
 const from=main.indexOf("const SAVE="),to=main.indexOf("const EXT=");
 if(from<0||to<=from)throw Error("Missing game content definitions");
 vm.runInContext(main.slice(from,to),ctx,{filename:"inline-data",timeout:4000});
 const base=vm.runInContext("({STORIES,CARDS,PLACES})",ctx),ext=ctx.window.UndercityExpansions||{};
 const rows=[...(base.STORIES||[]),...(ext.stories||[])].map(s=>{
  const match=/^path-([a-z0-9-]+)-(\d+)$/.exec(s.id);
  return {id:s.id,title:s.title||"",kind:s.category||"side",
   ambition:match?.[1]||"",chapter:match?Number(match[2]):"",
   place:s.location||s.where?.join("|")||"",branches:s.choices?.length??0,
   challengedBranches:(s.choices||[]).filter(c=>c.stat||c.challenge).length};
 });
 const ambitionIds=["moth","tide","glass","ember"];
 const ambitions=Object.fromEntries(ambitionIds.map(id=>{
  const chapters=rows.filter(r=>r.ambition===id).map(r=>r.chapter).sort((a,b)=>a-b);
  return [id,{chapters:chapters.length,target:30,
   missingToThirty:Math.max(0,30-chapters.length),
   branches:rows.filter(r=>r.ambition===id).reduce((n,r)=>n+r.branches,0)}];
 }));
 const ids=rows.map(s=>s.id);
 return {storylets:rows.length,cards:[...(base.CARDS||[]),...(ext.cards||[])].length,
  places:Object.keys(base.PLACES||{}).length,ambitions,
  duplicates:ids.filter((id,i)=>ids.indexOf(id)!==i),
  missingChoices:rows.filter(r=>r.branches===0).map(r=>r.id),rows};
}
export function csv(data){
 const fields=["id","title","kind","ambition","chapter","place","branches","challengedBranches"];
 const escape=x=>'"'+String(x??"").replaceAll('"','""')+'"';
 return fields.join(",")+"\n"+data.rows.map(r=>fields.map(k=>escape(r[k])).join(",")).join("\n")+"\n";
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const data=inventory();
 if(process.argv.includes("--csv"))process.stdout.write(csv(data));
 else if(process.argv.includes("--json"))console.log(JSON.stringify(data,null,2));
 else{
  console.log(data.storylets+" storylets; "+data.cards+" opportunity cards; "+data.places+" locations");
  for(const [id,s] of Object.entries(data.ambitions))console.log(id+": "+s.chapters+"/30 chapters; "+s.missingToThirty+" still needed");
 }
 if(data.duplicates.length||data.missingChoices.length)process.exitCode=1;
}
