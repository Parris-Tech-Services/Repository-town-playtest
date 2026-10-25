import { buildPowerInterior } from './power-interior.js';
import { buildDepotInterior } from './depot-interior.js';
import { buildWaterworksInterior } from './waterworks-interior.js';
import { buildWastewaterInterior } from './wastewater-interior.js';
import { buildRecyclingInterior } from './recycling-interior.js';
import { buildRealtyInterior } from './realty-interior.js';
import { buildWasteDepotInterior } from './waste-depot-interior.js';
import { buildJusticeInterior } from './justice-interiors.js';
import { buildFireInterior } from './fire-interior.js';
import { buildMillInterior } from './mill-interior.js';
import * as THREE from 'three';
import { containLabel } from '../ui/labels.js';
import { buildFarmhouseInterior } from './farmhouse-interior.js';
import { highStreetShell } from './interior-kit.js';
import { buildHotelInterior } from './hotel-interior.js';
import { buildBakeryInterior } from './bakery-interior.js';
import { buildBankInterior } from './bank-interior.js';
import { buildStoreInterior } from './store-interior.js';
import { buildCafeInterior } from './cafe-interior.js';
import { buildPubInterior } from './pub-interior.js';
import { buildPostInterior } from './post-interior.js';
import { buildClinicInterior } from './clinic-interior.js';
import { buildHallInterior } from './hall-interior.js';
import { buildGrocerInterior } from './grocer-interior.js';
import { buildButcherInterior } from './butcher-interior.js';
import { buildSchoolInterior } from './school-interior.js';
import { buildFarmInterior, FARM_SHED_IDS } from './farm-interior.js';
import {buildSoyInterior} from './soy-interior.js';
import { buildTradeInterior } from './trade-interiors.js';
import { buildTradeEducationInterior, TRADE_EDUCATION_INTERIORS } from './trade-education-interiors.js';

// The twenty high-street services share a safe walkable plan, with different
// fixtures, colours and exhibits. They are built only while the player is inside.
const FITTINGS = {
  hotel:['Railway Hotel','Reception desk','Guest rooms',0xc3a783,'Book a guest room','The hotel has four bookable bedrooms.'],
  hall:['Town Hall','Council desk','Town notices',0xc3b88f,'Talk to the mayor','The Town Ledger keeps track of life in the neighbourhood.'],
  store:['General Store','Shop counter','Groceries and stock',0xc0a16f,'Browse the general store','Eggs, milk, flour, tea and bread arrive from the farms and freight train.'],
  greengrocer:['Greengrocer','Produce counter','Fruit and vegetables',0x91b877,'Buy locally grown produce','Market Garden vegetables and orchard fruit are sold here.'],
  butcher:['Butcher','Butcher counter','Fresh cuts',0xb56b66,'Ask for fresh meat','Lamb comes from the town sheep station.'],
  pub:['The Merged Branch','Pub bar','Dining room',0x846c58,'Order at the bar','Enjoy a meal and a chat with the townspeople.'],
  square:['Market Square pavilion','Information stall','Community notices',0x7cad82,'Visit the market square','Take a break at the fountain or see what is happening.'],
  sheep:['Sheep Station shed','Farm office','Shearing tools',0xb9a77b,'Visit the sheep station','Merino sheep graze in the paddocks nearby.'],
  dairy:['Dairy shed','Dairy counter','Milk churns',0xc0bf9f,'See the morning milking','Milk travels from the dairy to the bakery, café and store.'],
  coop:['Chook Shed','Poultry counter','Egg baskets',0xc7b778,'Collect farm eggs','Chooks roam the yard and the keeper gathers the eggs.'],
  orchard:['Orchard shed','Fruit stall','Fruit baskets',0xb4ad7a,'Browse the harvest','Apple, orange and lemon trees grow nearby.'],
  garden:['Market Garden shed','Vegetable stall','Seed and produce boxes',0x87b873,'See the vegetables','Local vegetables are picked for shops and cafés.'],
  silo:['Wheat Farm shed','Grain desk','Grain sacks',0xc9b279,'View this harvest','Grain heads to the flour mill for baking.'],
  farmhouse:['Farmhouse kitchen','Kitchen table','Family photos',0xa59c89,'Visit the farmhouse','Farm families gather here for meals.'],
  'town-hall':['Public meeting hall','Public service desk','Town notices',0xbaaa83,'Council decisions, elections and public services','Citizens meet here to discuss the town budget and propose new projects.'],
  bank:['Banking hall','Teller counter','Account records',0x6c9fba,'Deposit and withdraw Town Credits','Money, wages and civic spending are recorded by the Community Bank.'],
  realty:['Repository Realty','Property reception','Local property records',0x527b71,'Ask for property details','Real estate agents can explain the town property directory, inspections and leasing.'],
  police:['Police station','Public station counter','Incident room',0x3e648a,'Speak to NSW Police','Reports, investigations, evidence and custody.'],
  ambulance:['Ambulance station','Call response desk','Clinical response',0xae414c,'Check ambulance services','Calls are dispatched by the emergency operations centre.'],
  court:['Local Court','Court registry','Courtroom',0x927a58,'See court lists','Magistrates hear criminal matters and bail requests.'],
  solicitor:['Solicitors','Client reception','Private consultations',0x33635a,'Enquire about legal help','Client confidentiality and independent legal advice.'],
  post:['Post office','Postal counter','Sorting shelves',0xce8e63,'Send a parcel or check deliveries','Mail is collected, sorted and delivered by the town posties.'],
  market:['Market hall','Fresh produce stall','Produce crates',0x90ad67,'Buy fresh produce','The shelves are stocked by the farm, mill and other local producers.'],
  bakery:['Bakery kitchen','Bread counter','Bakery ovens',0xdca765,'Buy fresh bread','Flour arrives from the mill. The bakery turns it into loaves each day.'],
  mill:['Flour mill','Grain intake','Flour sacks',0xcab791,'Check grain and flour','The mill grinds wheat from the farm for the bakery.'],
  clinic:['Health clinic','Reception counter','Treatment supplies',0x90c1b6,'Check clinic services','Medical staff look after residents and share practical health information.'],
  school:['School and library','Library desk','Bookshelves',0x9ab4cf,'Borrow a book','Books, lessons and community learning happen here.'],
  power:['Power station','Control desk','Generator controls',0x9b9a9a,'Check power supply','The generators supply electricity to homes, shops and industries.'],
  waterworks:['Water works','Operations desk','Water pumps',0x7fb4cf,'Check clean water','Fresh water is treated and distributed to the town.'],
  sewage:['Wastewater works','Control station','Treatment tanks',0x6caeb2,'Check wastewater treatment','Wastewater is cleaned before returning safely to the environment.'],
  depot:['Freight depot','Dispatch desk','Delivery crates',0xae9677,'Check deliveries','Lorries bring raw materials and carry goods between workplaces.'],
  recycling:['Recycling centre','Recycling desk','Sorting bins',0x75b399,'Sort reclaimed materials','Useful materials are recovered to reduce rubbish and supply workshops.'],
  landfill:['Waste depot','Weighbridge office','Waste sorting',0x98a08b,'Check waste collection','The depot handles non-recyclable waste and safe disposal.'],
  factory:['Foundry and workshop','Workshop bench','Metal parts',0xb5a09b,'Inspect manufactured goods','The workshop makes new parts from recovered and supplied materials.'],
  farm:['Farm barn','Farm stall','Harvest baskets',0x8caf60,'Buy farm produce','The farm grows wheat, vegetables and fruit, and looks after its animals.'],
  park:['Park pavilion','Visitor information','Park map',0x79b76d,'View park services','Green spaces give everyone somewhere to rest and gather.'],
  fire:['Fire station','Service desk','Rescue equipment',0xc47066,'Visit fire and rescue','The firefighters respond to emergencies and help keep the town safe.'],
  cafe:['Community café','Coffee counter','Café tables',0xbb927c,'Order at the café','Meet neighbours for a drink, a meal or a chat after walking the town.'],
  council:['Public works office','Maintenance desk','Repair plans',0x9bada7,'Report a fault','Council workers maintain roads, utilities and public buildings.'],
  realestate:['Property office','Sales and rental counter','Land titles',0xd3b88e,'Browse land titles','The estate agent handles land titles, buying, selling and rentals.'],
  dealership:['Vehicle showroom','Car sales counter','Used cars',0x98aebf,'Browse cars and trucks','A finite inventory of used cars, work utes, vans and rigid trucks.'],
  mechanic:['Motor workshop','Service reception','Hoists and tools',0x88949c,'Book a vehicle service','Servicing, roadworthy checks and fleet maintenance.'],
  securityhq:['Security headquarters','Operations desk','Patrol assignments',0x304f69,
    'Ask for the duty supervisor','Licensed private security workers patrol public shopfronts. Police handle crime and investigations.',
    ],
  securityoffice:['Security field office','Duty desk','Key and incident register',0x435c6b,
    'Check field assignments','Guards check shuttered shops and report broken doors without entering private premises.'],
  locksmith:['Locksmith workshop','Service counter','Key-cutting bench',0x9a7956,
    'Ask about lock changes','Key cutting, repairs, rekeying and replacement locks require an owner or authorised tenant.'],
};
const BASE_W=14, BASE_D=18, FRONT=6, BACK=-12, EDGE=7;

// `life` is optional: interiors that show the town's live state (the power station's mimic panel) read it.
export function buildCivicInterior(site,makeLabel,life=null) {
  // A family's home must never regress to the single-room retail fallback.
  if(site.id==='farmhouse')return buildFarmhouseInterior(site,makeLabel);
  if(['soyfarm','soyplant'].includes(site.id))return buildSoyInterior(site,makeLabel,life);
  if(TRADE_EDUCATION_INTERIORS.includes(site.id))return buildTradeEducationInterior(site,makeLabel);
  if(site.id==='hotel')return buildHotelInterior(site,makeLabel);
  if(['realestate','dealership','mechanic'].includes(site.id))return buildTradeInterior(site,makeLabel);
  const [roomTitle,deskName,featureName,accent,deskInfo,featureInfo] =
    FITTINGS[site.id] || (site.expansion
      ? [site.name,'Service reception','Workplace & displays',
          ({health:0x8bbdc6,tech:0x5d9cac,nursery:0x75ae6b,rural:0x9b9b71,
            heritage:0xb49c78,workshop:0x88979c,retail:0xc49b7c,school:0xc9a36d,
            sports:0x85aaa0,park:0x76ae8a,pool:0x73b4ca,fuel:0x9ba6b3}[site.style]||0x98a8b3),
          'Ask about '+site.name,site.description+' — This is a first-stage interior shell awaiting specialist fixture and utility design.']
      : [site.name,'Service desk','Town noticeboard',0x98a8b3,'Visit this workplace','This building supports the town.']);
  // The bakery has its own researched layout: shop floor, counter and a visible production kitchen.
  if(site.id==='depot')return buildDepotInterior(site,makeLabel);
  if(site.id==='waterworks')return buildWaterworksInterior(site,makeLabel,life);
  if(site.id==='sewage')return buildWastewaterInterior(site,makeLabel,life);
  if(site.id==='recycling')return buildRecyclingInterior(site,makeLabel,life);
  if(site.id==='realty')return buildRealtyInterior(site,makeLabel,life);
  if(site.id==='landfill')return buildWasteDepotInterior(site,makeLabel,life);
  if(['police','ambulance','court','solicitor'].includes(site.id))return buildJusticeInterior(site,makeLabel,life);
  if(site.id==='mill')return buildMillInterior(site,makeLabel,roomTitle);
  if(site.id==='bakery')return buildBakeryInterior(site,makeLabel,roomTitle);
  // The bank: queue lane, tellers at the back, advice desks, private office, ATMs, vault.
  if(site.id==='bank')return buildBankInterior(site,makeLabel,roomTitle);
  if(site.id==='store')return buildStoreInterior(site,makeLabel,roomTitle);
  if(site.id==='cafe')return buildCafeInterior(site,makeLabel,roomTitle);
  if(site.id==='pub')return buildPubInterior(site,makeLabel,roomTitle);
  if(site.id==='post')return buildPostInterior(site,makeLabel,roomTitle);
  if(site.id==='clinic')return buildClinicInterior(site,makeLabel,roomTitle);
  if(site.id==='hall')return buildHallInterior(site,makeLabel,roomTitle);
  if(site.id==='greengrocer')return buildGrocerInterior(site,makeLabel,roomTitle);
  if(site.id==='butcher')return buildButcherInterior(site,makeLabel,roomTitle);
  if(site.id==='school')return buildSchoolInterior(site,makeLabel,roomTitle);
  if(site.id==='fire')return buildFireInterior(site,makeLabel,roomTitle);
  if(site.id==='power')return buildPowerInterior(site,makeLabel,roomTitle,life);
  if(FARM_SHED_IDS.includes(site.id))return buildFarmInterior(site,makeLabel,roomTitle);
  const group=new THREE.Group();
  group.name='Inside '+site.name;
  const colliders=[],interactables=[],sceneObjects=[],placedProps=[];
  const light = new THREE.HemisphereLight(0xffffff,0x665a4a,2.1); group.add(light);
  const materials=new Map();
  const mat=(colour)=>{if(!materials.has(colour))materials.set(colour,new THREE.MeshLambertMaterial({color:colour}));return materials.get(colour);};
  const box=(w,h,d,x,y,z,colour)=>{
    const m=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat(colour));
    m.position.set(x,y,z);group.add(m);return m;
  };
  const solid=(w,h,d,x,y,z,colour)=>{
    box(w,h,d,x,y,z,colour);
    colliders.push({x0:x-w/2,x1:x+w/2,z0:z-d/2,z1:z+d/2});
  };
  box(BASE_W,0.24,BASE_D,0,-0.12,-3,0xb9a88f);
  box(BASE_W,0.27,BASE_D,0,4.7,-3,0x615d56);
  // The shared High Street shell: a real door gap (no collider across it, a low decorative
  // sill), display windows onto the street and a window in each side wall.
  const shell=highStreetShell({box,solid,wall:0xc3b6a4,frontSill:0.6,sideSill:0.9});
  group.add(shell.glass);
  box(BASE_W-0.5,0.16,0.5,0,3.65,BACK+0.5,accent);
  // A facing counter, with 3m clearance down the central entrance aisle.
  solid(8,1.2,1.2,0,0.6,-6.4,0x735844);
  box(7.7,0.15,1.35,0,1.25,-6.4,accent);
  // Side shelves and displays are inside their room, never inside doorway.
  for(const sx of [-5.4,5.4]){
    solid(1.5,2.3,3.0,sx,1.15,-7.9,0x625c54);
    for(const z of [-8.8,-7.8,-6.8]){
      box(1.34,0.13,0.65,sx,1.2,z,0xd1bc8f);
      for(const dx of [-0.35,0.35]) box(0.35,0.65,0.4,sx+dx,1.58,z,accent);
    }
  }
  for(const x of [-3.6,3.6]){
    box(1.0,0.7,1.0,x,0.35,-10.3,0x876b4d);
    box(0.8,0.45,0.8,x,0.92,-10.3,accent);
  }
  // Fixture identity cues (lamps, noticeboards, produce / shelves).
  for(const x of [-4.7,0,4.7]) {
    const fixture=box(1.25,0.13,0.75,x,4.42,-3.8,0xffe4a5);
    fixture.material=new THREE.MeshLambertMaterial({color:0xffe1a8,emissive:0xffce7a,emissiveIntensity:0.4});
  }
  const text=(label,x,y,z,kind='interactive')=>{
    const sprite=makeLabel(label,kind);
    sprite.position.set(x,y,z);
    sprite.userData.labelKind=kind;
    containLabel(sprite,{x0:-EDGE,x1:EDGE,z0:BACK,z1:FRONT,y0:0,y1:4.6});
    group.add(sprite);
  };
  text(site.name,0,3.15,-6.12,'room');
  text(deskName,0,1.95,-5.65);
  text(featureName,-4.75,2.75,-3.45);
  text('Town notices',4.75,2.75,-3.45);
  const add=(key,label,doWhat,body,x,z)=>{
    const pos=new THREE.Vector3(x,0,z);
    interactables.push({key:site.id+':'+key,type:'civic',label,room:0,roomName:roomTitle,pos,
      act:{do:doWhat,title:label,text:body,civicId:site.id}});
    sceneObjects.push({type:'civic',label,room:0,pos:{x,z},interactive:true});
  };
  add('counter',deskName,'civic-ledger',deskInfo,0,-4.9);
  add('display',featureName,'info',featureInfo,-4.7,-3.45);
  add('notices','Town noticeboard','info','Ask the staff about '+site.name+'. Visit the service counter to open the Town Ledger.',4.7,-3.45);
  placedProps.push({type:'counter',room:0},{type:'shelves',room:0},{type:'noticeboard',room:0});
  const rooms=[{name:roomTitle,x0:-EDGE,x1:EDGE,z0:BACK,z1:FRONT,w:BASE_W,d:BASE_D,parent:-1}];
  return {
    group,colliders,interactables,sceneObjects,placedProps,rooms,
    windows:shell.windows,
    doors:[],dynamics:[],sight:[],
    bounds:{x0:-EDGE,x1:EDGE,z0:BACK,z1:FRONT},
    spawn:new THREE.Vector3(0,0,FRONT-2.25),
    exitZone:{x0:-1.05,x1:1.05,z0:FRONT-0.1,z1:FRONT+1.2}
  };
}

export const CIVIC_INTERIOR_IDS=Object.freeze(Object.keys(FITTINGS));
