#!/usr/bin/env node
/** Convert three versioned later main ambitions into their browser JS runtime. */
import {readFileSync,writeFileSync} from "node:fs";
const input=new URL("../content/storylets/ambitions/late-main.v1.json",import.meta.url);
const out=new URL("../content/late-ambitions.js",import.meta.url);
const data=JSON.parse(readFileSync(input,"utf8"));
if(data.schema_version!==1||data.content_type!=="ambition-main-collection"||data.chapters?.length!==72)
 throw Error("Expected 72 late main chapters in schema v1");
const code="// Generated from content/storylets/ambitions/late-main.v1.json. Do not edit directly.\n"+
'(function(){\n"use strict";\nconst e=window.UndercityExpansions ||= {stories:[],cards:[],items:{},professions:[],destinies:[]};\n'+
'const raw='+JSON.stringify(data.chapters)+';\n'+
'for(const st of raw){\n'+
'const choices=st.choices.map(c=>{const {requirement_flag,requirement_extra,...rest}=c;return {...rest,when:requirement_flag?'+
'(s=>Boolean(s.flags?.[requirement_flag])):requirement_extra?'+
'(s=>Object.entries(requirement_extra).every(([k,v])=>(s.extras?.[k]||0)>=v)):null};});\n'+
'e.stories.push({id:st.id,title:st.title,description:st.description,where:st.where,category:"ambition",once:true,chapter:st.progress+1,next_storylet:st.next_storylet,'+
'when:s=>s.path===st.unlock.path&&s.pathProgress===st.unlock.ambition_progress,choices});\n'+
'}\n})();\n';
if(process.argv.includes("--check")){
 if(readFileSync(out,"utf8")!==code){console.error("Late ambition browser bundle is stale. Run node scripts/build-late-main.mjs");process.exitCode=1;}
 else console.log("Compiled main ambitions current: "+data.chapters.length+" late chapters");
}else{writeFileSync(out,code);console.log("Wrote "+data.chapters.length+" late ambition chapters");}
