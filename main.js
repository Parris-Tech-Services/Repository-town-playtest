import * as THREE from 'three';
import { CollisionWorld } from './engine/collision.js';
import { Input } from './engine/input.js';
import { Player } from './engine/player.js';
import { loadSave, writeSave, clearSave } from './engine/save.js';
import { buildTown, streetSigns, lotPosition } from './world/town.js';
import { buildInterior, labelVisible } from './world/interior.js';
import { buildCivicInterior } from './world/shop-interior.js';
import { civicExitPose } from './world/shop-exit.js';
import { populateShopStaff } from './world/shop-staff.js';
import { createFloorStack, FLOOR_HEIGHT } from './world/multifloor.js';
import { animate } from './world/builder.js';
import { makeLabel, disposeLabel } from './ui/labels.js';
import { runInteraction, esc } from './ui/interactions.js';
import { setArchiveLoader } from './ui/archive.js';
import { npcBehaviour } from './ui/npc.js';
import { sceneFromRoom } from './ui/scene-awareness.js';
import { mountNPCChat } from './ui/npc-chat.js';
import { makePerson, Walker, houseWander, freeSpot, placeTownNPCs, animateNPCs, initialiseNPCWorksites } from './world/npcs.js';
import { separatePedestrians, steerPedestrians } from './world/pedestrian-spacing.js';
import { createTownLife } from './world/townlife.js';
import { createAmbience } from './ui/ambience.js';
import { bakeryKitchenPanel } from './ui/bakery-panel.js';
import { walletPanel, jobBoardPanel } from './ui/economy-panels.js';
import { placePanel, ledgerPanel, guidePanel, needsPanel, relicsLeft, townContext } from './ui/townpanels.js';
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
  const houses = data.houses;
  const byCoord = new Map(houses.map((h) => [h.coordinate, h]));

  const touch = matchMedia('(pointer: coarse)').matches;
  const renderer = new THREE.WebGLRenderer({ antialias: !touch, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, touch ? 1 : 1.5));
  renderer.setSize(innerWidth, innerHeight);
  renderer.domElement.id = 'scene';
  document.body.prepend(renderer.domElement);
  renderer.domElement.addEventListener('webglcontextlost', (e) => { e.preventDefault(); status('Graphics paused by the device. Reload to continue.'); });

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(SKY);
  const fog = new THREE.Fog(SKY, 60, 170);
  scene.fog = fog;
  const camera = new THREE.PerspectiveCamera(72, innerWidth / innerHeight, 0.15, 185);
  const sky = new THREE.Group();
  const hemi = new THREE.HemisphereLight(0xffffff, 0x6e856e, 2.1); sky.add(hemi);
  const sun = new THREE.DirectionalLight(0xffe7bf, 2.0); sun.position.set(-70, 110, 55); sky.add(sun);
  scene.add(sky);

  const town = buildTown(scene, houses, data.streets);
  // Town life: farms, shops, trucks and 32 villagers with jobs and meals (src/world/life.js).
  const townLife = createTownLife({ scene, town, makeLabel, sky, hemi, sun, fog });
  const life = townLife.life;
  // The Town Guide kiosk by the start (src/world/town.js) opens the guide panel.
  const guideSpot = { key: 'guide', pos: town.guidePos, label: '🗺️ Read the Town Guide', guide: true };
  // Named street characters (src/ui/npc-data.js) with their own AI chat window.
  const streetNPCs = placeTownNPCs(town.group, town.lots, makeLabel);
  initialiseNPCWorksites(streetNPCs, town.group);
  let nearPerson = null, nearNPC = null;
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
  const player = new Player(camera);
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
  const active = new Set();
  const visited = new Set();
  const houseLabels = new Map();
  let nearHouse = null, nearThing = null, panelOpen = null, cardTimer = 0;
  const expedition = createExpedition({town,makeLabel,openPanel,travel,
    releaseMouse:()=>input.releaseMouse()});

  // ── Movement between town and houses ─────────────────────────────────────
  function frontOf(coord) {
    const l = town.lots.get(coord);
    return { x: l.doorPos.x, z: l.doorPos.z + 9, yaw: 0 };
  }
  function travel(coord) {
    if (!town.lots.has(coord)) return false;
    if (mode === 'house') leave(false);
    closePanel(); npcChat.close(); $('npc-roster').hidden = true;
    const f = frontOf(coord);
    player.place(f.x, f.z, f.yaw);
    // A map toggle still queued from a slow bird's-eye frame must not reopen the map.
    input.pressed.delete('map');
    setOverview(false);
    status(`Standing outside ${coord}.`);
    return true;
  }
  // Stands on the footpath outside a shop, farm or the square, facing it.
  function goPlace(id) {
    closePanel(); npcChat.close();
    if (mode === 'house') leave(false);
    const f = townLife.placeFront(id);
    player.place(f.x, f.z, f.yaw ?? 0);
    input.pressed.delete('map'); setOverview(false);
    status(`Outside the ${life.place(id).name}.`);
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
    scene.remove(inside.group);
    const next = floors.levels[target];
    inside = { house, ...next, floorIndex:target, floors, people:next.people || [] };
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
  function interiorToTown(x, z) {
    if (!inside) return { x, z };
    const ex = inside.exitZone ? (inside.exitZone.x0 + inside.exitZone.x1) / 2 : 0;
    const ez = inside.rooms?.[0]?.z1 ?? 0;
    if (inside.place) {
      const c = Math.cos(doorTurn(inside.place));
      return { x: inside.place.x + (x - ex) * c, z: inside.place.door.z + (z - ez) * c };
    }
    const l = town.lots.get(inside.house.coordinate);
    return l ? { x: l.doorPos.x + (x - ex), z: l.doorPos.z + (z - ez) } : { x, z };
  }
  function syncOutdoorView() {
    if (mode !== 'house' || !inside) {
      town.group.position.set(0, 0, 0);
      town.group.rotation.y = 0;
      town.group.visible = true;
      for (const p of life.places.values()) if (p.mesh) p.mesh.visible = true;
      for (const s of houseLabels.values()) s.visible = true;
      return;
    }
    const ex = inside.exitZone ? (inside.exitZone.x0 + inside.exitZone.x1) / 2 : 0;
    const ez = inside.rooms?.[0]?.z1 ?? 0;
    for (const p of life.places.values()) if (p.mesh) p.mesh.visible = p !== inside.place;
    if (inside.place) {
      const rot = -doorTurn(inside.place), c = Math.cos(rot);
      town.group.rotation.y = rot;
      town.group.position.set(ex - inside.place.x * c, -0.09, ez - inside.place.door.z * c);
    } else {
      const l = town.lots.get(inside.house.coordinate);
      town.group.rotation.y = 0;
      if (l) town.group.position.set(ex - l.doorPos.x, -0.09, ez - l.doorPos.z);
    }
    town.group.visible = true;
    scene.fog = fog;
  }
  function enter(coord, keepFacing = false) {
    const yawIn = player.yaw;
    const h = byCoord.get(coord);
    const floors = createFloorStack(h, makeLabel);
    const built = floors ? floors.levels[0] : buildInterior(h, makeLabel);
    inside = { house: h, ...built, floorIndex:0, floors };
    scene.add(built.group);
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
    syncOutdoorView();
    $('btn-exit').hidden = false;
    visited.add(coord);
    expedition.noteVisit(coord);
    ambience.door();
    closePanel();
    status(floors ? `Inside ${h.coordinate} · ${h.name}. Tap 🛗 Floors under the town clock to visit the upper storeys, or follow the stairs and lift sign.` : `Inside ${h.coordinate} · ${h.name}. Walk back through the front door to leave.`);
    showCard(h, true);
    cardTimer = 6;
  }
  // The high-street buildings now have their own walkable rooms and usable
  // counters. Keep the existing villager/farm economy running in the street.
  function enterShop(id, keepFacing = false) {
    if(mode!=='town'||!life.places.has(id))return false;
    const yawIn = player.yaw;
    const site=life.place(id), built=buildCivicInterior(site,makeLabel);
    const staff=populateShopStaff(site,life,built,makeLabel);
    const brief={coordinate:site.col+'8',name:site.name,kind:site.kind,
      street:'High Street',summary:'Explore the shop interior and speak to staff.'};
    inside={house:brief,place:site,...built,people:staff};
    scene.add(built.group);
    world=new CollisionWorld(built.colliders);
    player.place(built.spawn.x,built.spawn.z,keepFacing ? yawIn - doorTurn(site) : 0);
    mode='house';syncOutdoorView();$('btn-exit').hidden=false;
    closePanel();npcChat.close();ambience.door();
    $('card').hidden=true;delete $('card').dataset.coord;
    status('Inside '+site.name+'. Walk to the counter or back through the entrance to leave.');
    return true;
  }
  function leave(placeOutside = true, keepFacing = false) {
    if (!inside) return;
    const yawInside = player.yaw;
    closePanel(); npcChat.close();
    const coord = inside.house.coordinate;
    const shop=inside.place||null;
    scene.remove(inside.group);
    for (const group of (inside.floors ? inside.floors.levels.map(x => x.group) : [inside.group])) {
      group.traverse((o) => { if (o.isSprite) disposeLabel(o); else if (o.geometry && o.geometry.type !== 'BoxGeometry') o.geometry.dispose(); });
    }
    inside = null; mode = 'town'; world = townWorld;
    player.baseHeight = 0; updateFloorBadge();
    $('btn-exit').hidden = true;
    syncOutdoorView(); scene.background.set(SKY); scene.fog = fog;
    if (placeOutside) {
      if (shop) {
        const pose = civicExitPose(shop, [...townWorld.all, ...townWorld.dynamic()], player.radius+0.08);
        if (pose) player.place(pose.x,pose.z,keepFacing ? yawInside + doorTurn(shop) : pose.yaw);
        else spawn(); // use safe Town Guide location instead of clipping into a wall
      } else { const l=town.lots.get(coord);player.place(l.doorPos.x, l.doorPos.z + 4, keepFacing ? yawInside : Math.PI); }
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
    scene.fog = overview ? null : fog;
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
  for (const h of houses) { const o = document.createElement('option'); o.value = `${h.coordinate} · ${h.name}`; list.append(o); }
  $('search-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const q = $('search').value.trim().toLowerCase(); if (!q) return;
    const code = q.split(' ')[0].toUpperCase();
    const h = byCoord.get(code) || houses.find((h) => h.name.toLowerCase() === q) || houses.find((h) => h.name.toLowerCase().includes(q) || `${h.coordinate} · ${h.name}`.toLowerCase() === q);
    if (h) { travel(h.coordinate); $('search').blur(); } else status(`No house matches "${$('search').value}".`);
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
    if (e.target?.closest?.('input,textarea,select,[contenteditable],#panel,#game,#npc-chat')) return;
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
    $('card').innerHTML = `<h2>${esc(h.coordinate)} · ${esc(h.name)}</h2><p class="kind">${esc(h.kind)} · ${esc(h.street)}</p><p>${esc(h.summary)}</p>${links ? `<p>${links}</p>` : ''}${insideNow ? '' : '<p class="dim">Walk to the door to go inside.</p>'}`;
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
      else { const el = document.createElement('button'); el.textContent = a.label; el.onclick = () => { if (a.play) return startGame(a.play); const next = a.run ? a.run() : content.onAnswer(a.answer); if (next) openPanel(next, thing); };
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
    return pick;
  }
  // Relics, street characters, villagers, the guide and shop counters can stand close
  // together, so Use goes to whichever is nearest; everything stays reachable.
  const away = (p) => (p ? Math.hypot(player.pos.x - p.pos.x, player.pos.z - p.pos.z) : Infinity);
  function use() {
    if (mode === 'town') {
      const treasure = expedition.nearby(player.pos), treasureD = away(treasure), npcD = away(nearNPC), personD = away(nearPerson);
      if (treasure && treasureD <= npcD && treasureD <= personD) { expedition.use(player.pos); ambience.relic(); return; }
      if (nearNPC && npcD <= personD) { input.releaseMouse(); closePanel(); $('npc-roster').hidden = true; npcChat.show(nearNPC.npc, null); input.reset(); return; }
      if (nearPerson) { if(nearPerson.spot){enterShop(nearPerson.spot.id);return;} talkTo(nearPerson); return; }
      if (nearHouse) showCard(nearHouse.house);
      return;
    }
    if (nearThing) {
      if (nearThing.floorNav) {
        if (nearThing.floorNav === 'lift') openLift();
        else changeFloor(nearThing.target);
        return;
      }
      const thing = nearThing, request = ++interactionRequest, house = inside;
      if(thing.act?.do==='sleep') {
        if(inside?.place?.id==='hotel') {
          const room=Number(thing.act.room)||null;
          const n=life.needsReport();
          openPanel({title:'Railway Hotel · '+thing.label,
            body:'<p>'+esc(n.booking?'You have a booking for room '+n.booking.room+'.':'You need a room key from hotel reception first.')+'</p>'+
              '<p>Sleep in your allocated room. Time, deliveries, wages and village routines continue overnight.</p>',
            actions:[{label:'Sleep in this bed',run:()=>{
              const msg=life.sleepHotel(room),p=needsPanel(life);
              return {...p,body:'<p><b>'+esc(msg)+'</b></p>'+p.body};
            }},{label:'Hotel reception',run:()=>placePanel(life,'hotel')}]},thing);
        } else {
          openPanel({title:'Someone else’s bed',
            body:'<p>This is a private home. Its residents need their beds to sleep. To stay overnight, book your own room at the Railway Hotel, I8.</p>',
            actions:[]},thing);
        }
        return;
      }
      if(inside?.place&&thing.act?.do==='bakery-kitchen'){
        openPanel(bakeryKitchenPanel(life),thing);
        return;
      }
      if(inside?.place&&thing.act?.do==='civic-ledger'){
        const p=inside.place;
        openPanel(placePanel(life,p.id),thing);
        return;
      }
      const person = thing.person && inside.people?.find((p) => p.key === thing.key);
      if (person) {
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
  let saveTimer = 0;
  const save = () => writeSave({ pos: { x: player.pos.x, z: player.pos.z }, yaw: player.yaw, inside: inside&&!inside.place?inside.house.coordinate:null, insideShop:inside?.place?.id||null, visited: [...visited] });
  addEventListener('visibilitychange', () => { if (document.hidden) { save(); townLife.save(); } });
  addEventListener('pagehide', () => { save(); townLife.save(); });
  const syncSound = () => { $('btn-sound').textContent = ambience.on ? '🔊 Sound' : '🔇 Sound'; $('btn-sound').setAttribute('aria-pressed', String(ambience.on)); };
  $('btn-sound').onclick = () => { ambience.setOn(!ambience.on); syncSound(); status(ambience.on ? 'Town sound on.' : 'Town sound muted.'); };
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
  const tmp = new THREE.Vector3();
  function frame() {
    // Up to 0.15 s per frame keeps walking real-time on slow phones; collision subdivides the step.
    const raw = clock.getDelta(), dt = Math.min(raw, 0.15), t = clock.elapsedTime;
    floorDoorCooldown = Math.max(0, floorDoorCooldown - dt);
    frames++; fpsTimer += raw; if (fpsTimer > 1) { fps = frames / fpsTimer; frames = 0; fpsTimer = 0; }
    // While a game is open the town neither renders nor reacts, so the game gets the whole device.
    if (playing) {
      if (input.consume('back')) stopGame();
      input.takeLook(); for (const k of ['use', 'jump', 'map']) input.consume(k);
      requestAnimationFrame(frame);
      return;
    }
    if (input.consume('map')) setOverview(!overview);
    if (input.consume('back')) { if (expedition.isOpen()) expedition.dismiss(); else if (npcChat.isOpen()) npcChat.close(); else if (!$('npc-roster').hidden) $('npc-roster').hidden = true; else if (panelOpen) closePanel(); else if (!$('help').hidden) $('help').hidden = true; else setOverview(false); }
    if(expedition.isOpen()){input.keys.clear();input.takeLook();input.pressed.delete('use');}
    if (overview) {
      camera.position.set(player.pos.x, 150, player.pos.z + 95); camera.lookAt(player.pos.x, 0, player.pos.z);
      input.takeLook(); input.consume('jump');
    } else if (expedition.isOpen() || panelOpen || npcChat.isOpen() || !$('npc-roster').hidden || !$('help').hidden) input.reset();
    else {
      const n=life.needsReport();
      player.speedFactor=Math.max(0.45,1-(n.hunger>80?0.23:0)-(n.fatigue>75?0.32:0));
      player.update(dt,input,world);
    }
    const movedDist = Math.hypot(player.pos.x - prevX, player.pos.z - prevZ);
    prevX = player.pos.x; prevZ = player.pos.z;

    // The town keeps living while the player is indoors; the sky follows its clock.
    const talkingTo = panelOpen?.thing?.v ? panelOpen.thing : null;
    life.playerAt = mode === 'house' && inside?.place ? inside.place.id : null; // shifts count only inside the workplace
    life.pedestrianWorld=townWorld;
    life.externalPedestrians=mode==='town'
      ?streetNPCs.filter(n=>n.mode==='town').map(n=>({x:n.pos.x,z:n.pos.z,radius:.66}))
      :[];
    townLife.update(dt, t, { player, mode, overview, camera, talkingTo, inside });
    const n=life.needsReport();
    const needsText=`🍽 ${Math.round(n.hunger)}% · 💤 ${Math.round(n.fatigue)}%`;
    if($('needs-status').textContent!==needsText)$('needs-status').textContent=needsText;
    const clockText = `🕖 ${life.time()} · Day ${life.day}${life.speed > 1 ? ` · ${life.speed}×` : ''}`;
    if ($('clock').textContent !== clockText) $('clock').textContent = clockText;
    syncTimeBtn();
    {
      let truck = Infinity; for (const tr of life.trucks) truck = Math.min(truck, Math.hypot(tr.x - player.pos.x, tr.z - player.pos.z));
      const busy = Math.min(1, townLife.people.filter((p) => !p.v.inside && Math.abs(p.v.x - player.pos.x) < 25 && Math.abs(p.v.z - player.pos.z) < 25).length / 5);
      for (const e of townLife.events.splice(0)) ambience.play(e, mode === 'house' ? 300 : Math.hypot(e.x - player.pos.x, e.z - player.pos.z));
      ambience.update(dt, { day: life.daylight(), busy: mode === 'town' ? busy : 0, truck: mode === 'town' ? truck : Infinity, indoors: mode === 'house', moving: movedDist > 0.015, running: movedDist > dt * 5.2 });
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
      const namedLabels=[
        ...nearbyPeople.filter(p=>p.fig.group.visible).map(p=>({label:p.tag,pos:p.v,
          distance:Math.hypot(p.v.x-player.pos.x,p.v.z-player.pos.z)})),
        ...nearbyCharacters.filter(n=>n.group.visible).map(n=>({label:n.group.userData.label,pos:n.pos,
          distance:Math.hypot(n.pos.x-player.pos.x,n.pos.z-player.pos.z)}))
      ].filter(x=>x.label?.visible).sort((a,b)=>a.distance-b.distance);
      const displayed=[];
      for(const item of namedLabels){
        if(displayed.some(p=>Math.hypot(p.pos.x-item.pos.x,p.pos.z-item.pos.z)<2.3))item.label.visible=false;
        else displayed.push(item);
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
      for (const z of town.doorZones) {
        if (player.pos.x > z.x0 && player.pos.x < z.x1 && player.pos.z > z.z0 && player.pos.z < z.z1) {
          const d = town.doors.find((d) => d.userData.coordinate === z.coordinate);
          if (d.userData.open > 0.6) { enter(z.coordinate, true); break; }
        }
      }
      // Walk into an actual 3D shop interior when crossing the open shopfront.
      // The outside facades are collision solids, so the transition happens
      // just in front of their door (not inside an inaccessible wall).
      if(mode==='town' && !overview){
        for(const place of life.places.values()){
          if(Math.abs(player.pos.x-place.x)<.93 &&
             player.pos.z>=place.door.z-.12 &&
             player.pos.z<=place.door.z+.92){
            enterShop(place.id, true);
            break;
          }
        }
      }
      if (nearHouse && $('card').dataset.coord !== nearHouse.house.coordinate) { showCard(nearHouse.house); $('card').dataset.coord = nearHouse.house.coordinate; }
      if (!nearHouse && $('card').dataset.coord) { $('card').hidden = true; delete $('card').dataset.coord; }
      // House name boards are created only near the player to keep GPU memory low on phones.
      for (const [c, l] of town.lots) {
        const d = Math.hypot(l.doorPos.x - player.pos.x, l.doorPos.z - player.pos.z), has = houseLabels.get(c);
        if (d < labelCull && !has) { const s = makeLabel(`${c} · ${l.house.name}`, 'house'); s.position.set(l.doorPos.x, 3.7, l.doorPos.z + 3.4); /* clear of colonnades and pagoda eaves */ town.group.add(s); houseLabels.set(c, s); }
        else if (d > labelCull + 15 && has) { town.group.remove(has); disposeLabel(has); houseLabels.delete(c); }
      }
      const nearRelic = expedition.nearby(player.pos), relicD = away(nearRelic), npcD = away(nearNPC), personD = away(nearPerson);
      $('prompt').hidden = (!nearNPC && !nearPerson && !nearHouse && !nearRelic) || !!panelOpen || expedition.isOpen() || npcChat.isOpen() || !$('npc-roster').hidden;
      if (nearRelic && relicD <= npcD && relicD <= personD) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ✨ ${nearRelic.id === 'guild' ? 'Guild Chest' : nearRelic.name}`;
      else if (nearNPC && npcD <= personD) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — 💬 Talk to ${nearNPC.npc.name}`;
      else if (nearPerson) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ${nearPerson.v ? `Talk to ${nearPerson.v.name} (${nearPerson.v.job}) · ${nearPerson.v.activity.replace(/^(walking|cycling) — /, '')}` : nearPerson.label}`;
      else if (nearHouse) $('prompt').textContent = `${nearHouse.house.coordinate} · ${nearHouse.house.name} — walk through the door to enter`;
      if (input.consume('use')) use();
    } else {
      // Keep the surrounding street visible through the windows while hiding the active building's exterior shell.
      const tp = interiorToTown(player.pos.x, player.pos.z);
      const b0 = inside.bounds ? interiorToTown(inside.bounds.x0, inside.bounds.z0) : tp;
      const b1 = inside.bounds ? interiorToTown(inside.bounds.x1, inside.bounds.z1) : tp;
      const tx0 = Math.min(b0.x, b1.x), tx1 = Math.max(b0.x, b1.x), tz0 = Math.min(b0.z, b1.z), tz1 = Math.max(b0.z, b1.z);
      const houseCull = lowPerf ? 115 : 175, npcCull = lowPerf ? 48 : 65;
      for (const l of town.lots.values()) {
        const isSelf = !inside.place && l.house.coordinate === inside.house.coordinate;
        const overlaps = l.lot.x + l.lot.w / 2 > tx0 + 0.5 && l.lot.x - l.lot.w / 2 < tx1 - 0.5 && l.lot.z + l.lot.d / 2 > tz0 + 0.5 && l.lot.z - l.lot.d / 2 < tz1 - 0.5;
        const d = Math.hypot(l.doorPos.x - tp.x, l.doorPos.z - tp.z);
        if (l.mesh) l.mesh.visible = !isSelf && !overlaps && d < houseCull;
      }
      for (const d of town.doors) {
        const isSelf = !inside.place && d.userData.coordinate === inside.house.coordinate;
        const overlaps = d.userData.centre.x > tx0 - 0.5 && d.userData.centre.x < tx1 + 0.5 && d.userData.centre.z > tz0 - 0.5 && d.userData.centre.z < tz1 + 0.5;
        const dist = Math.hypot(d.userData.centre.x - tp.x, d.userData.centre.z - tp.z);
        d.visible = !isSelf && !overlaps && dist < (lowPerf ? 65 : 110);
      }
      for (const [c, s] of houseLabels) {
        s.visible = (!inside.place ? c !== inside.house.coordinate : true) && !(s.position.x > tx0 - 1 && s.position.x < tx1 + 1 && s.position.z > tz0 - 1 && s.position.z < tz1 + 4);
      }
      animateNPCs(streetNPCs, t, new THREE.Vector3(tp.x, 0, tp.z), dt, null, townWorld, npcCull);
      for (const n of streetNPCs) {
        if (n.pos.x > tx0 - 0.6 && n.pos.x < tx1 + 0.6 && n.pos.z > tz0 - 0.6 && n.pos.z < tz1 + 0.6) n.group.visible = false;
      }
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
        nearThing = pickNear();
        nearNPC = null;
        $('prompt').hidden = !nearThing || !!panelOpen || npcChat.isOpen() || !$('npc-roster').hidden;
        const who = nearThing?.person && inside.people?.find((p) => p.key === nearThing.key);
        if (nearThing) $('prompt').textContent = `${input.touch ? 'Tap ✋' : 'Press E'} — ${nearThing.label}${who ? ` · ${who.activity}` : ''}`;
        if (input.consume('use')) use();
        animate(inside.dynamics, t, active);
        for (const p of inside.people || []) p.update(dt, t, player, p.plan);
        if (cardTimer > 0 && (cardTimer -= dt) <= 0) $('card').hidden = true;
        // Labels hide when the player is right on top of them so they never fill the screen,
        // and when a wall or closed door stands between them and the camera.
        for (const s of inside.group.children) if (s.isSprite) s.visible = Math.hypot(s.position.x - player.pos.x, s.position.z - player.pos.z) > (s.userData.labelKind === 'room' ? 2.6 : 1.3) && labelVisible(new THREE.Vector3(camera.position.x, camera.position.y - (inside.floorIndex || 0) * FLOOR_HEIGHT, camera.position.z), s.position, inside.sight);
      }
    }
    if (mode === 'town') input.consume('use');
    expedition.update(t,player,mode);
    mapTimer += dt; if (mapTimer > 0.2) { drawMap(); mapTimer = 0; }
    saveTimer += dt; if (saveTimer > 3) { save(); saveTimer = 0; }
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

  // Test hook: lets the browser test suite drive real gameplay deterministically.
  window.__town = {
    houses: houses.map((h) => ({ coordinate: h.coordinate, name: h.name })),
    npcs: streetNPCs.map((x) => ({ id: x.npc.id, name: x.npc.name, coordinate: x.npc.coordinate })),
    npcChat: () => ({ open: npcChat.isOpen(), id: npcChat.active() }),
    talkTo: (id) => npcChat.show(id),
    travel,
    state: () => ({
      mode, coordinate: inside?.house.coordinate || null, floor: inside?.floorIndex || 0, floors: inside?.floors?.levels.length || 1, pos: { x: player.pos.x, z: player.pos.z }, yaw: player.yaw, eye: player.eye, y: player.y, fps,
      rooms: inside?.rooms.length || 0, props: inside?.placedProps.length || 0, windows: inside?.windows?.length || 0,
      interactables: inside ? inside.interactables.map((x) => ({ key: x.key, label: x.label, title: x.act.title || x.label, do: x.act.do, nav: x.floorNav || null, room: x.roomName })) : [],
      near: nearThing?.key || null, nearNPC: nearNPC?.npc.id || null, nearHouse: nearHouse?.house.coordinate || null,
      panel: panelOpen ? { title: $('panel-title').textContent, text: $('panel-body').textContent, links: [...$('panel-actions').querySelectorAll('a')].map((a) => a.href), buttons: [...$('panel-actions').querySelectorAll('button')].map((b) => b.textContent) } : null,
      people: (mode === 'town' ? townLife.people.map((p) => ({ key: p.key, name: p.v.name, job: p.v.job, x: p.v.x, z: p.v.z, inside: p.v.inside, activity: p.v.activity, visible: p.fig.group.visible })) : (inside?.people || []).map((p) => ({ key: p.key, name: p.name, x: p.pos.x, z: p.pos.z, room: p.room, activity: p.activity }))),
      time: life.time(), day: life.day, minute: life.minute, speed: life.speed, daylight: life.daylight(), sound: ambience.on, needs:life.needsReport(),
      nearPerson: nearPerson?.key || null,
      active: [...active], playing: playing?.id || null, gameSrc: playing ? $('game-frame').getAttribute('src') : null, calls: renderer.info.render.calls, triangles: renderer.info.render.triangles,
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
    // Stands just inside the entrance facing the exit door.
    toExit() { if (!inside) return false; player.place(inside.spawn.x, inside.spawn.z, Math.PI); return true; },
    place(x, z, yaw) { player.place(x, z, yaw); },
    probe(x, z) { return world.hits(x, z, player.radius); },
    // Buildings and props only: moving trucks' footprints are left out.
    probeStatic(x, z) { const d = world.dynamic; world.dynamic = null; try { return world.hits(x, z, player.radius); } finally { world.dynamic = d; } },
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
    shops:()=>[...life.places.values()].map(p=>({id:p.id,name:p.name,kind:p.kind,side:p.side||'north',door:{x:p.x,z:p.door.z}})),
    enterShop,
    setFloor:(i)=>changeFloor(i),
    exitShop:()=>{if(!inside?.place)return false;leave();return true;},
    life: {
      ledger: () => life.ledger(), describe: (i) => life.describe(life.villagers[i]),
      // Jumps the clock (tests): everyone re-plans their day from scratch.
      setTime(minute) { life.minute = minute; life.stats = life.freshStats(); for (const v of life.villagers) { v.step = null; v.path = []; v.queue = []; v.doneToday = {}; } },
      run(minutes) { for (let m = 0; m < minutes; m += 0.5) life.tick(0.5); },
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
