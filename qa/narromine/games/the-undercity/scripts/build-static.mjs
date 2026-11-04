// Publish the playable game only, excluding drafts, spoiler ledgers and tooling.
import {readFile,mkdir,writeFile,copyFile,rm,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
const html=await readFile(path.join(root,'index.html'),'utf8');
const files=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["']/g)].map(m=>m[1].split('?')[0]);
files.push(...[...html.matchAll(/<link\b[^>]*\bhref=["']([^"']+\.css(?:\?[^"']*)?)["']/g)].map(m=>m[1].split('?')[0]));
for(const file of files){
 const full=path.resolve(root,file);
 if(!file.startsWith('./')||!full.startsWith(root)||!(/\.(js|css)$/.test(file)))throw Error('Unexpected runtime asset: '+file);
 await readFile(full);
}
await rm(out,{recursive:true,force:true});
await mkdir(out,{recursive:true});
await writeFile(path.join(out,'index.html'),html);
for(const file of files){const target=path.resolve(out,file);await mkdir(path.dirname(target),{recursive:true});await copyFile(path.resolve(root,file),target);}
await cp(path.join(root,'assets/art'),path.join(out,'assets/art'),{recursive:true});
await writeFile(path.join(out,'release.json'),JSON.stringify({commit:process.env.RENDER_GIT_COMMIT??'local',builtAt:new Date().toISOString(),assets:files},null,2));
console.log(`Static release: index.html, ${files.length} runtime scripts and release.json`);
