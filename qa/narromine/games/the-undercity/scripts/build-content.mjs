#!/usr/bin/env node
// Build browser-compatible storylet JS from canonical versioned JSON.
// Run: node scripts/build-content.mjs [--check]
import {readFileSync,writeFileSync} from "node:fs";
import {fileURLToPath} from "node:url";
import path from "node:path";
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const input=path.join(root,"content/storylets/ambitions/moth.json");
const output=path.join(root,"content/moth.generated.js");
const spec=JSON.parse(readFileSync(input,"utf8"));
if(spec.schema_version!==1)throw Error("Unsupported storylet schema version");
if(!Array.isArray(spec.chapters)||spec.chapters.length<1)throw Error("No chapters to build");
const banner="// Generated from content/storylets/ambitions/moth.json. Do not edit directly.\n";
const code=banner+'(function(){\n"use strict";\nconst e=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};\n'+
'const raw='+JSON.stringify(spec.chapters)+';\n'+
'for(const st of raw){\n'+
' const choices=st.choices.map(c=>({...c,when:c.requirement?function(s){return Object.entries(c.requirement).every(([k,v])=>s[k]===v)}:null}));\n'+
' e.stories.push({id:st.id,title:st.title,description:st.description,where:st.where,category:"ambition",once:true,chapter:st.progress+1,next_storylet:st.next_storylet,\n'+
'  when:s=>s.path===st.unlock.path&&s.pathProgress===st.unlock.ambition_progress,choices});\n'+
'}\n})();\n';
if(process.argv.includes("--check")){
 if(readFileSync(output,"utf8")!==code){console.error("Generated storylet bundle is stale. Run node scripts/build-content.mjs");process.exitCode=1;}
 else console.log("Generated bundle matches canonical JSON ("+spec.chapters.length+" chapters)");
}else{writeFileSync(output,code);console.log("Generated "+spec.chapters.length+" chapters in "+path.relative(root,output));}
