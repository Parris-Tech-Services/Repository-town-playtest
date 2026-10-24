import {occupationPanel} from './ui/occupation-panels.js';
import {installWorkplay} from './world/workplay-view.js';
import { mountCompanion } from './ui/companion.js';
import { isHudBlocked } from './ui/hud-visibility.js';
import * as THREE from 'three';
import { CollisionWorld } from './engine/collision.js';
import { Input } from './engine/input.js';
import { Player } from './engine/player.js';
import { loadSave, writeSave, clearSave } from './engine/save.js';
import { discoveryProgress } from './ui/discovery-log.js';
import { buildTown, streetSigns, lotPosition } from './world/town.js';
import { houseAddress, parseTownAddress } from './world/addresses.js';
import { buildInterior, labelVisible } from './world/interior.js';
import { honourPaulRoe } from './world/paul-roe-tribute.js';
import { buildCivicInterior } from './world/shop-interior.js';
import { installPhysicalJobs, usePhysicalJob } from './world/physical-jobs.js';
import { wasteDepotPanel } from './ui/waste-depot-panel.js';
import { surfaceAt, roomFloor } from './world/surfaces.js';
import { FIELD_Z0 } from './world/life.js';
import { emergencyPanel,justicePanel } from './ui/emergency-panels.js';
import { civicExitPose } from './world/shop-exit.js';
import { populateShopStaff } from './world/shop-staff.js';
import { facilityAccess, restrictedServiceAction } from './world/facility-access.js';
import { atCivicEntrance, closedCivicDoorPose } from './world/civic-entrance.js';
import { createShopVisitors } from './world/shop-visitors.js';
import { loadFurniture } from './world/furniture.js';
import { createFloorStack, FLOOR_HEIGHT } from './world/multifloor.js';
import { townView } from './world/windows.js';
import { animate } from './world/builder.js';
import { makeLabel, disposeLabel } from './ui/labels.js';
import { focusInteriorLabels, showNearbyHouseLabel } from './ui/context-labels.js';
import { runInteraction, esc } from './ui/interactions.js';
import { setArchiveLoader } from './ui/archive.js';
import { npcBehaviour } from './ui/npc.js';
import { sceneFromRoom } from './ui/scene-awareness.js';
import { mountNPCChat } from './ui/npc-chat.js';
import { mountTownYarns } from './ui/yarns.js';
import { makePerson, Walker, houseWander, freeSpot, placeTownNPCs, animateNPCs, initialiseNPCWorksites } from './world/npcs.js';
import { separatePedestrians, steerPedestrians } from './world/pedestrian-spacing.js';
import { createTownLife } from './world/townlife.js';
import { createEmergencyResponseVisuals } from './world/emergency-response-visuals.js';
import { createPlayerDriving } from './world/player-driving.js';
import { nearestSeat } from './world/seats.js';
import { furniturePanel } from './ui/furniture.js';
import { createAmbience } from './ui/ambience.js';
import { bakeryKitchenPanel } from './ui/bakery-panel.js';
import { superviseBread } from './world/bakery-production.js';
import { installBakeryImmersion } from './world/bakery-immersive.js';
import { walletPanel, jobBoardPanel } from './ui/economy-panels.js';
import { placePanel, ledgerPanel, guidePanel, needsPanel, relicsLeft, townContext, householdPanel } from './ui/townpanels.js';
import { openingHoursPanel } from './ui/shop-hours-panel.js';
import { createSleepSession, sleepChoices } from './world/needs.js';
import { createExpedition } from './adventure/expedition.js';

const $ = (id) => document.getElementById(id);
const status = (t) => { $('status').textContent = t; };
const fail = (e) => { $('loading').hidden = false; $('loading').classList.add('error'); $('loading-text').textContent = 'Could not start: ' + (e?.message || e); console.error(e); };
addEventListener('error', (e) => fail(e.error || e.message));
addEventListener('unhandledrejection', (e) => fail(e.reason));

const SKY = 0x96c9f0, INDOOR = 0x1a1612;

async function start() {
  // The standalone single-file build embeds the data so it runs from file:// with no server.
  const data = window.__HOUSES__ || await (await fetch('houses.json')).json();
  // Archive contents (READMEs, file lists) are large, so they load on first use.
  let archive = null;
  setArchiveLoader(() => (archive = archive || (window.__REPO_DATA__ ? Promise.resolve(window.__REPO_DATA__) : fetch('repo-data.json').then((r) => (r.ok ? r.json() : {})).catch(() => ({})))));
  const houses = data.houses.map(honourPaulRoe).map(h => ({ ...h, address: houseAddress(h.coordinate) }));
  const byCoord = new Map(houses.map((h) => [h.coordinate, h]));

  const touch = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !touch, powerPreference: 'high-performance' });
  const preferredPixelRatio = Math.min(devicePixelRatio, touch ? 1 : 1.5);
  let renderPixelRatio = Math.min(preferredPixelRatio, touch ? 1 : 1.15);
  renderer.setPixelRatio(renderPixelRatio);
  renderer.setSize(innerWidth, innerHeight);
  renderer.domElement.id = 'scene';
  document.body.prepend(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); status('Graphics paused by the device. Reload to continue.'); });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  const fog = new THREE.Fog(SKY, 60, 170);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.15, 185);
  // Camera-space 3D hands/trays are rendered in the same scene as the shop.
  scene.add(camera);
  const sky = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6e856e, 2.1); sky.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7bf, 2.0); sun.position.set(-70, 110, 55); sky.add(sun);
  scene.add(sky);

  const town = buildTown(scene, houses, data.streets);
  // Indoors, the town is drawn first from the matching spot in the street, then the rooms on
  // top; it shows through the windows (and the open front door) and nowhere else.
  const outdoorCam = camera.clone(), roomBackground = scene.background;
  const frustum = new THREE.Frustum(), viewProj = new THREE.Matrix4();
  // Openings that show the town: each window, and the front door on the ground floor.
  function lookouts(level) {
    const y = level.group.position.y, boxes = (level.windows || []).map((w) => w.axis === 'z'
      ? new THREE.Box3(new THREE.Vector3(w.s, y + 0.4, w.at - 0.3), new THREE.Vector3(w.e, y + 3.4, w.at + 0.3))
      : new THREE.Box3(new THREE.Vector3(w.at - 0.3, y + 0.4, w.s), new THREE.Vector3(w.at + 0.3, y + 3.4, w.e)));
    const ex = level.exitZone;
    if (ex && !y) boxes.push(new THREE.Box3(new THREE.Vector3(ex.x0, 0, ex.z0 - 0.4), new THREE.Vector3(ex.x1, 2.6, ex.z0 + 0.4)));
    return boxes;
  }
  function renderFrame() {
    if (mode !== 'house' || !inside?.view) { renderer.render(scene, camera); return; }
    camera.updateMatrixWorld();
    // Drawing the town costs as much as being outdoors, so only when a window is in view.
    inside.lookouts ||= lookouts(inside);
    frustum.setFromProjectionMatrix(viewProj.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse));
    if (!inside.lookouts.some((b) => frustum.intersectsBox(b))) { renderer.render(scene, camera); return; }
    inside.view.place(camera, outdoorCam);
    outdoorCam.projectionMatrix.copy(camera.projectionMatrix); outdoorCam.projectionMatrixInverse.copy(camera.projectionMatrixInverse);
    // The building's own outside walls and shopfront would block the view from its own windows.
    const own = inside.ownMeshes || [], ownShown = own.map((m) => m.visible);
    own.forEach((m) => { m.visible = false; });
    inside.group.visible = false; town.group.visible = true;
    scene.background = townLife.skyColour; scene.fog = fog;
    renderer.render(scene, outdoorCam);
    inside.group.visible = true; town.group.visible = false;
    const sky = townLife.skyParts.map((o) => o.visible); townLife.skyParts.forEach((o) => { o.visible = false; });
    scene.background = null; scene.fog = null;
    renderer.autoClear = false; renderer.clearDepth(); renderer.render(scene, camera); renderer.autoClear = true;
    townLife.skyParts.forEach((o, i) => { o.visible = sky[i]; });
    scene.background = roomBackground;
    own.forEach((m, i) => { m.visible = ownShown[i]; });
  }
  // Town life: farms, shops, trucks and 32 villagers with jobs and meals (src/world/life.js).
  const townLife = createTownLife({ scene, town, makeLabel, sky, hemi, sun, fog });
  const life = townLife.life;
  const emergencyVisuals = createEmergencyResponseVisuals(life, town);
  // The Town Guide kiosk by the start (src/world/town.js) opens the guide panel.
  const guideSpot = { key: 'guide', pos: town.guidePos, label: '🗺️ Read the Town Guide', guide: true };
  // Named street characters (src/ui/npc-data.js) with their own AI chat window.
  const streetNPCs = placeTownNPCs(town.group, town.lots, makeLabel);
  initialiseNPCWorksites(streetNPCs, town.group);
  let nearPerson = null, nearNPC = null, nearTownSeat = null;
  const ambience = createAmbience();
  const wake = () => ambience.start();
  addEventListener('pointerdown', wake); addEventListener('keydown', wake);
  // Smooth mode draws less of the distance; phones start with it on.
  let lowPerf = touch;
  streetSigns(town.group, data.streets, makeLabel);
  const half = { x: town.bounds.width / 2, z: town.bounds.depth / 2 };
  const edges = [
    { x0: -half.x - 5, x1: half.x + 5, z0: -half.z - 5, z1: -half.z }, { x0: -half.x - 5, x1: half.x + 5, z0: half.z, z1: half.z + 5 },
    { x0: -half.x - 5, x1: -half.x, z0: -half.z, z1: half.z }, { x0: half.x, x1: half.x + 5, z0: -half.z, z1: half.z },
  ];
  const townWorld = new CollisionWorld([...town.colliders, ...townLife.colliders, ...edges]);
  // Dynamic vehicle footprints block player motion as well as truck movement.
  // A vehicle is approx 2.2m wide and 6.6m long; use a conservative
  // rotated-axis AABB for the town's existing 2D collision engine.
  townWorld.dynamic = () => life.trucks.map(tr => {
    const sn = Math.abs(Math.sin(tr.heading)), cs = Math.abs(Math.cos(tr.heading));
    const hx = 1.18*cs + 3.4*sn, hz = 1.18*sn + 3.4*cs;
    return {x0:tr.x-hx,x1:tr.x+hx,z0:tr.z-hz,z1:tr.z+hz};
  });

  const input = new Input(renderer.domElement, $('touch'));
  const captureButton = $('btn-capture');
  captureButton.hidden = input.touch || typeof renderer.domElement.requestPointerLock !== 'function';
  const syncMouseCapture = (captured) => {
    captureButton.setAttribute('aria-pressed', String(captured));
    captureButton.textContent = captured ? '🔓 Mouse captured (Esc)' : '🎯 Capture mouse';
    captureButton.title = captured ? 'Press Esc or L to release the mouse' : 'Capture the mouse to look without holding the button (L)';
  };
  input.onCaptureChange = (captured) => {
    syncMouseCapture(captured);
    status(captured ? 'Mouse captured — move to look freely. Esc or L releases it.' : 'Mouse released — select Capture mouse or press L to resume.');
  };
  input.onCaptureError = () => status('Browser could not capture the mouse. Try clicking Capture mouse again.');
  captureButton.onclick = () => { captureButton.blur(); input.toggleMouseCapture(); };
  syncMouseCapture(false);
  if (input.touch) $('touch').hidden = false;
  loadFurniture().catch(() => {});   // real furniture models; interiors fall back to boxes until they arrive
  const player = new Player(camera);
  const driving=createPlayerDriving(life,scene,townWorld,player,camera,input);
  const tableOrder = document.createElement('button');
  tableOrder.id='btn-table-order';tableOrder.type='button';
  tableOrder.textContent='🍽 Order at table';
  tableOrder.hidden=true;tableOrder.title='Order food or drinks without leaving your seat';
  $('needs-strip').append(tableOrder);
  tableOrder.onclick=()=>{
    if(player.seated && inside?.place && ['cafe','pub'].includes(inside.place.id))
      openPanel(placePanel(life,inside.place.id));
  };
  $('btn-needs').onclick = () => openPanel(needsPanel(life));
  let floorDoorCooldown = 0;
  const floorBadge = document.createElement('button');
  floorBadge.id = 'floor-indicator'; floorBadge.type = 'button';
  floorBadge.title = 'Open the lift floor selector';
  floorBadge.setAttribute('aria-label', 'Choose a building floor');
  floorBadge.onclick = () => { if (inside?.floors) openLift(); };
  floorBadge.hidden = true; document.body.append(floorBadge);
  const npcChat = mountNPCChat(document);
  let interactionRequest = 0;

  let mode = 'town', inside = null, world = townWorld, overview = false;
  const yarns=mountTownYarns({life,player,onOpen:()=>{input.releaseMouse();input.reset();npcChat.close();$('npc-roster').hidden=true;if(panelOpen)closePanel();}});
  const active = new Set();
  const visited = new Set();
  function syncDiscoveryCount() {
    const { found, total } = discoveryProgress(houses, visited);
    $('discovery-count').textContent = found + '/' + total;
    $('btn-discoveries').setAttribute('aria-label', 'Explorer\'s Log, ' + found + ' of ' + total + ' houses discovered');
  }
  const houseLabels = new Map();
  let nearHouse = null, nearThing = null, nearCar=null, panelOpen = null, cardTimer = 0;
  const expedition = createExpedition({town,makeLabel,openPanel,travel,
    releaseMouse:()=>input.releaseMouse()});

  // All focused overlays take priority over the floating AI launcher and
  // the bottom interaction hint. This also handles the small building card.
  function blockingHudOverlays(){
    return {
      panel:!!panelOpen||!$('panel').hidden,
      buildingCard:!$('card').hidden,
      npcDialogue:npcChat.isOpen(),
      expedition:expedition.isOpen(),
      roster:!$('npc-roster').hidden,
      yarns:yarns.isOpen(),
      help:!$('help').hidden,
      game:!$('game').hidden,
      map:overview,
    };
  }
  const companion = mountCompanion({
    getContext:()=>({mode,place:inside?.place?.name||inside?.house?.name||(nearPerson?.spot?life.place(nearPerson.spot.id)?.name:null)||nearHouse?.house?.name||'Town streets',
      coordinate:inside?.house?.coordinate||nearHouse?.house?.coordinate||'',floor:inside?.floorIndex||0,
      pos:player.pos,wallet:life.civic.player.wallet,target:mode==='house'?nearThing:(nearTownSeat?{...nearTownSeat,act:{do:'sit'}}:nearPerson?.spot?{...nearPerson.spot,act:{do:'civic-ledger'}}:nearHouse?{key:nearHouse.house.coordinate,label:nearHouse.house.name,act:{do:'enter'}}:null),
      interactions:inside?.interactables||[]}),
    onOpen:()=>{input.releaseMouse();input.reset();npcChat.close();},onClose:()=>input.reset(),
    isBlocked:()=>isHudBlocked(blockingHudOverlays())
  });

  function syncOverlayHud(){
    const blocked=isHudBlocked(blockingHudOverlays());
    companion.setBlocked(blocked);
    if(blocked)$('prompt').hidden=true;
  }

  // ── Movement between town and houses ─────────────────────────────────────
  function frontOf(coord) {
    const l = town.lots.get(coord);
    return { x: l.doorPos.x, z: l.doorPos.z + 9, yaw: 0 };
  }
  function travel(coord) {
    if(driving.driving){status('Park and get out before travelling.');return false;}
    if (!town.lots.has(coord)) return false;
    if (mode === 'house') leave(false);
    closePanel(); npcChat.close(); $('npc-roster').hidden = true;
    const f = frontOf(coord);
    player.place(f.x, f.z, f.yaw);
    // A map toggle still queued from a slow bird's-eye frame must not reopen the map.
    input.pressed.delete('map');
    setOverview(false);
    status(`Standing outside ${houseAddress(coord)}.`);
    return true;
  }
  // Stands on the footpath outside a shop, farm or the square, facing it.
  function goPlace(id) {
    if(driving.driving){status('Park and get out before fast travel.');return;}
    closePanel(); npcChat.close();
    if (mode === 'house') leave(false);
    const f = townLife.placeFront(id);
    player.place(f.x, f.z, f.yaw ?? 0);
    input.pressed.delete('map'); setOverview(false);
    const name = life.place(id).name;
    status(`Outside ${life.place(id).address} · ${/^the /i.test(name) ? '' : 'the '}${name}.`);
  }
  function updateFloorBadge() {
    floorBadge.hidden = !inside?.floors;
    if (inside?.floors) floorBadge.textContent = '🏠 Floor ' + (inside.floorIndex + 1) +
      ' / ' + inside.floors.levels.length + ' · ' + inside.floors.titles[inside.floorIndex] + ' · 🛗 Floors';
  }
  function changeFloor(target) {
    if (!inside?.floors || target < 0 || target >= inside.floors.levels.length) return false;
    const floors = inside.floors, house = inside.house;
    if (target === inside.floorIndex) { closePanel(); return true; }
    closePanel(); npcChat.close(); nearThing = null; nearNPC = null;
    inside.workplay?.dispose();
    inside.bakeryImmersion?.dispose();
    scene.remove(inside.group);
    const next = floors.levels[target];
    inside = { house, ...next, floorIndex:target, floors, people:next.people || [], view:inside.view, ownMeshes:inside.ownMeshes };
    scene.add(next.group);
    world = new CollisionWorld(next.colliders);
    player.place(next.landing.x, next.landing.z, Math.PI);
    player.baseHeight = target * FLOOR_HEIGHT;
    floorDoorCooldown = 0.9;
    updateFloorBadge(); $('card').hidden = true; ambience.door();
    status('Floor ' + (target+1) + ': ' + floors.titles[target] + '. Use stairs or lift to change floors.');
    return true;
  }
  function openLift() {
    openPanel({ title:'Lift · choose a floor',
      body:'<p>Select a floor. The lift carries you to its landing.</p>', actions:[] });
    const controls = $('panel-actions');
    for (let i = 0; i < inside.floors.levels.length; i++) {
      const button = document.createElement('button');
      button.textContent = 'Floor ' + (i+1) + ' · ' + inside.floors.titles[i];
      button.disabled = i === inside.floorIndex;
      button.onclick = () => changeFloor(i);
      controls.append(button);
    }
  }
  // Walking through a door keeps the way the player is facing, so backing in or out of a building does
  // not spin the view. Interiors share the town's orientation, except south-side shops whose door faces -z.
  const doorTurn = (site) => (site && site.side === 'south' ? Math.PI : 0);
  function enter(coord, keepFacing = false) {
    const yawIn = player.yaw;
    // A villager's own home also has their kitchen, bathroom and laundry, and living room.
    const resident = life.villagers.find((v) => v.home.coordinate === coord);
    const base = byCoord.get(coord);
    // Memorial buildings are public galleries, not a randomly assigned NPC home.
    // Never append generic kitchen, bathroom/laundry or living room overlays.
    const h = resident && !base.memorial ? { ...base, household: resident.name } : base;
    const floors = h.memorial ? null : createFloorStack(h, makeLabel);
    const built = floors ? floors.levels[0] : buildInterior(h, makeLabel);
    // Every storey shares the ground floor's frame: front door at the interior's exit, facing +z
    // like the house itself, so the windows look out on the real street (src/world/windows.js).
    const lot = town.lots.get(coord), ex = built.exitZone;
    inside = { house: h, ...built, floorIndex:0, floors, view: townView({ x:(ex.x0 + ex.x1) / 2, z:ex.z0 - 0.1 }, lot.doorPos), ownMeshes: lot.mesh ? [lot.mesh] : [] };
    scene.add(built.group);
    town.group.visible = false;
    scene.background.set(INDOOR); scene.fog = null;
    world = new CollisionWorld(built.colliders);
    // Residents move between rooms, and cook in the kitchen (if the house has one) at mealtimes;
    // the interactable shares their position and tracks the room they are in.
    const kitchens = [...new Set(built.placedProps.filter((p) => ['stove', 'fridge', 'pantry', 'coffeeMachine'].includes(p.type)).map((p) => p.room))];
    inside.people = built.walkers.map((w, i) => {
      freeSpot(w.pos, world);
      const walker = new Walker(makePerson(coord.charCodeAt(0) + i * 7, w.act.c ?? 0x3f6fb5, w.act.a ?? 0x2f3440), w.pos, { speed: 0.9, name: w.act.name });
      if (w.label) { const s = makeLabel(w.act.name || w.label, 'interactive'); s.position.set(0, 2.25, 0); s.userData.labelKind = 'interactive'; walker.group.add(s); walker.tag = s; }
      walker.room = w.room; walker.activity = 'pottering about';
      const interactable = built.interactables.find((x) => x.key === w.key);
      walker.onMove = (pos) => {
        const ri = built.rooms.findIndex((r) => pos.x >= r.x0 && pos.x <= r.x1 && pos.z >= r.z0 && pos.z <= r.z1);
        if (ri >= 0) { walker.room = ri; if (interactable) { interactable.room = ri; interactable.roomName = built.rooms[ri].name; } }
      };
      walker.plan = houseWander(built.rooms, built.openings, world, () => life.minute, kitchens);
      walker.key = w.key;
      built.group.add(walker.group);
      return walker;
    });
    built.people = inside.people;
    player.place(built.spawn.x, built.spawn.z, keepFacing ? yawIn : 0);
    player.baseHeight = 0;
    updateFloorBadge();
    mode = 'house';
    $('btn-exit').hidden = false;
    visited.add(coord);
    syncDiscoveryCount();
    expedition.noteVisit(coord);
    ambience.door();
    closePanel();
    status(floors ? `Inside ${h.address} · ${h.name}. Tap 🛗 Floors under the town clock to visit the upper storeys, or follow the stairs and lift sign.` : `Inside ${h.address} · ${h.name}. Walk back through the front door to leave.`);
    showCard(h, true);
    cardTimer = 6;
  }
  // The high-street buildings now have their own walkable rooms and usable
  // counters. Keep the existing villager/farm economy running in the street.
  let lastDeniedEntrance = '', lastDeniedTime = 0;
  function enterShop(id, keepFacing = false) {
    if(mode!=='town'||!life.places.has(id))return false;
    const site=life.place(id), access=facilityAccess(life,site);
    if(!access.allowed){
      const now=performance.now();
      if(id!==lastDeniedEntrance || now-lastDeniedTime>3500){status(access.message);lastDeniedEntrance=id;lastDeniedTime=now;}
      return false;
    }
    const yawIn = player.yaw;
    const built=buildCivicInterior(site,makeLabel,life);
    installPhysicalJobs(built,site,makeLabel,life);
    built.workplay=installWorkplay(built,site,makeLabel,life,{openPanel,closePanel,status,sound:kind=>ambience.work(kind),getVisitors:()=>inside?.visitors?.entries});
    if(site.id==='bakery')built.bakeryImmersion=installBakeryImmersion(built,life,camera,makeLabel);
    const staff=populateShopStaff(site,life,built,makeLabel);
    const brief={coordinate:site.col+'8',name:site.name,kind:site.kind,
      street:'High Street',summary:'Explore the shop interior and speak to staff.'};
    const ex=built.exitZone;
    inside={house:brief,place:site,...built,people:staff,
      view:townView({x:(ex.x0+ex.x1)/2,z:ex.z0+0.1},site.door,site.side==='south'?Math.PI:0),ownMeshes:townLife.building(id)};
    scene.add(built.group);town.group.visible=false;
    scene.background.set(INDOOR);scene.fog=null;
    world=new CollisionWorld(built.colliders);
    // The same TownLife villagers that shop, eat and work here now have
    // visible bodies, independent of the staff member behind the counter.
    inside.visitors=createShopVisitors(site,life,inside,makeLabel,inside.people);
    player.place(built.spawn.x,built.spawn.z,keepFacing ? yawIn - doorTurn(site) : 0);
    mode='house';$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();ambience.shopBell();
    $('card').hidden=true;delete $('card').dataset.coord;
    status(access.reason==='supervised' ? access.message+' You may return through the entrance at any time.' : 'Inside '+site.name+'. Walk to the counter or back through the entrance to leave.');
    return true;
  }
  function leave(placeOutside = true, keepFacing = false) {
    if (!inside) return;
    const yawInside = player.yaw;
    closePanel(); npcChat.close();
    const coord = inside.house.coordinate;
    const shop=inside.place||null;
    inside.bakeryImmersion?.dispose();
    inside.workplay?.dispose();
    scene.remove(inside.group);
    for (const group of (inside.floors ? inside.floors.levels.map(x => x.group) : [inside.group])) {
      group.traverse((o) => { if (o.isSprite) disposeLabel(o); else if (o.geometry && o.geometry.type !== 'BoxGeometry') o.geometry.dispose(); });
    }
    inside = null; mode = 'town'; world = townWorld;
    player.baseHeight = 0; updateFloorBadge();
    $('btn-exit').hidden = true;
    town.group.visible = true; scene.background.set(SKY); scene.fog = fog;
    if (placeOutside) {
      if (shop) {
        const pose = civicExitPose(shop, [...townWorld.all, ...townWorld.dynamic()], player.radius+0.08);
        if (pose) player.place(pose.x,pose.z,keepFacing ? yawInside + doorTurn(shop) : pose.yaw);
        else spawn(); // use safe Town Guide location instead of clipping into a wall
      } else { const l=town.lots.get(coord);player.place(l.doorPos.x,l.doorPos.z+4,keepFacing ? yawInside : Math.PI); }
    }
    // Close the door behind the player so the doorway does not re-trigger.
    const d = town.doors.find((d) => d.userData.coordinate === coord); if (d) d.userData.open = 0;
    ambience.door();
    status(shop?`Back outside ${shop.name}.`:`Back on the street at ${coord}.`);
  }

  // ── Overview (bird's-eye) ────────────────────────────────────────────────
  function setOverview(on) {
    if (on) expedition.dismiss();
    if (on) input.releaseMouse();
    overview = on && mode === 'town';
    $('btn-map').setAttribute('aria-pressed', String(overview));
    scene.fog = overview || mode === 'house' ? null : fog;
    camera.far = overview ? 600 : (lowPerf ? 130 : 185); camera.updateProjectionMatrix();
    if (overview) {
      for (const l of town.lots.values()) if (l.mesh) l.mesh.visible = true;
      status('Tap or click a house to travel there.');
    }
  }
  renderer.domElement.addEventListener('click', (e) => {
    if (!overview) return;
    const ndc = new THREE.Vector2((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
    const ray = new THREE.Raycaster(); ray.setFromCamera(ndc, camera);
    const hit = new THREE.Vector3(); ray.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0, 1, 0), 0), hit);
    let best = null, bd = 1e9;
    for (const [c, l] of town.lots) { const d = Math.hypot(l.lot.x - hit.x, l.lot.z - hit.z); if (d < bd) { bd = d; best = c; } }
    if (best && bd < 16) travel(best);
  });

  // ── HUD ──────────────────────────────────────────────────────────────────
  const list = $('house-list');
  for (const h of houses) { const o = document.createElement('option'); o.value = `${h.address} · ${h.name}`; list.append(o); }
  // High Street shops, civic buildings and farms are places, not houses: list them too so any building can be found.
  const placeLabel = (p) => `${p.name} · ${p.address}`;
  const places = [...life.places.values()].filter((p) => p.col);
  for (const p of places) { const o = document.createElement('option'); o.value = placeLabel(p); list.append(o); }
  $('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('search').value.trim().toLowerCase(); if (!q) return;
    const code = q.split(' ')[0].toUpperCase();
    const addressed = parseTownAddress(q) || parseTownAddress(code);
    const p = places.find((p) => placeLabel(p).toLowerCase() === q || p.name.toLowerCase() === q || p.id === q || p.address.toLowerCase() === q || (p.side==='south'&&q==='south '+p.col.toLowerCase()+'8') || (addressed && p.address===addressed.address && !byCoord.has(addressed.col+addressed.row)));
    const h = !p && (byCoord.get(code) || (addressed && addressed.side==='S' && byCoord.get(addressed.col+addressed.row)) || houses.find((h) => h.name.toLowerCase() === q || h.address.toLowerCase() === q || `${h.address} · ${h.name}`.toLowerCase() === q || `${h.coordinate} · ${h.name}`.toLowerCase() === q));
    const near = !p && !h && places.find((p) => p.name.toLowerCase().includes(q));
    const named = !p && !h && !near && houses.find((h) => h.name.toLowerCase().includes(q));
    if (p || near) { goPlace((p || near).id); $('search').blur(); }
    else if (h || named) { travel((h || named).coordinate); $('search').blur(); }
    else status(`No building matches "${$('search').value}".`);
  });
  $('btn-map').onclick = () => setOverview(!overview);
  // Time of day: jumps the town clock (src/world/life.js) to the next part of the day.
  const TIMES = [[7 * 60, '🌅 Morning'], [12 * 60, '☀️ Midday'], [18 * 60 + 40, '🌇 Dusk'], [22 * 60, '🌙 Night']];
  function cycleTime() {
    const next = TIMES.find(([m]) => m > life.minute + 1) || TIMES[0];
    if (next[0] < life.minute) { life.day++; life.newDay(); }
    life.minute = next[0];
    status(`${next[1]} — the town clock now reads ${life.time()}.`);
  }
  const syncTimeBtn = () => { const h = life.minute / 60; const label = h < 6 || h >= 20.5 ? '🌙 Night' : h < 9 ? '🌅 Morning' : h < 17.5 ? '☀️ Day' : '🌇 Dusk'; if ($('btn-time').textContent !== label) $('btn-time').textContent = label; };
  $('btn-time').onclick = () => cycleTime();
  addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() !== 't' || e.repeat || e.ctrlKey || e.altKey || e.metaKey) return;
    if (e.target?.closest?.('input,textarea,select,[contenteditable],#panel,#game,#npc-chat,#town-companion')) return;
    cycleTime();
  });
  function syncPerfBtn() {
    $('btn-perf').setAttribute('aria-pressed', String(lowPerf));
    $('btn-perf').textContent = lowPerf ? '⚡ Smooth: On' : '⚡ Smooth';
    fog.near = lowPerf ? 42 : 60; fog.far = lowPerf ? 120 : 170;
    if (!overview) { camera.far = lowPerf ? 130 : 185; camera.updateProjectionMatrix(); }
  }
  syncPerfBtn();
  $('btn-perf').onclick = () => { lowPerf = !lowPerf; syncPerfBtn(); status(lowPerf ? 'Smooth mode on: drawing fewer distant objects.' : 'Full draw distance restored.'); };
  $('btn-guide').onclick = () => openPanel(guideContent(), guideSpot);
  $('btn-hours').onclick = () => openPanel(openingHoursPanel(life, goPlace), guideSpot);
  $('btn-000').onclick = () => openPanel(emergencyPanel(life,{x:player.pos.x,z:player.pos.z}),guideSpot);
  $('btn-discoveries').onclick = () => openPanel(discoveryContent(), guideSpot);
  $('btn-wallet').onclick = () => openPanel(walletPanel(life, { go: (id) => { goPlace(id); return null; } }), guideSpot);
  $('btn-help').onclick = () => { input.releaseMouse(); $('help').hidden = !$('help').hidden; };
  $('btn-npcs').onclick = () => { $('npc-roster').hidden = !$('npc-roster').hidden; input.reset(); };
  $('npc-roster-close').onclick = () => { $('npc-roster').hidden = true; };
  $('help-close').onclick = () => { $('help').hidden = true; };
  $('btn-exit').onclick = () => { stopGame(); if (mode === 'house') { closePanel(); leave(); save(); status('Exited safely.'); } };
  $('btn-unstuck').onclick = () => { closePanel(); if (mode === 'house' && inside) { leave(); } else { spawn(); } save(); status('Moved to safety. Your progress is preserved.'); };
  $('btn-reset').onclick = () => { clearSave(); if (mode === 'house') leave(false); spawn(); status('Position reset.'); };
  $('panel-close').onclick = () => closePanel();

  function showCard(h, insideNow = false) {
    const links = (h.links || []).map((l) => `<a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.label)} ↗</a>`).join(' · ');
    const deed=life.civic.property?.parcels?.['H:'+h.coordinate];
    const ownerLine=deed ? `<p class="dim"><b>Title:</b> ${esc(deed.owner==='visitor'?'You':deed.owner)} · <b>Occupier:</b> ${esc(deed.tenant||'Vacant')} · <b>Value:</b> ${Number(deed.value).toLocaleString('en-AU')} ${deed.listed?' · For sale':''}</p>` : '';
    $('card').innerHTML = `<h2>${esc(h.address)} · ${esc(h.name)}</h2><p class="kind">${esc(h.kind)} · ${esc(h.street)}</p><p>${esc(h.summary)}</p>${ownerLine}${links ? `<p>${links}</p>` : ''}${insideNow ? '' : '<p class="dim">Walk to the door to go inside.</p>'}`;
    $('card').hidden = false;
  }
  function openPanel(content, thing) {
    // Panels have buttons and text boxes: give the mouse pointer back.
    input.releaseMouse();
    panelOpen = { content, thing };
    $('panel').classList.toggle('wide', !!content.wide);
    $('panel-body').scrollTop = 0; $('panel').scrollTop = 0;
    $('panel-title').textContent = content.title;
    $('panel-body').innerHTML = content.body;
    content.mount?.($('panel-body'));
    const actions = $('panel-actions'); actions.innerHTML = '';
    for (const a of content.actions || []) {
      if (a.url) { const el = document.createElement('a'); el.href = a.url; el.target = '_blank'; el.rel = 'noopener'; el.textContent = a.label; el.className = 'btn-link'; actions.append(el); }
      else { const el = document.createElement('button'); el.textContent = a.label; el.onclick = () => { if (a.play) return startGame(a.play); const beforeWallet=life.civic.player.wallet;
          const next = a.run ? a.run() : content.onAnswer(a.answer);
          if (next && player.seated && ['cafe','pub'].includes(inside?.place?.id) &&
              a.label.toLowerCase().startsWith('order ') && life.civic.player.wallet<beforeWallet && typeof next.body==='string') {
            next.body='<p><b>🍽 Your order has been brought to your table.</b></p>'+next.body;
          }
          if (next) openPanel(next, thing); };
        if (a.play) el.className = 'play'; actions.append(el); }
    }
    $('panel').hidden = false;
    $('card').hidden = true;
  }
  // Games run full-screen in an iframe from games/<id>/; the town pauses underneath.
  let playing = null;
  function startGame(g) {
    expedition.dismiss();
    closePanel(); npcChat.close(); $('npc-roster').hidden = true;
    input.reset();
    playing = g;
    input.releaseMouse();
    $('game-title').textContent = g.title;
    $('game-frame').src = `games/${encodeURIComponent(g.id)}/index.html`;
    $('game').hidden = false;
    document.body.classList.add('playing');
    $('game-frame').focus();
    status(`Playing ${g.title}.`);
  }
  function stopGame() {
    if (!playing) return;
    $('game-frame').src = 'about:blank';
    $('game').hidden = true;
    document.body.classList.remove('playing');
    status(`Back from ${playing.title}.`);
    playing = null;
    input.reset();
    $('game-exit').blur();
  }
  $('game-exit').onclick = () => stopGame();

  function closePanel() {
    interactionRequest++; input.reset();
    if (inside?.people) for (const p of inside.people) p.talking = false;
    panelOpen = null; $('panel').classList.remove('chat-typing'); $('panel').hidden = true;
  }

  // Minecraft-style sleep: lie back into the actual bed, fade to black,
  // simulate every intervening town tick, then fade back to the live world.
  let sleeping=false;
  const sleepScreen=$('sleep-screen');
  const sleepText=$('sleep-message'),sleepTime=$('sleep-time');
  const motionReduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const after=(ms)=>new Promise(resolve=>setTimeout(resolve,ms));
  async function beginSleep(site,room,duration,bed) {
    if(sleeping)return;
    const session=createSleepSession(life,site,room,duration);
    if(!session.ok){status(session.error);return;}
    sleeping=true;
    closePanel();companion.close();npcChat.close();input.releaseMouse();input.reset();
    const oldPos=camera.position.clone(),oldRoll=camera.rotation.z;
    sleepText.textContent='Settling into bed…';
    sleepTime.textContent='Day '+session.startDay+' · '+session.startTime;
    sleepScreen.hidden=false;
    sleepScreen.classList.remove('sleep-dark');
    const target=new THREE.Vector3(bed?.pos?.x??oldPos.x,player.baseHeight+0.86,bed?.pos?.z??oldPos.z);
    try {
      // One continuous motion: first-person view lowers onto the mattress,
      // rolls towards the pillow and disappears beneath the dark overlay.
      await new Promise(resolve=>{
        const begin=performance.now(),length=motionReduced?120:850;
        function settle(now){
          const p=Math.min(1,(now-begin)/length),ease=p*p*(3-2*p);
          camera.position.lerpVectors(oldPos,target,ease);
          camera.rotation.z=oldRoll+ease*1.05;
          renderFrame();
          if(p<1)requestAnimationFrame(settle);else resolve();
        }
        requestAnimationFrame(()=>{
          sleepScreen.classList.add('sleep-dark');
          requestAnimationFrame(settle);
        });
      });
      sleepText.textContent='💤 Sleeping…';
      while(session.remaining>0){
        session.advance(Math.min(12,session.remaining));
        sleepTime.textContent='Day '+life.day+' · '+life.time();
        // Yield between batches so the black screen stays responsive on Android.
        await new Promise(resolve=>requestAnimationFrame(resolve));
      }
      const message=session.finish();
      townLife.save();save();
      sleepText.textContent=life.minute>=360&&life.minute<660?'🌅 Good morning':'☀️ You wake up';
      sleepTime.textContent='Day '+life.day+' · '+life.time();
      status(message);
      await after(motionReduced?80:450);
    }catch(error){
      console.error('Sleep interrupted:',error);
      status('Sleep was interrupted. Your current town progress has been kept.');
      townLife.save();save();
    }finally{
      camera.position.copy(oldPos);camera.rotation.z=oldRoll;
      sleepScreen.classList.remove('sleep-dark');
      await after(motionReduced?130:850);
      sleepScreen.hidden=true;
      sleeping=false;
      input.reset();
    }
  }

  const ctx = {
    get house() { return inside?.house; },
    houses,
    activate: (k) => active.add(k),
    toggle: (k) => { if (active.has(k)) { active.delete(k); return false; } active.add(k); return true; },
  };
  // Chooses the exhibit the player is looking at, not merely the closest one,
  // so neighbouring exhibits can each be selected by facing them.
  function pickNear(at = player.pos, fwd = player.forward()) {
    let pick = null, best = Infinity;
    for (const x of inside.interactables) {
      tmp.copy(x.pos).sub(at); tmp.y = 0; const d = tmp.length();
      if (d > 2.6) continue;
      const dot = d < 0.01 ? 1 : tmp.normalize().dot(fwd);
      if (dot < 0.2 && d > 1.2) continue;
      const score = d - 1.6 * dot;
      if (score < best) { best = score; pick = x; }
    }
    // Authored interactions take priority; passive furniture and seats are
    // selectable when the player looks at them instead of replacing exhibits.
    const seat=nearestSeat((inside.seats||[]).filter(s=>!s.occupiedBy),at,fwd,2.6);
    if(seat) {
      const d=Math.hypot(seat.pos.x-at.x,seat.pos.z-at.z);
      const facing=d<.01?1:((seat.pos.x-at.x)*fwd.x+(seat.pos.z-at.z)*fwd.z)/d;
      // A visible seat wins when clearly nearer or better aligned than the
      // exhibit. Otherwise keep the intentional authored exhibit.
      if(!pick || d-.7*facing<best-.35)
        return {...seat,act:{do:'sit',title:seat.label}};
    }
    if(pick)return pick;
    const furniture=inside.furniture||[];
    let selected=null,rank=Infinity;
    for(const item of furniture) {
      const dx=item.pos.x-at.x,dz=item.pos.z-at.z,d=Math.hypot(dx,dz);
      if(d>2.4)continue;
      const facing=d<.01?1:(dx*fwd.x+dz*fwd.z)/d;
      if(facing<.25&&d>1.1)continue;
      const score=d-.7*facing;
      if(score<rank){rank=score;selected=item;}
    }
    return selected;
  }
  // Relics, street characters, villagers, the guide and shop counters can stand close
  // together, so Use goes to whichever is nearest; everything stays reachable.
  const away = (p) => (p ? Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z) : Infinity);
  function use() {
    if(driving.driving){status(driving.exit());return;}
    if(mode==='town'&&nearCar){status(driving.enter(nearCar));return;}
    if(player.seated){
      if(player.stand(world))status('You stand up.');
      else status('There is no clear space to stand. Move the furniture or try again.');
      return;
    }
    if (mode === 'town') {
      if(nearTownSeat && player.sit(nearTownSeat,world)){
        status('Sitting on '+nearTownSeat.label+'. Look around; move, jump or use to stand.');
        return;
      }
      const treasure = expedition.nearby(player.pos), treasureD = away(treasure), npcD = away(nearNPC), personD = away(nearPerson);
      if (treasure && treasureD <= npcD && treasureD <= personD) { expedition.use(player.pos); ambience.relic(); return; }
      if (nearNPC && npcD <= personD) { input.releaseMouse(); closePanel(); $('npc-roster').hidden = true; npcChat.show(nearNPC.npc, null); input.reset(); return; }
      if (nearPerson) { if(nearPerson.spot){enterShop(nearPerson.spot.id);return;} talkTo(nearPerson); return; }
      if (nearHouse) showCard(nearHouse.house);
      return;
    }
    if (nearThing) {
      if(nearThing.act?.do==='sit'){
        if(inside?.seats?.find(s=>s.key===nearThing.key)?.occupiedBy){status('That seat is occupied. Try another table.');return;}
        if(player.sit(nearThing,world))status('Sitting on '+nearThing.label+'. Look around; move, jump or use to stand.');
        else status('Move closer to the seat to sit safely.');
        return;
      }
      if(nearThing.act?.do==='furniture'){
        openPanel(furniturePanel(nearThing),nearThing);
        return;
      }
      if (nearThing.floorNav) {
        if (nearThing.floorNav === 'lift') openLift();
        else changeFloor(nearThing.target);
        return;
      }
      const thing = nearThing, request = ++interactionRequest, house = inside;
      const restricted=restrictedServiceAction(life,inside?.place,thing);
      if(restricted){status(restricted);return;}
      if(thing.act?.do==='soy-action'){
        const result=life.soyAction(inside?.place?.id,thing.act.action);
        status(result.message);
        if(result.ok)inside?.soyVisuals?.();
        return;
      }
      if(thing.act?.do==='sleep') {
        const hotel=inside?.place?.id==='hotel';
        const room=hotel?Number(thing.act.room)||null:inside?.house?.coordinate;
        const site=hotel?'hotel':'home';
        const check=createSleepSession(life,site,room,30);
        if(!check.ok){
          openPanel({title:hotel?'Railway Hotel · '+thing.label:'Private bedroom',
            body:'<p>'+esc(check.error)+'</p><p>'+ (hotel?
              'Only the guest bed matching your paid room key is available. Book at reception.':
              'Rent or buy a vacant home before using its bed.')+'</p>',
            actions:hotel?[{label:'Hotel reception',run:()=>placePanel(life,'hotel')}]:[]},thing);
          return;
        }
        const choices=sleepChoices(life);
        openPanel({title:(hotel?'Railway Hotel':'Your home')+' · '+thing.label,
          body:'<p>Climb into bed and choose how long to sleep. The screen darkens, you wake in this room, and the town carries on around you.</p>'+
            '<p>Current time: <b>Day '+life.day+' · '+life.time()+'</b> · Fatigue '+Math.round(life.civic.player.fatigue)+'%.</p>'+
            '<p>Longer sleep restores more energy. Hunger still rises; work shifts, deliveries, neighbours and bills continue.</p>',
          actions:choices.map(choice=>({label:choice.label,run:()=>{beginSleep(site,room,choice.duration,thing);return null;}}))},thing);
        return;
      }
      if(inside?.workplay&&thing.act?.do==='workplay'){inside.workplay.use(thing);return;}
      if(inside?.place?.id==='bakery'&&thing.act?.do==='bakery-immersive'){
        const message=inside.bakeryImmersion?.act(thing.act.action)||'This station is unavailable.';
        status(message);return;
      }
      if(inside?.place&&thing.act?.do==='physical-job'){
        if(['depot','post','garden','coop','hall'].includes(inside.place.id)){openPanel(occupationPanel(life,inside.place.id,thing.act.index,()=>inside?.workStationVisuals?.()),thing);return;}
        if(inside.place.id==='bakery'&&thing.act.task!=='wash-hands'){openPanel(bakeryKitchenPanel(life),thing);return;}
        const result=usePhysicalJob(life,thing.act.task);
        inside.workStationVisuals?.();
        status(result.message);
        return;
      }
      if(inside?.place?.id==='bakery'&&thing.act?.do==='bakery-production'){
        const result=thing.act.action==='mix'?{message:'Use the mixer controls below to weigh, mix and shape your saved batch.'}:superviseBread(life,thing.act.action);
        status(result.message);
        openPanel(bakeryKitchenPanel(life,result.message),thing);
        return;
      }
      if(inside?.place&&thing.act?.do==='bakery-kitchen'){
        openPanel(bakeryKitchenPanel(life),thing);
        return;
      }
      if(thing.act?.do==='household'&&inside?.house?.household){
        openPanel(householdPanel(life,inside.house.household,thing.act.what),thing);
        return;
      }
      if(inside?.place?.id==='landfill'&&thing.act?.do==='waste-depot-status'){
        openPanel(wasteDepotPanel(life,thing.key.split(':')[1]),thing);
        return;
      }
      if(inside?.place&&thing.act?.do==='emergency'){
        openPanel(emergencyPanel(life,{x:player.pos.x,z:player.pos.z}),thing);return;
      }
      if(inside?.place&&thing.act?.do==='justice'){
        openPanel(justicePanel(life),thing);return;
      }
      if(inside?.place&&thing.act?.do==='civic-ledger'){
        const p=inside.place;
        openPanel(placePanel(life,p.id),thing);
        return;
      }
      const person = thing.person && inside.people?.find((p) => p.key === thing.key);
      if (person) {
        if(inside.workplay?.customer(person.v))return;
        person.talking = true;
        if(inside.place){
          const staffHome=person.v?.home?.coordinate && byCoord.get(person.v.home.coordinate);
          const shopHouse=staffHome || {...inside.house,
            int:{rooms:[{name:inside.rooms[0].name,props:[]}]},links:[],repo:null};
          const shop=inside.place;
          const localTown=()=>({
            ...townContext(life,person.v||null),
            location:{name:shop.name,status:'working',activity:person.activity},
            workplace:{id:shop.id,name:shop.name},
            resident:!person.v?person.activity:null,
          });
          openPanel(npcBehaviour(thing,{house:shopHouse,houses,
            workplace:shop.name,town:localTown}),thing);
        } else {
          openPanel(npcBehaviour(thing,{house:inside.house,houses,getNearbyScene:()=>sceneFromRoom({rooms:inside.rooms,objects:inside.sceneObjects||[],roomIndex:person.room??thing.room,position:person.pos}),town:()=>townContext(life,null,person.activity)}),thing);
        }
        return;
      }
      Promise.resolve(runInteraction(thing, ctx)).then((content) => { if (request === interactionRequest && inside === house && mode === 'house') openPanel(content, thing); })
        .catch((e) => { if (request === interactionRequest && inside === house) openPanel({ title: thing.label, body: `<p>Couldn't open this exhibit: ${esc(e.message)}</p>` }, thing); });
    }
  }
  // Street characters: the one ahead of the player, within reach.
  function pickNPC(list, maxDistance = 3.6) {
    const facing = player.forward(); let best = null, score = Infinity;
    for (const x of list) {
      const dx = x.pos.x - player.pos.x, dz = x.pos.z - player.pos.z, d = Math.hypot(dx, dz);
      if (d > maxDistance) continue;
      const dot = d < 0.1 ? 1 : (dx * facing.x + dz * facing.z) / d;
      if (dot < -0.2 && d > 1.6) continue;
      const rank = d - 0.6 * dot; if (rank < score) { score = rank; best = x; }
    }
    return best;
  }

  // Town-life conversations and panels.
  function guideContent() {
    return guidePanel(life, {
      go: (id) => { goPlace(id); return null; }, ledger: () => ledgerPanel(life),
      // Rowan (src/ui/npc-data.js) is the guide you can chat with.
      chat: () => { closePanel(); npcChat.show(streetNPCs.find((n) => n.npc.id === 'rowan')?.npc || 'rowan', null); return null; },
      journal: () => { closePanel(); expedition.showJournal(); return null; },
      arcade: () => { travel('M5'); return null; },
      speed: () => life.speed, setSpeed: (n) => { life.speed = n; townLife.save(); }, relic: () => relicsLeft()[0],
    });
  }
  function discoveryContent() {
    const progress = discoveryProgress(houses, visited);
    const next = progress.next;
    const barMax = Math.max(progress.total, 1);
    const target = next ? '<p>Next undiscovered: <strong>' + esc(next.coordinate) + ' · ' + esc(next.name) + '</strong></p><p class="dim">Walk through its front door to add it to your log.</p>' : '<p>Every house in Repository Town is in your log.</p>';
    return {
      title: "Explorer's Log",
      body: '<p><strong>' + progress.found + ' / ' + progress.total + '</strong> houses discovered · ' + progress.percent + '%</p>' +
        '<progress max="' + barMax + '" value="' + progress.found + '" aria-label="' + progress.found + ' of ' + progress.total + ' houses discovered"></progress>' + target,
      actions: next ? [{ label: 'Go to ' + next.coordinate, run: () => { travel(next.coordinate); return null; } }] : [],
    };
  }
  function talkTo(p) {
    if (p.guide) { openPanel(guideContent(), p); return; }
    if (p.spot) { openPanel(placePanel(life, p.spot.id), p); return; }
    const v = p.v, home = byCoord.get(v.home.coordinate);
    p.talking = true;
    openPanel(npcBehaviour({ act: { do: 'npc', name: v.name, role: 'villager' } }, { house: home, houses, town: () => townContext(life, v) }), p);
  }

  // ── Persistence ──────────────────────────────────────────────────────────
  function spawn() { player.place(0, lotPosition('M4').z + 16, Math.PI); player.yaw = Math.PI / 2; }
  const saved = loadSave();
  if (saved?.pos) {
    for (const c of saved.visited || []) visited.add(c);
    if (saved.insideShop && life.places.has(saved.insideShop)) {
      enterShop(saved.insideShop);player.place(saved.pos.x,saved.pos.z,saved.yaw);
    } else if (saved.inside && byCoord.has(saved.inside)) { enter(saved.inside); player.place(saved.pos.x, saved.pos.z, saved.yaw); }
    else player.place(saved.pos.x, saved.pos.z, saved.yaw);
    if (world.hits(player.pos.x, player.pos.z, player.radius)) { if (mode === 'house') leave(false); spawn(); }
    status('Welcome back — your position was restored.');
  } else { spawn(); status('Welcome! Walk up to the Town Guide or any front door to begin.'); }
  syncDiscoveryCount();
  let saveTimer = 0;
  const save = () => writeSave({ pos: { x: player.pos.x, z: player.pos.z }, yaw: player.yaw, inside: inside&&!inside.place?inside.house.coordinate:null, insideShop:inside?.place?.id||null, visited: [...visited] });
  addEventListener('visibilitychange', () => { if (document.hidden) { save(); townLife.save(); } });
  addEventListener('pagehide', () => { save(); townLife.save(); });
  const syncSound = () => { $('btn-sound').textContent = ambience.on ? '🔊 Sound' : '🔇 Sound'; $('btn-sound').setAttribute('aria-pressed', String(ambience.on)); };
  $('btn-sound').onclick = () => { ambience.setOn(!ambience.on); syncSound(); status(ambience.on ? 'Town sound on.' : 'Town sound muted.'); };
  const audioMixButton=document.createElement('button');audioMixButton.type='button';audioMixButton.textContent='🎚 Audio mix';$('btn-sound').after(audioMixButton);
  audioMixButton.onclick=()=>openPanel({title:'Town soundscape',body:'<p>Original adaptive music changes with venue and time of day. Music softens during conversations. Sound starts only after you enable it.</p>'+Object.entries(ambience.mix).map(([key,value])=>'<p><label>'+key+' <input type="range" data-audio="'+key+'" min="0" max="100" value="'+Math.round(value*100)+'"></label></p>').join(''),actions:[{label:ambience.on?'Mute all sound':'Enable sound',run:()=>{ambience.setOn(!ambience.on);syncSound();return null;}}],mount:root=>{for(const el of root.querySelectorAll('[data-audio]'))el.oninput=()=>ambience.setMix(el.dataset.audio,Number(el.value)/100);}});

  syncSound();

  // ── Minimap ──────────────────────────────────────────────────────────────
  const mm = $('minimap'), mctx = mm.getContext('2d');
  function drawMap() {
    const W = mm.width, H = mm.height; mctx.clearRect(0, 0, W, H);
    if (mode === 'house') {
      const b = inside.bounds, s = Math.min((W - 20) / (b.x1 - b.x0), (H - 20) / (b.z1 - b.z0));
      const tx = (x) => 10 + (x - b.x0) * s, tz = (z) => 10 + (z - b.z0) * s;
      mctx.fillStyle = '#c9bfa8';
      for (const r of inside.rooms) mctx.fillRect(tx(r.x0) + 1, tz(r.z0) + 1, (r.x1 - r.x0) * s - 2, (r.z1 - r.z0) * s - 2);
      mctx.fillStyle = '#7fe0ff'; for (const x of inside.interactables) mctx.fillRect(tx(x.pos.x) - 2, tz(x.pos.z) - 2, 4, 4);
      drawArrow(tx(player.pos.x), tz(player.pos.z));
      return;
    }
    const sx = (W - 10) / town.bounds.width, sz = (H - 10) / town.bounds.depth;
    for (const [c, l] of town.lots) { mctx.fillStyle = visited.has(c) ? '#7fe0ff' : `hsl(${l.lot.row * 45},45%,62%)`; mctx.fillRect(5 + (l.lot.x + town.bounds.width / 2) * sx - 3, 5 + (l.lot.z + town.bounds.depth / 2) * sz - 2, 6, 4); }
    // Town buildings and farms on street 8, and the trucks on the road.
    for (const p of life.places.values()) { mctx.fillStyle = p.kind === 'farm' ? '#9bd36a' : '#f2c86a'; mctx.fillRect(5 + (p.x + town.bounds.width / 2) * sx - 3, 5 + (p.door.z - 7.5 + town.bounds.depth / 2) * sz - 2, 6, 4); }
    mctx.fillStyle = '#ffffff'; for (const t of life.trucks) mctx.fillRect(5 + (t.x + town.bounds.width / 2) * sx - 1.5, 5 + (t.z + town.bounds.depth / 2) * sz - 1.5, 3, 3);
    expedition.drawMap(mctx,W,H,town.bounds);
    drawArrow(5 + (player.pos.x + town.bounds.width / 2) * sx, 5 + (player.pos.z + town.bounds.depth / 2) * sz);
  }
  function drawArrow(x, y) {
    mctx.save(); mctx.translate(x, y); mctx.rotate(-player.yaw); mctx.fillStyle = '#ff5050';
    mctx.beginPath(); mctx.moveTo(0, -6); mctx.lineTo(4, 4); mctx.lineTo(-4, 4); mctx.fill(); mctx.restore();
  }

  // ── Frame loop ───────────────────────────────────────────────────────────
  const clock = new THREE.Clock();
  let mapTimer = 0, frames = 0, fpsTimer = 0, fps = 0, prevX = player.pos.x, prevZ = player.pos.z;
  // Adaptive resolution: sustained slow frames lower GPU pixel cost; recovery
  // is deliberately gradual to avoid oscillation and repeated canvas resizes.
  let slowSeconds = 0, fastSeconds = 0, resolutionCooldown = 0;
  function adaptResolution(elapsed) {
    if (document.hidden || playing || overview) return;
    resolutionCooldown = Math.max(0, resolutionCooldown - elapsed);
    slowSeconds = fps < 42 ? slowSeconds + elapsed : 0;
    fastSeconds = fps > 56 ? fastSeconds + elapsed : 0;
    if (resolutionCooldown > 0) return;
    const minimum = Math.min(preferredPixelRatio, 0.7);
    if (slowSeconds >= 4 && renderPixelRatio > minimum + 0.03) {
      renderPixelRatio = Math.max(minimum, Math.round((renderPixelRatio - 0.15) * 100) / 100);
    } else if (fastSeconds >= 10 && renderPixelRatio < preferredPixelRatio - 0.03) {
      renderPixelRatio = Math.min(preferredPixelRatio, Math.round((renderPixelRatio + 0.1) * 100) / 100);
    } else return;
    renderer.setPixelRatio(renderPixelRatio);
    slowSeconds = 0; fastSeconds = 0; resolutionCooldown = 6;
  }
  const tmp = new THREE.Vector3();
  function frame() {
    // Up to 0.15 s per frame keeps walking real-time on slow phones; collision subdivides the step.
    const raw = clock.getDelta(), dt = Math.min(raw, 0.15), t = clock.elapsedTime;
    floorDoorCooldown = Math.max(0, floorDoorCooldown - dt);
    frames++; fpsTimer += raw; if (fpsTimer > 1) {
      fps = frames / fpsTimer;
      adaptResolution(fpsTimer);
      frames = 0; fpsTimer = 0;
    }
    // While a game is open the town neither renders nor reacts, so the game gets the whole device.
    syncOverlayHud();
    if (sleeping) { input.reset(); requestAnimationFrame(frame); return; }
    if (playing) {
      if (input.consume('back')) stopGame();
      input.takeLook(); for (const k of ['use', 'jump', 'map']) input.consume(k);
      requestAnimationFrame(frame);
      return;
    }
    if (input.consume('map')) setOverview(!overview);
    if (input.consume('back')) { if (companion.isOpen()) companion.close(); else if (expedition.isOpen()) expedition.dismiss(); else if (npcChat.isOpen()) npcChat.close(); else if (yarns.isOpen()) yarns.close(); else if (!$('npc-roster').hidden) $('npc-roster').hidden = true; else if (panelOpen) closePanel(); else if (!$('help').hidden) $('help').hidden = true; else setOverview(false); }
    if(expedition.isOpen()){input.keys.clear();input.takeLook();input.pressed.delete('use');}
    if (overview) {
      camera.position.set(player.pos.x, 150, player.pos.z + 95); camera.lookAt(player.pos.x, 0, player.pos.z);
      input.takeLook(); input.consume('jump');
    } else if (companion.isOpen() || expedition.isOpen() || panelOpen || npcChat.isOpen() || yarns.isOpen() || !$('npc-roster').hidden || !$('help').hidden) input.reset();
    else {
      const n=life.needsReport();
      player.speedFactor=Math.max(0.45,1-(n.hunger>80?0.23:0)-(n.fatigue>75?0.32:0));
      if(mode==='town'&&driving.driving) driving.update(dt);
      else player.update(dt,input,world);
    }
    // Keep the table-service control in the always-visible needs strip on
    // phones with the rest of the HUD collapsed.
    tableOrder.hidden=!(player.seated && mode==='house' &&
      inside?.place && ['cafe','pub'].includes(inside.place.id));
    const movedDist = Math.hypot(player.pos.x - prevX, player.pos.z - prevZ);
    prevX = player.pos.x; prevZ = player.pos.z;

    // The town keeps living while the player is indoors; the sky follows its clock.
    const talkingTo = panelOpen?.thing?.v ? panelOpen.thing : null;
    life.workVehicleDriving=driving.activeVehicle()?.workVehicle==='depot';
    life.playerAt = mode === 'house' && inside?.place ? inside.place.id : null;
    life.playerSeated = !!player.seated; // shifts count only inside the workplace
    life.pedestrianWorld=townWorld;
    life.externalPedestrians=mode==='town'
      ?streetNPCs.filter(n=>n.mode==='town').map(n=>({x:n.pos.x,z:n.pos.z,radius:.66}))
      :[];
    const view = mode === 'house' && inside?.view ? inside.view.place(camera, outdoorCam) : null;
    townLife.update(dt, t, { player, mode, overview, camera, talkingTo, view });
    yarns.update(dt,mode);
    inside?.soyVisuals?.();
    if(mode==='house'&&inside?.bakeryImmersion)inside.bakeryImmersion.update(dt,t);
    emergencyVisuals.update(t);
    const n=life.needsReport();
    const car=driving.activeVehicle();
    const needsText=`🍽 ${Math.round(n.hunger)}% · 💤 ${Math.round(n.fatigue)}%${car?' · 🚗 '+Math.round(Math.abs(car.speed||0)*3.6)+'km/h ⛽ '+Math.round(car.fuel||0)+'L':''}`;
    if($('needs-status').textContent!==needsText)$('needs-status').textContent=needsText;
    const clockText = `🕖 ${life.time()} · Day ${life.day}${life.speed > 1 ? ` · ${life.speed}×` : ''}`;
    if ($('clock').textContent !== clockText) $('clock').textContent = clockText;
    syncTimeBtn();
    {
      let truck = Infinity; for (const tr of life.trucks) truck = Math.min(truck, Math.hypot(tr.x - player.pos.x, tr.z - player.pos.z));
      const busy = Math.min(1, townLife.people.filter((p) => !p.v.inside && Math.abs(p.v.x - player.pos.x) < 25 && Math.abs(p.v.z - player.pos.z) < 25).length / 5);
      for (const e of townLife.events.splice(0)) ambience.play(e, mode === 'house' ? 300 : Math.hypot(e.x - player.pos.x, e.z - player.pos.z));
      const wxyz = mode === 'town' ? [life.place('waterworks'), life.place('sewage')].filter(Boolean).reduce((m, q) => Math.max(m, 1 - Math.hypot(player.pos.x - q.x, player.pos.z - (FIELD_Z0 + 6)) / 40), 0) : 0;
      ambience.update(dt, { day: life.daylight(), busy: mode === 'town' ? busy : Math.min(1,(inside?.people?.filter(p=>p.key?.startsWith('visitor:')).length||0)/8), truck: mode === 'town' ? truck : Infinity, indoors: mode === 'house', room: inside?.place?.id || (inside ? 'house' : ''), weather: life.civic.weather, water: Math.max(0, wxyz), surface: mode === 'house' ? roomFloor(inside?.place?.id || 'house') : surfaceAt(player.pos.x, player.pos.z), stepPhase: player.bob, moving: movedDist > 0.015, running: movedDist > dt * 5.2, crouching: player.eye < 1.3, airborne: player.y > 0, hour: life.minute / 60, dayNumber: life.day });
    }

    if (mode === 'town') {
      const npcCull = lowPerf ? 48 : 65, houseCull = lowPerf ? 115 : 175, labelCull = lowPerf ? 42 : 55;
      nearNPC = pickNPC(streetNPCs);
      animateNPCs(streetNPCs, t, player.pos, dt, npcChat.isOpen() ? npcChat.active() : null, townWorld, npcCull);
      // Two independent NPC families occupy the SAME physical town: both
      // named quest characters and ordinary residents share collision spacing.
      const nearbyPeople=townLife.people.filter(p=>!p.v.inside &&
        Math.abs(p.v.x-player.pos.x)<95 && Math.abs(p.v.z-player.pos.z)<95);
      const nearbyCharacters=streetNPCs.filter(n=>n.mode==='town' &&
        Math.abs(n.pos.x-player.pos.x)<90 && Math.abs(n.pos.z-player.pos.z)<90);
      const movingPeople=[
        ...nearbyPeople.map(p=>({id:'resident:'+p.v.id,pos:p.v,
          radius:p.v.bike&&p.v.path?.length?1.16:.61,
          goal:p.v.path?.[0]||null,speed:p.v.bike?4.5:1.5,fixed:!!p.v.engaged})),
        ...nearbyCharacters.map(n=>({id:'character:'+n.npc.id,pos:n.pos,radius:.66,
          goal:n.activity==='walk'?{x:n.targetX,z:n.targetZ}:null,speed:.65,
          fixed:npcChat.isOpen()&&npcChat.active()===n.npc.id})),
        {id:'player',pos:player.pos,radius:.67,fixed:true}
      ];
      // Small anticipatory sideways steps make room for oncoming bikes and
      // pedestrians, before swept personal-space separation prevents overlaps.
      steerPedestrians(movingPeople,{world:townWorld,dt});
      separatePedestrians(movingPeople,{world:townWorld,gap:1.3,passes:6});
      // Renderer and interaction targets must follow the resolved positions,
      // never the pre-collision pose. This also fixes overlapping name tags.
      for(const p of nearbyPeople){
        p.pos.set(p.v.x,0,p.v.z);
        p.fig.group.position.x=p.v.x;p.fig.group.position.z=p.v.z;
      }
      // The nearby-action HUD, not dozens of world-space nameplates, identifies
      // town residents. Keep animated characters visible but mute their billboards.
      for (const p of townLife.people) if (p.tag) p.tag.visible = false;
      for (const n of streetNPCs) if (n.group.userData.label) n.group.userData.label.visible = false;
      // Speech is a rare exception, limited to the nearest passing greeting.
      let greetingShown = false;
      for (const p of [...nearbyPeople].sort((a,b) =>
        Math.hypot(a.v.x-player.pos.x,a.v.z-player.pos.z) -
        Math.hypot(b.v.x-player.pos.x,b.v.z-player.pos.z))) {
        if (!p.bubble) continue;
        const d = Math.hypot(p.v.x-player.pos.x,p.v.z-player.pos.z);
        p.bubble.visible = !greetingShown && d < 5;
        if (p.bubble.visible) greetingShown = true;
      }
      // Villagers, the guide kiosk and the shop counters: pick the one the player is facing.
      nearPerson = null; let bestP = Infinity;
      const consider = (c, reach) => {
        const d = Math.hypot(c.pos.x - player.pos.x, c.pos.z - player.pos.z);
        if (d > reach) return;
        tmp.copy(c.pos).sub(player.pos); tmp.y = 0;
        const facing = d < 0.01 ? 1 : tmp.normalize().dot(player.forward());
        const score = d - 1.6 * facing;
        if ((facing > 0.2 || d < 1.2) && score < bestP) { bestP = score; nearPerson = c; }
      };
      for (const p of townLife.people) if (!p.v.inside) consider(p, 2.6);
      consider(guideSpot, 2.6);
      for (const sp of townLife.spots) consider({ ...sp, spot: sp }, 3.2);
      nearTownSeat = !overview&&!driving.driving ? nearestSeat(townLife.seats,player.pos,player.forward(),2.4) : null;
      nearCar = !overview&&!driving.driving ? driving.nearest() : null;
      nearHouse = null; let best = 6;
      for (const l of town.lots.values()) {
        const d = Math.hypot(l.doorPos.x - player.pos.x, l.doorPos.z - player.pos.z);
        if (l.mesh) l.mesh.visible = overview || d < houseCull;
        if (d < best) { best = d; nearHouse = l; }
      }
      // Front doors open for the player, street characters at home, and villagers going in or out.
      for (const d of town.doors) {
        const dist = Math.hypot(d.userData.centre.x - player.pos.x, d.userData.centre.z - player.pos.z);
        d.visible = overview || dist < (lowPerf ? 65 : 110);
        if (!d.visible) continue;
        const near = (p, r) => Math.hypot(p.x - d.userData.centre.x, p.z - d.userData.centre.z) < r;
        const someone = streetNPCs.some((n) => n.npc.coordinate === d.userData.coordinate && near(n.pos, 2.8)) || townLife.people.some((p) => p.v.home.coordinate === d.userData.coordinate && near(p.v, 2.2));
        const target = dist < 3.2 || someone ? 1 : 0; d.userData.open += (target - d.userData.open) * Math.min(1, dt * 5); d.rotation.y = d.userData.open * 1.55;
      }
      if(!driving.driving)for (const z of town.doorZones) {
        if (player.pos.x > z.x0 && player.pos.x < z.x1 && player.pos.z > z.z0 && player.pos.z < z.z1) {
          const d = town.doors.find((d) => d.userData.coordinate === z.coordinate);
          if (d.userData.open > 0.6) { enter(z.coordinate, true); break; }
        }
      }
      // Walk into an actual 3D shop interior when crossing the open shopfront.
      // The outside facades are collision solids, so the transition happens
      // just in front of their door (not inside an inaccessible wall).
      if(mode==='town' && !overview && !driving.driving){
        for(const place of life.places.values()){
          if(atCivicEntrance(place,player.pos)){
            if(!enterShop(place.id, true)){
              // Keep closed/unattended buildings secure, but give an obvious
              // physical rejection outside the expanded entrance trigger.
              const back=closedCivicDoorPose(place,player.pos);
              player.place(back.x,back.z,player.yaw);
            }
            break;
          }
        }
      }
      if (nearHouse && $('card').dataset.coord !== nearHouse.house.coordinate) { showCard(nearHouse.house); $('card').dataset.coord = nearHouse.house.coordinate; }
      if (!nearHouse && $('card').dataset.coord) { $('card').hidden = true; delete $('card').dataset.coord; }
      // Only the nearest, approached front door earns a floating house title.
      // Permanent physical street/shop signs remain visible at every distance.
      for (const [c, l] of town.lots) {
        const d = Math.hypot(l.doorPos.x-player.pos.x,l.doorPos.z-player.pos.z);
        const has = houseLabels.get(c);
        if (d < 16 && !has) {
          const s = makeLabel(`${l.house.address} · ${l.house.name}`, 'house');
          s.position.set(l.lot.x,Math.max(3.7,Math.min(5.5,l.fp.h-0.8)),l.doorPos.z+1.2);
          town.group.add(s);houseLabels.set(c,s);
        } else if (d > 22 && has) {
          town.group.remove(has);disposeLabel(has);houseLabels.delete(c);
        }
        const label = houseLabels.get(c);
        if (label) {
          const dx=l.doorPos.x-player.pos.x,dz=l.doorPos.z-player.pos.z;
          const face=d>0.01?(dx*player.forward().x+dz*player.forward().z)/d:1;
          label.visible = showNearbyHouseLabel({
            distance:d,facing:face,nearest:nearHouse===l,
            overview,modal:!!panelOpen||npcChat.isOpen()||driving.driving
          });
        }
      }
      const nearRelic = expedition.nearby(player.pos), relicD = away(nearRelic), npcD = away(nearNPC), personD = away(nearPerson);
      $('prompt').hidden = (!driving.driving && !nearCar && !player.seated && !nearTownSeat && !nearNPC && !nearPerson && !nearHouse && !nearRelic) || !!panelOpen || expedition.isOpen() || npcChat.isOpen() || !$('npc-roster').hidden;
      if(driving.driving)$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — Park and get out (stop first)`;
      else if(nearCar)$('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — Drive ${nearCar.registration} · ${nearCar.model}`;
      else if (player.seated) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Stand up · Move or jump to stand`;
      else if(nearTownSeat) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Sit on ${nearTownSeat.label}`;
      else if (nearRelic && relicD <= npcD && relicD <= personD) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ✨ ${nearRelic.id === 'guild' ? 'Guild Chest' : nearRelic.name}`;
      else if (nearNPC && npcD <= personD) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — 💬 Talk to ${nearNPC.npc.name}`;
      else if (nearPerson) {
        const site=nearPerson.spot?.id && life.places.get(nearPerson.spot.id);
        const access=site && facilityAccess(life,site);
        const label=site && !access.allowed
          ? (access.reason==='unstaffed'?site.name+' · Waiting for staff':site.name+' · Closed to visitors')
          : nearPerson.v?`Talk to ${nearPerson.v.name} (${nearPerson.v.job}) · ${nearPerson.v.activity.replace(/^(walking|cycling) — /, '')}`:nearPerson.label;
        $('prompt').textContent=`${input.touch?'Tap ✋':'Press E'} — ${label}`;
      }
      else if (nearHouse) $('prompt').textContent = `${nearHouse.house.address} · ${nearHouse.house.name} — walk through the door to enter`;
      if (input.consume('use')) use();
    } else {
      // Inside doors swing open for the player and for residents walking through them.
      for (const d of inside.doors) {
        const dist = Math.hypot(d.userData.centre.x - player.pos.x, d.userData.centre.z - player.pos.z);
        const residentNear = (inside.people || []).some((p) => Math.hypot(d.userData.centre.x - p.pos.x, d.userData.centre.z - p.pos.z) < 2.0);
        const target = dist < 2.8 || residentNear ? 1 : 0; d.userData.open += (target - d.userData.open) * Math.min(1, dt * 5); d.rotation.y = d.userData.baseRot + d.userData.open * 1.5;
      }
      const ex = inside.exitZone;
      // Generous exit area: the doorway, the last 1.3 m inside it and anywhere beyond it, centred on
      // the actual door, so a slow frame or the floor-change cooldown cannot carry the player past it.
      if (floorDoorCooldown <= 0 && Math.abs(player.pos.x - (ex.x0 + ex.x1) / 2) < 1.55 && player.pos.z > inside.rooms[0].z1 - 1.3) { if (inside.floors && inside.floorIndex > 0) changeFloor(inside.floorIndex - 1); else leave(true, true); }
      else {
        nearThing = player.seated ? null : pickNear();
        nearNPC = null;
        $('prompt').hidden = (!nearThing && !player.seated) || !!panelOpen || npcChat.isOpen() || !$('npc-roster').hidden;
        const who = nearThing?.person && inside.people?.find((p) => p.key === nearThing.key);
        if (player.seated) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — Stand up · Move or jump to stand`;
        else if (nearThing) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ${nearThing.act?.do==='sit'?'Sit on ':''}${nearThing.label}${who ? ` · ${who.activity}` : ''}`;
        if (input.consume('use')) use();
        animate(inside.dynamics, t, active);
        inside.visitors?.update(dt,t,player);
        inside.workplay?.update(dt,player);
        inside.workStationVisuals?.();
        // Shop patrons are synchronised with the authoritative town economy
        // above; they have their own movement and seated animation.
        for (const p of inside.people || []) if(!p.key?.startsWith('visitor:'))p.update(dt,t,player,p.plan);
        if (cardTimer > 0 && (cardTimer -= dt) <= 0) $('card').hidden = true;
        // A single short label may identify the object directly ahead;
        // all room, employee, shelf and distant station labels stay quiet.
        // The bottom-screen E/✋ prompt remains the accessible action cue.
        const labelEye = new THREE.Vector3(camera.position.x,
          camera.position.y - (inside.floorIndex || 0) * FLOOR_HEIGHT,camera.position.z);
        const currentRoom = inside.rooms.findIndex(r =>
          player.pos.x >= r.x0 && player.pos.x <= r.x1 &&
          player.pos.z >= r.z0 && player.pos.z <= r.z1);
        focusInteriorLabels(inside.group,{
          target:nearThing?.pos || null,player:player.pos,forward:player.forward(),currentRoom,
          modal:!!panelOpen||npcChat.isOpen()||expedition.isOpen(),
          canSee:at=>labelVisible(labelEye,at,inside.sight)
        });
      }
    }
    if (mode === 'town') input.consume('use');
    expedition.update(t,player,mode);
    mapTimer += dt; if (mapTimer > 0.2) { drawMap(); mapTimer = 0; }
    saveTimer += dt; if (saveTimer > 3) { save(); saveTimer = 0; }
    // Apply after selecting the new nearby prompt: never let it reappear over
    // a shop menu, building card, NPC conversation or other focused interface.
    syncOverlayHud();
    renderFrame();
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  // Test hook: lets the browser test suite drive real gameplay deterministically.
  window.__town = {
    // Test harness fast-forwards genuine simulation steps, allowing attendants to
    // commute to their workstations before the browser tries a staffed entrance.
    // Access-control decisions remain unchanged: no unlocked-door shortcut.
    advanceSimulation(minutes) {
      if (!Number.isFinite(minutes) || minutes < 0 || minutes > 240) return false;
      for (let elapsed = 0; elapsed < minutes; elapsed += 0.5)
        life.tick(Math.min(0.5, minutes - elapsed));
      return true;
    },
    // Read-only playtest evidence: a rostered worker is not automatically on
    // duty at the counter. The real visitor-access rule remains authoritative.
    facilityState(id) {
      const site=life.place(id);
      if(!site)return null;
      const access=facilityAccess(life,site);
      return {id,minute:life.minute,day:life.day,...access,
        workers:life.villagers.filter(v=>v.work===id).map(v=>({
          name:v.name,job:v.job,at:v.step?.at||null,
          kind:v.step?.kind||null,inside:!!v.inside,
          pathLength:v.path?.length||0,activity:v.activity
        }))};
    },

    houses: houses.map((h) => ({ coordinate: h.coordinate, name: h.name })),
    npcs: streetNPCs.map((x) => ({ id: x.npc.id, name: x.npc.name, coordinate: x.npc.coordinate })),
    npcChat: () => ({ open: npcChat.isOpen(), id: npcChat.active() }),
    talkTo: (id) => npcChat.show(id),
    travel,
    state: () => ({
      workplay:life.civic.workplay||null,
      mode, sleeping, driving: driving.activeVehicle()?.registration||null, nearbyVehicle:nearCar?.registration||null, seated: player.seated ? {key:player.seated.key,label:player.seated.label} : null,
      seats: mode==='house' ? (inside?.seats||[]).map(x=>({key:x.key,type:x.type,label:x.label,pos:x.pos,room:x.room})) : townLife.seats.map(x=>({key:x.key,type:x.type,label:x.label,pos:x.pos})),
      coordinate: inside?.house.coordinate || null, floor: inside?.floorIndex || 0, windows: inside?.windows?.length || 0, floors: inside?.floors?.levels.length || 1, pos: { x: player.pos.x, z: player.pos.z }, yaw: player.yaw, eye: player.eye, y: player.y, fps,
      rooms: inside?.rooms.length || 0, props: inside?.placedProps.length || 0,
      interactables: inside ? inside.interactables.map((x) => ({ key: x.key, label: x.label, title: x.act.title || x.label, do: x.act.do, nav: x.floorNav || null, room: x.roomName })) : [],
      near: nearThing?.key || null, nearNPC: nearNPC?.npc.id || null, nearHouse: nearHouse?.house.coordinate || null,
      panel: panelOpen ? { title: $('panel-title').textContent, text: $('panel-body').textContent, links: [...$('panel-actions').querySelectorAll('a')].map((a) => a.href), buttons: [...$('panel-actions').querySelectorAll('button')].map((b) => b.textContent) } : null,
      people: (mode === 'town' ? townLife.people.map((p) => ({ key: p.key, name: p.v.name, job: p.v.job, x: p.v.x, z: p.v.z, inside: p.v.inside, activity: p.v.activity, visible: p.fig.group.visible })) : (inside?.people || []).map((p) => ({ key: p.key, name: p.name, x: p.pos.x, z: p.pos.z, room: p.room, activity: p.activity, state:p.state||'staff', visible:p.group.visible }))),
      time: life.time(), day: life.day, minute: life.minute, speed: life.speed, daylight: life.daylight(), sound: ambience.on, soundDebug: { ...ambience.debug }, needs:life.needsReport(),
      nearPerson: nearPerson?.key || null,
      active: [...active], playing: playing?.id || null, gameSrc: playing ? $('game-frame').getAttribute('src') : null, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, renderPixelRatio,
    }),
    // Stands the player 1.6 m in front of an exhibit, facing it, so the test then presses Use.
    approach(key) {
      const x = inside?.interactables.find((i) => i.key === key); if (!x) return false;
      const c = new THREE.Vector3((inside.rooms[x.room].x0 + inside.rooms[x.room].x1) / 2, 0, (inside.rooms[x.room].z0 + inside.rooms[x.room].z1) / 2);
      const dir = c.clone().sub(x.pos); dir.y = 0; if (dir.length() < 0.01) dir.set(0, 0, 1); dir.normalize();
      for (const dist of [1.6, 1.9, 1.3, 2.2]) {
        for (const turn of [0, 0.5, -0.5, 1, -1]) {
          const v = dir.clone().applyAxisAngle(new THREE.Vector3(0, 1, 0), turn);
          const p = x.pos.clone().addScaledVector(v, dist);
          const yaw = Math.atan2(-(x.pos.x - p.x), -(x.pos.z - p.z));
          const fwd = new THREE.Vector3(-Math.sin(yaw), 0, -Math.cos(yaw));
          if (!world.hits(p.x, p.z, player.radius + 0.05) && pickNear(p, fwd) === x) { player.place(p.x, p.z, yaw); return true; }
        }
      }
      return false;
    },
    // Test-only seat approach. Physically chooses a clear floor position
    // near the furniture rather than teleporting directly into its collider.
    approachSeat(key) {
      const seat=(mode==='house' ? inside?.seats : townLife.seats)?.find(s=>s.key===key);
      if(!seat)return false;
      for(const radius of [1.15,1.45,1.8,2.1]){
        for(let angle=0;angle<Math.PI*2;angle+=Math.PI/4){
          const x=seat.pos.x+Math.sin(angle)*radius,z=seat.pos.z+Math.cos(angle)*radius;
          if(world.hits(x,z,player.radius+.03))continue;
          player.place(x,z,Math.atan2(-(seat.pos.x-x),-(seat.pos.z-z)));
          return true;
        }
      }
      return false;
    },
    // Stands just inside the entrance facing the exit door.
    toExit() { if (!inside) return false; player.place(inside.spawn.x, inside.spawn.z, Math.PI); return true; },
    place(x, z, yaw) { player.place(x, z, yaw); },
    probe(x, z) { return world.hits(x, z, player.radius); },
    // Buildings and props only: moving trucks' footprints are left out.
    probeStatic(x, z, r = player.radius) { const d = world.dynamic; world.dynamic = null; try { return world.hits(x, z, r); } finally { world.dynamic = d; } },
    // Stands next to a villager who is out and about, facing them.
    meetVillager(i = 0) {
      // Prefers someone walking somewhere, so tests see them stop for the player.
      const out = townLife.people.filter((p) => !p.v.inside).sort((a, b) => (b.v.path.length > 0) - (a.v.path.length > 0));
      const p = out[i % Math.max(1, out.length)]; if (!p) return null;
      if (mode === 'house') leave(false);
      player.place(p.v.x + 1.4, p.v.z, Math.PI / 2); return p.key;
    },
    // Stands at the Town Guide kiosk, facing it.
    meetGuide() { if (mode === 'house') leave(false); player.place(town.guidePos.x, town.guidePos.z + 1.6, 0); return 'guide'; },
    goPlace,
    driveDiagnostics:()=>({
      input:input.movement(),touch:input.touch,
      active:driving.activeVehicle()?.registration||null,
      message:driving.message||null,
      vehicle:driving.activeVehicle()?{...driving.activeVehicle()}:null
    }),
    vehicles:()=>life.motorReport().owned.map(v=>({...v})),
    enterVehicle:(reg)=>driving.enter(life.motorReport().owned.find(v=>v.registration===reg)),
    leaveVehicle:()=>driving.exit(),
    stepVehicle:(seconds)=>driving.update(seconds),
    shops:()=>[...life.places.values()].map(p=>({id:p.id,name:p.name,kind:p.kind,side:p.side||'north',door:{x:p.x,z:p.door.z}})),
    enterShop,
    setFloor:(i)=>changeFloor(i),
    // Where the town's villager figures are drawn (they keep moving while the player is indoors).
    // The named street characters: where they are and whether they are out in town.
    streetPeople:()=>streetNPCs.map(n=>({id:n.npc.id,name:n.npc.name,x:n.pos.x,z:n.pos.z,mode:n.mode||null,visible:n.group?.visible??null})),
    townFigures:()=>townLife.people.map(p=>({key:p.key,x:p.fig.group.position.x,z:p.fig.group.position.z,visible:p.fig.group.visible})),
    // Stands 1.3 m inside window i of the current floor, looking out of it.
    lookOut(i=0){
      const w=inside?.windows?.[i];if(!w)return false;
      const c=(w.s+w.e)/2;
      if(w.axis==='z')player.place(c,w.at-w.out*1.3,w.out<0?0:Math.PI);
      else player.place(w.at-w.out*1.3,c,w.out<0?Math.PI/2:-Math.PI/2);
      return true;
    },
    exitShop:()=>{if(!inside?.place)return false;leave();return true;},
    life: {
      ledger: () => life.ledger(), describe: (i) => life.describe(life.villagers[i]),
      // Jumps the clock (tests): everyone re-plans their day from scratch.
      setWeather(w) { life.civic.weather = w; },
      setTime(minute) { life.minute = minute; life.stats = life.freshStats(); for (const v of life.villagers) { v.step = null; v.path = []; v.queue = []; v.doneToday = {}; } },
      run(minutes) { for (let m = 0; m < minutes; m += 0.5) life.tick(0.5); },
      // A villager's live route and plan, for diagnosing where people walk.
      route: (name) => { const v = life.villagers.find((x) => x.name === name); return v && { x: v.x, z: v.z, bike: !!v.bike, inside: v.inside, path: v.path.map((p) => ({ x: p.x, z: p.z, detour: !!p.detour })), step: v.step && { kind: v.step.kind, at: v.step.at, target: v.step.target } }; },
      speed(n) { life.speed = n; }, trucks: () => life.trucks.map((t) => ({ id:t.id, x:t.x, z:t.z, state:t.state, braking:!!t.braking, load:t.load, wait:t.wait, next:t.path.find(p=>Math.hypot(p.x-t.x,p.z-t.z)>0.1)||null })),
      places: () => [...life.places.values()].map((p) => ({ id: p.id, name: p.name, stock: p.stock, out: p.out, growth: p.growth })),
      parcels: () => life.parcels.length,
    },
    play() { const b = $('panel-actions').querySelector('button.play'); if (b) b.click(); return !!b; },
    stopGame: () => stopGame(),
    answer(i) { const b = $('panel-actions').querySelectorAll('button')[i]; if (b) b.click(); return !!b; },
    closePanel,
  };

  $('loading').hidden = true;
  requestAnimationFrame(frame);
}

start().catch(fail);
