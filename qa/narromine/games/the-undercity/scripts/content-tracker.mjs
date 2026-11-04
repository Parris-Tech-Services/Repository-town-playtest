#!/usr/bin/env node
// A source-of-truth inventory of EVERY playable storylet, choice, card and profession.
import fs from "node:fs";
import vm from "node:vm";
import path from "node:path";
import {fileURLToPath} from "node:url";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const html=read("index.html"),main=html.match(/<script>\s*([\s\S]*?)<\/script>/)?.[1];
if(!main)throw Error("Missing inline game");
const ctx=vm.createContext({window:{},console});
const sources=new Map(),cardSources=new Map();
for(const p of ["content/ambitions.js","content/moth.generated.js","content/second-acts.generated.js","content/late-ambitions.js","content/cms-published.js","content/world.js","content/penalties.js","content/callings.js","content/systems.js"]){
 const before=ctx.window.UndercityExpansions?.stories?.length||0;
 const cards=ctx.window.UndercityExpansions?.cards?.length||0;
 vm.runInContext(read(p),ctx,{timeout:5000,filename:p});
 for(const s of (ctx.window.UndercityExpansions?.stories||[]).slice(before))sources.set(s.id,p);
 for(const c of (ctx.window.UndercityExpansions?.cards||[]).slice(cards))cardSources.set(c.id,p);
}
const marker=main.indexOf("const EXT="),start=main.indexOf("const SAVE=");
if(marker<start)throw Error("Changed browser content bootstrap");
vm.runInContext(main.slice(start,marker),ctx,{timeout:5000});
const base=vm.runInContext("({STORIES,CARDS,PLACES,ITEMS})",ctx);
const ext=ctx.window.UndercityExpansions;
const all=[...base.STORIES,...ext.stories],cards=[...base.CARDS,...ext.cards];
for(const s of base.STORIES)sources.set(s.id,"index.html");
for(const c of base.CARDS)cardSources.set(c.id,"index.html");
const esc=v=>String(v??"").replace(/\|/g,"\\|").replace(/\r|\n/g," ");
const row=cols=>"| "+cols.map(esc).join(" | ")+" |";
const output=[
 "# The Undercity — content tracker",
 "",
 "Generated from the game source. To refresh: `node scripts/content-tracker.mjs`. To verify: `node scripts/content-tracker.mjs --check`.",
 "",
 "## Totals",
 "",
 "- Storylets: **"+all.length+"**",
 "- Choices: **"+all.reduce((n,s)=>n+(s.choices?.length||0),0)+"**",
 "- Opportunity cards: **"+cards.length+"**",
 "- Professions: **"+ext.professions.length+"**",
 "- Equipment slots: **"+(ctx.window.UndercitySystems?.slots?.length||0)+"**",
 "- Districts (including penalty hubs): **"+Object.keys(base.PLACES).length+"**",
 "",
 "## All storylets",
 "",
 row(["Story ID","Title","Location(s)","Type","Choices","Gate","Source","Next ID"]),
 row(["---","---","---","---","---:","---","---","---"]),
 ...all.sort((a,b)=>a.id.localeCompare(b.id)).map(st=>row([
  st.id,st.title,(st.where||[]).join(", "),
  st.category|| (st.id.startsWith("ambition")?"city ambition":"district"),
  st.choices?.length||0,st.autofire?"AUTOFIRE":st.when?"conditional":"always",
  sources.get(st.id)||"unknown",st.next_storylet||""
 ])),
 "",
 "## Opportunity cards",
 "",
 row(["Card ID","Title","Locality","Weight","Source"]),
 row(["---","---","---","---:","---"]),
 ...cards.sort((a,b)=>a.id.localeCompare(b.id)).map(c=>row([c.id,c.title,(c.where||["any"]).join(", "),c.weight??1,cardSources.get(c.id)||"unknown"])),
 "",
 "## Professions",
 "",
 row(["ID","Name","Tier","Reputation","Weekly pennies","Item"]),
 row(["---","---","---:","---","---:","---"]),
 ...ext.professions.sort((a,b)=>a.tier-b.tier||a.name.localeCompare(b.name)).map(p=>row([p.id,p.name,p.tier,p.stat,p.wage,p.item])),
 "",
 "The tracker lists authored content rather than asserting every branch has been human-playtested. JSON currently owns the late Moth ambition; earlier narrative modules still use JavaScript predicates and will be migrated incrementally.",
 ""
].join("\n");
const p=path.join(root,"docs/CONTENT_TRACKER.md");
if(process.argv.includes("--check")){
 if(read("docs/CONTENT_TRACKER.md")!==output){console.error("Content tracker is stale. Run node scripts/content-tracker.mjs");process.exitCode=1;}
 else console.log("Content tracker current: "+all.length+" storylets");
}else{fs.writeFileSync(p,output);console.log("Wrote "+p+" with "+all.length+" storylets");}
