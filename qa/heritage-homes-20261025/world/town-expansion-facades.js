// Typed, low-poly 2026 infill shopfronts. Facades face local +Z;
// townlife places and rotates them to face existing roads from north-side plots.
// Geometry is phase-one massing, NOT a completed NCC, petrol, clinical or childcare approval.
import { GLASS } from './builder.js';
const styles=Object.freeze({
 heritage:[0xbb8d72,0x755340,0x7e3c31],
 civic:[0xc8bda7,0x546873,0x334d60],
 health:[0xdce2e0,0x508b9c,0x35687e],
 tech:[0x536476,0x25344a,0x60c5c8],
 retail:[0xcbb597,0x7b5946,0x6f9a9c],
 nursery:[0x879a72,0x376a45,0x8db77b],
 rural:[0xb6a58a,0x65756b,0x45664c],
 workshop:[0x9ba6ae,0x485665,0x3f6170],
 sports:[0xb2b99c,0x2b6467,0x5d9c81],
 school:[0xe1bc8e,0x8d6b5b,0xc08a57],
 park:[0xc7cfbc,0x4c8565,0x72a36f],
 pool:[0xe0e7e4,0x347d9b,0x68b7cf],
 fuel:[0xece7d8,0x2e5378,0xd34b40],
 carwash:[0xe1e7e8,0x487c94,0x67b2cc],
});
export function expansionFootprint(style){
  return Object.freeze({w:style==='fuel'?13:style==='nursery'?13:style==='park'?10:12,
    d:style==='park'?7:style==='fuel'?11:9});
}
export function buildExpansionFacade(b,site){
 const pal=styles[site.style]||styles.retail;
 const [wall,trim,accent]=pal,{w,d}=expansionFootprint(site.style);
 const h=site.style==='heritage'?5.1:site.style==='rural'?5:4.2;
 const face=7,centre=face-d/2;
 if(site.style==='park'||site.style==='nursery'){
   b.box(0xa7a58b,w,.09,d,0,.04,centre);
   b.box(wall,5,2.9,3.3,0,1.45,face-2.6);
   b.box(trim,5.45,.16,3.65,0,3,face-2.6);
   b.box(0x3e3830,1.35,2.25,.07,0,1.2,face-.88);
   for(const x of [-4,-2,2,4])for(const z of [1.4,3.4]){
     b.cyl(0x8e704b,.42,.35,x,.18,z);
     b.ball(accent,.56,x,.9,z);
   }
   if(site.style==='park'){
     b.box(0xb8c2b5,1.2,1.9,1.3,-2,1,4.8);
     b.box(0xd8d0bf,1.1,.16,1.4,2,1.4,3.6);
     b.box(0x4b866b,.15,2.1,.15,3,1.2,2.8);
   }
   return {w,d,front:7};
 }
 if(site.style==='fuel'){
   b.box(0x565f60,12,.07,10.8,0,.03,1.5);
   b.box(wall,7,3.6,4.2,0,1.8,1);
   b.box(trim,7.4,.28,4.5,0,3.76,1);
   b.box(trim,12.4,.34,4.5,0,4.2,5.15);
   for(const x of [-5.4,5.4])for(const z of [3.1,6.9])b.cyl(0x747b84,.12,4.0,x,2,z);
   for(const x of [-2.7,2.7]){b.box(0xe1e4e4,.72,1.25,.7,x,.75,5.8);b.box(accent,.65,.25,.72,x,1.42,5.8);}
   b.box(GLASS,4.2,1.8,.08,0,2.05,3.13);
   return {w,d,front:7};
 }
 if(site.style==='carwash'){
   b.box(0x5e6670,w,.08,d,0,.04,centre);
   for(const x of [-3.5,3.5]){
     for(const sx of [-1.6,1.6])b.box(trim,.22,3.5,.5,x+sx,1.75,2.4);
     b.box(accent,3.55,.36,5.1,x,3.65,3.4);
     b.box(GLASS,2.1,1.2,.06,x,2,2.8);
   }
   return {w,d,front:7};
 }
 if(site.style==='sports'){
   b.box(0x6b8979,w,.07,d,0,.035,centre);
   b.box(wall,9,3.7,4.3,0,1.85,1.0);
   b.box(trim,9.4,.3,4.5,0,3.85,1);
   b.box(accent,w,.07,.14,0,.09,6.5);
   for(const x of [-3.8,3.8])b.box(GLASS,1.7,1.3,.08,x,2,3.2);
   return {w,d,front:7};
 }
 // Consistent realistic parapet and window bays; varied wall, roof and signage per industry.
 b.box(wall,w,h,d,0,h/2,centre);
 b.box(trim,w+.5,.38,d+.4,0,h+.14,centre);
 b.box(accent,w+.6,.8,.43,0,h-.05,face-.15); // name fascia above shop front
 if(site.style==='rural'||site.style==='workshop'){
   b.box(0x58616b,4.1,3.1,.09,-3,1.55,face+.04);
   for(let y=.55;y<2.9;y+=.6)b.box(0xbfc5c9,4.07,.045,.1,-3,y,face+.1);
   b.box(GLASS,3.2,1.8,.08,3,2.2,face+.07);
 }else{
   for(const x of [-4,4]){
     b.box(GLASS,2.65,2.4,.08,x,2.07,face+.065);
     b.box(trim,.12,2.5,.10,x,2.1,face+.12);
     b.box(trim,2.76,.1,.1,x,.85,face+.12);
   }
   b.box(GLASS,1.75,2.9,.09,0,1.5,face+.10);
   b.box(trim,.12,.4,.14,.7,1.5,face+.2);
 }
 if(site.style==='tech')for(const x of [-4,4])b.box(0x2e6073,1.5,.65,.1,x,2.5,face+.19);
 if(site.style==='health')b.box(0x4e9688,.62,.62,.10,-5.3,3.6,face+.21);
 if(site.style==='school')for(const x of [-5,5])b.box(0x7b977c,.12,2.0,.12,x,1,face+1.6);
 if(site.style==='pool')b.box(0x4d9cbd,4,.14,1.3,0,.1,face+1.6);
 return {w,d,front:7};
}
