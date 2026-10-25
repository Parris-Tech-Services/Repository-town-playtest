import { createKit } from './interior-kit.js';

// A shared collision-tested building envelope with four DISTINCT layouts.
// Each showroom, classroom and workshop uses a central pedestrian aisle.
export const TRADE_EDUCATION_INTERIORS=Object.freeze(['hardware','trades','tafe','university']);
export function buildTradeEducationInterior(site,makeLabel){
 const k=createKit(site,makeLabel,site.name),{box,solid,cyl,ball,seat,add,model,text}=k;
 const WOOD=0x9e7957,STEEL=0x6c7a86,WHITE=0xeee9db,BROWN=0x60482e;
 if(site.id==='hardware'){
   k.shell({wall:0xd7c2a3,ceiling:0xddd3bd,floor:0x9e9e92});
   // Front service bench and stockroom at the rear. Central two-metre aisle.
   solid(4.2,1.0,.85,3.7,.5,-6.45,BROWN);
   box(1.5,.06,.72,4.8,1.08,-6.45,0xc5b6a1);
   add('trade-counter','Buy and collect building materials','civic-ledger',
     'Itemised stock, finite inventory, point-of-sale receipts and special-order repairs.',3.6,-5.25);
   for(const x of [-5.2,-3.3,3.3,5.2]){
     for(const z of [-7.6,-4.4,-1.2]){
       solid(.85,2.3,1.25,x,1.15,z,STEEL);
       for(const y of [.7,1.35,2.0]){
         box(.7,.15,1.0,x,y,z,0xb6a37b);
         for(const off of [-.31,.31])box(.18,.22,.62,x+off,y+.16,z,Math.abs(x)>4?0x5e8e9d:0xc7a46d);
       }
     }
   }
   for(const x of [-4.6,4.6]){solid(1.6,.75,.8,x,.37,3.35,0xb5a17f);box(1.5,.1,.7,x,.84,3.35,0xf6e4ad);}
   text('Timber · Plumbing · Electrical · Tools',0,3.7,-8.9,'room');
   add('paint','Paint mixing desk','info','Paint and coatings have finite stock, invoices and safe handling instructions.',-4.3,1.5);
   add('special-orders','Goods receiving','info','Foundry parts, reclaimed metal and rail freight feed the warehouse. Stock cannot appear from nothing.',4.5,-7.8);
 }else if(site.id==='trades'){
   k.shell({wall:0xabb8c1,ceiling:0xcbd4db,floor:0x7b858c});
   // 2 enclosed storage bays and clear work access through centre.
   for(const x of [-4.5,4.5]){
     solid(2.9,.8,2.1,x,.4,-6.25,STEEL);
     for(let i=0;i<3;i++)box(1.4,.1,.45,x,1.4+i*.36,-7.3,WOOD);
     box(2.6,2.6,.12,x,1.3,-10.7,0x3a5268);
     k.seat?.('tool-rest-'+x,'stool',x+1.35,-2.1,Math.PI/2);
   }
   solid(3.7,1.0,.8,3.6,.5,1.4,0x506a7b);
   add('jobs','Trades booking and repair board','civic-ledger',
     'Fault report, safety inspection, itemised quote, signed acceptance, parts, licensed work and sign-off.',2.8,2.6);
   for(const x of [-5.1,5.1]){
     box(1.2,1.2,.08,x,2.45,-5.7,0xe8c26f);
     for(let i=0;i<3;i++)box(.7,.12,.06,x,2.1+i*.29,-5.6,0x313739);
   }
   text('Licences checked before restricted work',0,3.55,-9.7,'room');
   add('electrical','Electrical bay','info','A licensed electrician supervises apprentices; electrical isolation and testing precede energisation.',-4.3,-4.3);
   add('plumbing','Plumbing bench','info','Restricted plumbing and drainage categories require correct credentials, tests and licensed sign-off.',4.4,-4.5);
   add('builder','Builder and carpentry supplies','info','Risk assessment, structural inspection, drawings and permitted building work are documented.',-4.3,0.8);
 }else if(site.id==='tafe'){
   k.shell({wall:0xe1d2bc,ceiling:0xf4e9d5,floor:0xafa08d});
   // Two practical training bays; apprentice workspace, safety benches and classroom.
   for(const x of [-4.65,4.65]){
     solid(2.55,.85,1.15,x,.42,-4.35,0x6a7a88);
     box(2.45,.1,1.0,x,.9,-4.35,WOOD);
     for(const z of [-8.2,-6.8]){
       box(2.4,1.0,.08,x,2.05,z,x<0?0x3a6b96:0x4f836e);
       for(const dx of [-.85,.85])cyl(.04,.04,.8,x+dx,1.45,z,0xbcb8ae,{},6);
     }
   }
   // Classroom desks kept well off central access lane.
   for(const [x,z] of [[-4,1],[-4,3],[4,1],[4,3]]){
     solid(1.45,.7,.8,x,.35,z,0xa18565);
     seat('student-'+x+'-'+z,'chair',x,z+1.15,Math.PI);
     model('chair_B_wood',x,z+1.15,0,{w:.5,d:.5,h:.9});
   }
   box(4.6,1.7,.08,0,2.55,-10.7,0x2b574b);
   text('Work safely · Workshop inductions · Training plans',0,3.55,-10.3,'room');
   add('enrol','TAFE course admissions','civic-ledger',
     'Certificate I-IV, Diploma and Advanced Diploma. Training plans, supervised placements, assessed competency and prerequisites.',0,-4.0);
   add('sparky-bay','Electrotechnology training bay','info','A simulated de-energised training bench, safety isolation, test instruments and supervised practical skills.',-4.5,-2.7);
   add('plumbing-bay','Plumbing training bay','info','Drainage grades, copper joins, fixtures, wet-area testing and licensed on-the-job supervision.',4.5,-2.7);
   add('assessment','Skills assessment desk','info','Students earn assessment credits over simulated days. Completing a qualification is not the same as holding a NSW contractor licence.',-3.1,4.5);
 }else if(site.id==='university'){
   k.shell({wall:0xdde3e8,ceiling:0xe9eef1,floor:0x9cb2ba});
   // Research desks, seminar area and computing labs.
   for(const x of [-4.2,4.2]){
     for(const z of [-7.3,-4.7,-2.1]){
       solid(2.1,.78,.92,x,.39,z,0x6e8594);
       box(1.25,.82,.06,x,1.32,z-.2,0x202a35);
       box(.8,.08,.36,x,.82,z+.2,0xc7d0d9);
       seat('computer-'+x+'-'+z,'chair',x,z+1.1,Math.PI);
     }
   }
   for(const x of [-3.0,3.0]){solid(2.2,.76,1.0,x,.38,2.5,WOOD);for(const dx of [-.75,.75])seat('seminar-'+x+'-'+dx,'chair',x+dx,3.7,Math.PI);}
   box(4.6,2,.08,0,2.15,-10.7,0x42647d);
   text('Regional research · Tutorials · Library access',0,3.52,-10.4,'room');
   add('admissions','University admissions and degrees','civic-ledger',
     'AQF Bachelor level 7 through Doctoral level 10, formal admission, coursework, academic research and supervised assessment.',0,-3.7);
   add('library','Scholarly library and databases','info','Books, journals, research methods, scholarly integrity and supervised thesis projects.',-3.9,4.5);
   add('engineering','Engineering research lab','info','Structural analysis, town water modelling, energy systems and empirical data for the dissertation.',4.1,4.5);
 }
 return k.finish({staff:{pos:{x:1.1,z:-9.1},use:{x:1.1,z:-6.8}}});
}
