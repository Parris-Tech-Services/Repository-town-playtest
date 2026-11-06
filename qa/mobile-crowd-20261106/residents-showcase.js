// Resident Studio: a playable, dependency-light showcase for the visual identity system.
// It deliberately does NOT import the town simulation. It proves that the same identity record
// drives face, body, clothing and animation, and that the figure can be inspected at three LODs.
import * as THREE from 'three';
import { identityFor, outfitFor, describeIdentity, appearanceSignature } from './world/resident-identity.js';
import { makeResidentFigure, poseResident } from './world/resident-figure.js';

const PEOPLE = [
  { id: 'demo:ada', name: 'Ada Whitfield', age: 34, gender: 'female', job: 'registered nurse', workplaceKind: 'hospital', workplaceName: 'Narromine Hospital', role: 'parent' },
  { id: 'demo:tom', name: 'Tom Fraser', age: 41, gender: 'male', job: 'diesel mechanic', workplaceKind: 'car_repair', workplaceName: 'Dandaloo Motors', role: 'parent' },
  { id: 'demo:esme', name: 'Esme Carter', age: 8, gender: 'female', job: 'student', workplaceKind: 'school', workplaceName: 'Narromine Public School', role: 'child' },
  { id: 'demo:noah', name: 'Noah Bennett', age: 16, gender: 'male', job: 'student', workplaceKind: 'school', workplaceName: 'Narromine High School', role: 'child' },
  { id: 'demo:priya', name: 'Priya Nair', age: 29, gender: 'female', job: 'supermarket team member', workplaceKind: 'supermarket', workplaceName: 'Coles Narromine', role: 'adult' },
  { id: 'demo:russ', name: 'Russell Doyle', age: 58, gender: 'male', job: 'farmer', workplaceKind: 'agrarian', workplaceName: 'west of Narromine', role: 'parent' },
  { id: 'demo:june', name: 'June Whitlock', age: 73, gender: 'female', job: 'retired', workplaceKind: '', workplaceName: '', role: 'retiree' },
  { id: 'demo:harry', name: 'Harry Nguyen', age: 23, gender: 'male', job: 'apprentice electrician', workplaceKind: 'trade', workplaceName: 'Narromine Electrical', role: 'adult' },
  { id: 'demo:mai', name: 'Mai Tran', age: 37, gender: 'female', job: 'teacher', workplaceKind: 'school', workplaceName: 'Narromine High School', role: 'parent' },
  { id: 'demo:colin', name: 'Colin Marsh', age: 66, gender: 'male', job: 'postal worker', workplaceKind: 'post_office', workplaceName: 'Narromine Post Office', role: 'adult' },
  { id: 'demo:ruby', name: 'Ruby Kelly', age: 12, gender: 'female', job: 'student', workplaceKind: 'school', workplaceName: 'St Augustines Parish School', role: 'child' },
  { id: 'demo:sam', name: 'Sam Okafor', age: 31, gender: 'male', job: 'police officer', workplaceKind: 'police', workplaceName: 'Narromine Police Station', role: 'adult' },
  { id: 'demo:lena', name: 'Lena Petrova', age: 45, gender: 'female', job: 'publican', workplaceKind: 'pub', workplaceName: 'Royal Hotel', role: 'parent' },
  { id: 'demo:kai', name: 'Kai Williams', age: 19, gender: 'male', job: 'barista', workplaceKind: 'cafe', workplaceName: 'Dandaloo Café', role: 'adult' },
  { id: 'demo:dot', name: 'Dot Hennessy', age: 81, gender: 'female', job: 'retired', workplaceKind: '', workplaceName: '', role: 'retiree' },
  { id: 'demo:omar', name: 'Omar Haddad', age: 52, gender: 'male', job: 'council officer', workplaceKind: 'townhall', workplaceName: 'Narromine Shire Council', role: 'parent' },
];
const ANIMATIONS = [
  { id: 'idle', label: 'Idle', activity: 'home', moving: false, note: 'weight shift, breathing, glances' },
  { id: 'walk', label: 'Walk', activity: 'walk', moving: true, note: 'stride, knees, arm swing, head' },
  { id: 'talk', label: 'Talk', activity: 'talk', moving: false, note: 'gesture, head turn, mouth' },
  { id: 'sit', label: 'Sit', activity: 'sit', moving: false, note: 'hips, knees, feet' },
  { id: 'eat', label: 'Eat', activity: 'dinner', moving: false, note: 'seated, hand to mouth' },
  { id: 'carry', label: 'Carry', activity: 'carry shopping', moving: true, note: 'arms hold the load' },
  { id: 'work', label: 'Work', activity: 'work shift', moving: false, note: 'hands at the task' },
  { id: 'sleep', label: 'Sleep', activity: 'asleep', moving: false, note: 'lying, closed eyes' },
];
const CONTEXTS = [
  { id: 'home', label: 'Home' },
  { id: 'work', label: 'Work' },
  { id: 'rain', label: 'Rain' },
  { id: 'night', label: 'Night' },
  { id: 'exercise', label: 'Exercise' },
];
const LODS = [
  { id: 0, label: 'Near' },
  { id: 1, label: 'Mid' },
  { id: 3, label: 'Far' },
];

const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const hex = (n) => '#' + (n >>> 0).toString(16).padStart(6, '0');
const roster = PEOPLE.map((person) => {
  const identity = identityFor(person.id, person, { activity: 'home', minute: 9 * 60, weather: 'sunny' });
  return { person, identity, signature: appearanceSignature(identity) };
});
let selected = 0, animation = ANIMATIONS[0], context = CONTEXTS[0], lod = 0, crowd = false;

// ---------- WebGL acquisition (resilient) ----------
// The game runs on laptops and emulated phones where WebGL can be slow, software-rendered or
// temporarily unavailable. Try several configurations, each on a fresh canvas, before giving
// up and showing an honest 2D fallback instead of crashing on "Building residents…".
function createRenderer() {
  const attempts = [
    { antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: false },
    { antialias: false, alpha: true, preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: false },
    { antialias: false, alpha: true, preserveDrawingBuffer: false, failIfMajorPerformanceCaveat: false },
  ];
  for (const opts of attempts) {
    const cv = document.createElement('canvas');
    try {
      const r = new THREE.WebGLRenderer({ canvas: cv, ...opts });
      swapStageCanvas(cv);
      return r;
    } catch (err) {
      console.warn('Resident Studio: WebGL attempt failed:', err && err.message);
    }
  }
  // Last resort: request the raw context ourselves so three.js receives an existing context.
  for (const name of ['webgl2', 'webgl', 'experimental-webgl']) {
    const cv = document.createElement('canvas');
    let gl = null;
    try { gl = cv.getContext(name, { antialias: false, alpha: true, failIfMajorPerformanceCaveat: false }); } catch { /* try next */ }
    if (!gl) continue;
    try {
      const r = new THREE.WebGLRenderer({ canvas: cv, context: gl, alpha: true });
      swapStageCanvas(cv);
      return r;
    } catch (err) {
      console.warn('Resident Studio: raw WebGL context failed:', err && err.message);
    }
  }
  return null;
}
function swapStageCanvas(cv) {
  cv.id = 'stage';
  const old = $('stage');
  if (old && old !== cv) old.replaceWith(cv);
}
function swatch(colour) { return `<span class="swatch" style="background:${hex(colour)}"></span>`; }
function faceSVG(i) {
  const hair = hex(i.hair.base), skin = hex(i.skin.base), shirt = hex(i.clothing.shirt);
  const glasses = i.accessories.glasses;
  return `<svg viewBox="0 0 120 150" role="img" aria-label="${esc(i.name)} portrait">
    <rect x="10" y="108" width="100" height="42" rx="18" fill="${shirt}"/>
    <path d="M18 118 Q60 92 102 118 L96 96 Q60 78 24 96 Z" fill="${skin}"/>
    <circle cx="60" cy="60" r="34" fill="${skin}"/>
    <path d="M26 58 Q30 20 60 22 Q90 20 94 58 L92 44 Q88 34 60 34 Q32 34 28 44 Z" fill="${hair}"/>
    <path d="M26 54 Q28 40 44 30 Q30 42 32 58 Z" fill="${hair}"/>
    <path d="M94 54 Q92 40 76 30 Q90 42 88 58 Z" fill="${hair}"/>
    <circle cx="47" cy="62" r="4.5" fill="#171310"/><circle cx="73" cy="62" r="4.5" fill="#171310"/>
    <circle cx="48.5" cy="60.5" r="1.5" fill="#fff"/><circle cx="74.5" cy="60.5" r="1.5" fill="#fff"/>
    <path d="M56 74 Q60 78 64 74" stroke="${hex(i.skin.shade)}" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <path d="M60 78 Q58 86 52 88 M60 78 Q62 86 68 88" stroke="${hex(i.skin.lip)}" stroke-width="3" fill="none" stroke-linecap="round"/>
    ${glasses ? '<circle cx="47" cy="62" r="9" fill="none" stroke="#2a2f36" stroke-width="2"/><circle cx="73" cy="62" r="9" fill="none" stroke="#2a2f36" stroke-width="2"/><path d="M56 62 L64 62" stroke="#2a2f36" stroke-width="2"/>' : ''}
  </svg>`;
}
function renderFallback() {
  document.body.classList.add('no-webgl');
  $('studio-status').textContent = 'WebGL is unavailable in this browser — showing 2D identity portraits';
  $('stage-label').textContent = '2D fallback · the 3D studio needs WebGL/GPU enabled';
  $('stage-help').textContent = 'Enable hardware acceleration or relaunch with a software GL flag (e.g. --use-gl=swiftshader) to see the 3D figures.';
  const wrap = $('stage-wrap');
  const gallery = document.createElement('div');
  gallery.id = 'fallback-gallery';
  gallery.innerHTML = roster.map((r) => {
    const i = r.identity;
    return `<figure class="fallback-card">
      ${faceSVG(i)}
      <figcaption><strong>${esc(i.name)}</strong><span>${i.age} · ${esc(i.occupation)}</span>
      <span class="roster-colours">${swatch(i.clothing.shirt)}${swatch(i.clothing.trousers)}${swatch(i.hair.base)}${swatch(i.skin.base)}</span>
      </figcaption></figure>`;
  }).join('');
  wrap.appendChild(gallery);
  window.__residentStudio = {
    ready: true, fallback: true, webgl: false,
    identities: () => roster.map((r) => ({ id: r.identity.id, name: r.identity.name, age: r.identity.age, gender: r.identity.gender, occupation: r.identity.occupation, signature: r.signature, outfit: r.identity.outfit.key })),
    state: () => ({ index: selected, crowd: false, lod: 0, animation: 'idle', context: 'home', fallback: true, webgl: false, visibleMeshes: 0, figureMeshes: 0, identity: { id: roster[selected].identity.id, name: roster[selected].identity.name, age: roster[selected].identity.age, occupation: roster[selected].identity.occupation, height: +roster[selected].identity.body.height.toFixed(3), signature: roster[selected].signature }, animations: ANIMATIONS.map((a) => a.id), contexts: CONTEXTS.map((c) => c.id) }),
    animation: () => window.__residentStudio.state(),
    context: () => window.__residentStudio.state(),
    lod: () => window.__residentStudio.state(),
    crowd: () => window.__residentStudio.state(),
  };
}

const renderer = createRenderer();
if (!renderer) {
  renderFallback();
} else {
  // ---------- Three.js stage ----------
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .98;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0x0b1220, 9, 22);
  const camera = new THREE.PerspectiveCamera(34, 1, .05, 60);
  const cameraTarget = new THREE.Vector3(0, 1.02, 0);
  let orbit = .28, elevation = .12, distance = 4.6;
  function placeCamera() {
    const r = distance;
    camera.position.set(Math.sin(orbit) * r * Math.cos(elevation), 1.02 + Math.sin(elevation) * r, Math.cos(orbit) * r * Math.cos(elevation));
    camera.lookAt(cameraTarget);
  }

  const hemi = new THREE.HemisphereLight(0xdfeaff, 0x23324a, 1.25); scene.add(hemi);
  const key = new THREE.DirectionalLight(0xfff1db, 2.15); key.position.set(3.4, 6.5, 3.8);
  key.castShadow = true; key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = -4; key.shadow.camera.right = 4; key.shadow.camera.top = 5; key.shadow.camera.bottom = -1; key.shadow.bias = -0.0004;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0x7fb7ff, 1.5); rim.position.set(-3.5, 2.4, -4); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffd6a8, .55); fill.position.set(-2, 1.5, 3); scene.add(fill);

  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 84), new THREE.MeshStandardMaterial({ color: 0x172335, roughness: .78, metalness: .12 }));
  floor.rotation.x = -Math.PI / 2; floor.position.y = -.006; floor.receiveShadow = true; scene.add(floor);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0x3a5b7a, transparent: true, opacity: .35 });
  for (const radius of [1.15, 1.9, 3.1]) { const ring = new THREE.Mesh(new THREE.RingGeometry(radius, radius + .008, 96), ringMat); ring.rotation.x = -Math.PI / 2; ring.position.y = .002; scene.add(ring); }
  const backdrop = new THREE.Mesh(new THREE.CylinderGeometry(8.5, 8.5, 8, 64, 1, true), new THREE.MeshBasicMaterial({ color: 0x0d1726, side: THREE.BackSide }));
  backdrop.position.y = 4; scene.add(backdrop);
  const motes = new THREE.Points((() => { const g = new THREE.BufferGeometry(); const p = new Float32Array(150 * 3); for (let i = 0; i < 150; i++) { p[i * 3] = (Math.random() - .5) * 10; p[i * 3 + 1] = Math.random() * 5; p[i * 3 + 2] = (Math.random() - .5) * 10; } g.setAttribute('position', new THREE.BufferAttribute(p, 3)); return g; })(), new THREE.PointsMaterial({ color: 0x6f9ec4, size: 1.2, sizeAttenuation: false, transparent: true, opacity: .45, depthWrite: false }));
  scene.add(motes);

  function sizeStage() { const wrap = $('stage-wrap'); const w = Math.max(320, wrap.clientWidth), h = Math.max(320, wrap.clientHeight); renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix(); }
  addEventListener('resize', sizeStage);

  function outfitContextFor(identity, contextId) {
    const minute = contextId === 'night' ? 21 * 60 + 30 : contextId === 'work' ? 10 * 60 : 9 * 60;
    const weather = contextId === 'rain' ? 'rainy' : contextId === 'night' ? 'cloudy' : 'sunny';
    const mode = contextId === 'work' ? 'work' : contextId === 'rain' ? 'home' : contextId === 'night' ? 'night' : contextId === 'exercise' ? 'exercise' : 'home';
    return { mode, activity: animation.activity, minute, weather, day: 3, jobKind: identity.workplaceKind, indoor: contextId === 'home' };
  }
  const scaleFor = (identity) => identity.body.height / 1.82;
  function addFigure(identity) {
    const fig = makeResidentFigure(identity);
    fig.group.scale.setScalar(scaleFor(identity));
    fig.setOutfit(outfitFor(identity, outfitContextFor(identity, context.id)));
    fig.setActivity(animation.activity);
    fig.setLod(lod);
    fig.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    return fig;
  }
  let current = null;
  function clearStage() {
    if (current) { scene.remove(current.group); current = null; }
    for (const child of [...scene.children]) if (child.userData.crowdFigure) scene.remove(child);
  }
  function select(index) {
    selected = ((index % roster.length) + roster.length) % roster.length;
    const entry = roster[selected];
    if (crowd) { crowd = false; $('crowd-toggle-input').checked = false; $('crowd-toggle').hidden = true; }
    clearStage();
    current = addFigure(entry.identity);
    scene.add(current.group);
    drawRoster(); renderFacts();
    $('stage-label').textContent = entry.identity.name + ' · ' + entry.identity.occupation;
    updateReady();
  }
  function setAnimation(id) { animation = ANIMATIONS.find((a) => a.id === id) || ANIMATIONS[0]; if (current) { current.setActivity(animation.activity); current.group.userData.animation = animation.id; } drawControls(); updateReady(); }
  function setContext(id) { context = CONTEXTS.find((c) => c.id === id) || CONTEXTS[0]; if (current) current.setOutfit(outfitFor(current.identity, outfitContextFor(current.identity, context.id))); drawControls(); updateReady(); }
  function setLod(n) { lod = Math.max(0, Math.min(3, n | 0)); if (current) current.setLod(lod); if (crowd) for (const child of scene.children) if (child.userData.crowdFigure) child.userData.crowdFigure.setLod(child.userData.crowdLod ?? lod); drawControls(); updateReady(); }
  function setCrowd(on) {
    crowd = !!on; $('crowd-toggle-input').checked = crowd; clearStage();
    if (crowd) {
      const n = 12, cols = 6, rows = 2;
      for (let i = 0; i < n; i++) {
        const col = i % cols, row = Math.floor(i / cols);
        const identity = identityFor(PEOPLE[i % PEOPLE.length].id, PEOPLE[i % PEOPLE.length]);
        const fig = addFigure(identity);
        fig.setActivity('home'); fig.setLod(1);
        fig.group.position.set((col - (cols - 1) / 2) * 1.02, 0, row === 0 ? .55 : -0.75);
        fig.group.rotation.y = row === 0 ? .08 : -.05;
        fig.group.userData.crowdFigure = fig; fig.group.userData.crowdLod = 1;
        scene.add(fig.group);
      }
      distance = 6.8; cameraTarget.set(0, 1.0, 0); placeCamera();
      $('stage-label').textContent = 'Twelve identities from the same generator';
      $('crowd-toggle').hidden = false; $('crowd-toggle').textContent = 'Crowd: 12 residents · same identity system';
    } else { select(selected); distance = 4.6; cameraTarget.set(0, 1.02, 0); placeCamera(); $('crowd-toggle').hidden = true; }
    drawControls(); updateReady();
  }

  // ---------- DOM ----------
  function drawRoster() {
    $('roster').innerHTML = roster.map((r, i) => `<button type="button" role="option" aria-selected="${i === selected}" class="roster-card${i === selected ? ' selected' : ''}" data-index="${i}">
      <span class="roster-name">${esc(r.identity.name)}</span>
      <span class="roster-meta">${r.identity.age} · ${esc(r.identity.occupation)}</span>
      <span class="roster-colours">${swatch(r.identity.clothing.shirt)}${swatch(r.identity.clothing.trousers)}${swatch(r.identity.hair.base)}${swatch(r.identity.skin.base)}</span>
    </button>`).join('');
    for (const b of $('roster').querySelectorAll('button')) b.onclick = () => select(+b.dataset.index);
  }
  function renderFacts() {
    const identity = roster[selected].identity;
    $('person-name').textContent = identity.name;
    $('person-summary').textContent = describeIdentity(identity);
    const facts = [
      ['Age', identity.age + (identity.child ? ' · child' : identity.teen ? ' · teen' : identity.senior ? ' · senior' : '')],
      ['Job', identity.occupation],
      ['Height', identity.body.height.toFixed(2) + ' m'],
      ['Build', identity.body.build],
      ['Face', identity.face.shape + ', jaw ' + identity.face.jaw.toFixed(2)],
      ['Hair', identity.hair.style + ' · ' + identity.hair.texture],
      ['Eyes', hex(identity.eyes.colour)],
      ['Skin', hex(identity.skin.base)],
      ['Accessories', [identity.accessories.glasses ? 'glasses' : '', identity.accessories.facialHair !== 'none' ? identity.accessories.facialHair : '', identity.accessories.hat ? 'hat' : '', identity.accessories.bag ? 'bag' : ''].filter(Boolean).join(', ') || 'none'],
      ['Signature', appearanceSignature(identity)],
    ];
    $('person-facts').innerHTML = facts.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('');
  }
  function drawControls() {
    $('animation-buttons').innerHTML = ANIMATIONS.map((a) => `<button type="button" class="${a.id === animation.id ? 'active' : ''}" data-anim="${a.id}" title="${esc(a.note)}">${esc(a.label)}</button>`).join('');
    for (const b of $('animation-buttons').querySelectorAll('button')) b.onclick = () => setAnimation(b.dataset.anim);
    $('context-buttons').innerHTML = CONTEXTS.map((c) => `<button type="button" class="${c.id === context.id ? 'active' : ''}" data-context="${c.id}">${esc(c.label)}</button>`).join('');
    for (const b of $('context-buttons').querySelectorAll('button')) b.onclick = () => setContext(b.dataset.context);
    $('lod-buttons').innerHTML = LODS.map((l) => `<button type="button" class="${l.id === lod ? 'active' : ''}" data-lod="${l.id}">${esc(l.label)}</button>`).join('');
    for (const b of $('lod-buttons').querySelectorAll('button')) b.onclick = () => setLod(+b.dataset.lod);
    $('lod-note').textContent = lod === 0 ? 'Near: full face, fingers, glasses, buttons and hair detail.' : lod === 1 ? 'Mid: face at a glance; micro detail and fingers hidden.' : 'Far: seven-mesh street proxy with the same silhouette and palette.';
  }
  function updateReady() { const state = window.__residentStudio?.state?.(); if (!state) return; $('studio-status').textContent = `Ready · ${roster.length} identities · ${state.visibleMeshes} visible meshes · ${state.animation} · ${state.context}`; }

  // ---------- Camera controls ----------
  let dragging = false, lastX = 0, lastY = 0;
  const stageCanvas = $('stage');
  stageCanvas.addEventListener('pointerdown', (e) => { dragging = true; lastX = e.clientX; lastY = e.clientY; stageCanvas.setPointerCapture(e.pointerId); });
  stageCanvas.addEventListener('pointermove', (e) => { if (!dragging) return; orbit -= (e.clientX - lastX) * .006; elevation = Math.max(-.08, Math.min(.55, elevation + (e.clientY - lastY) * .004)); lastX = e.clientX; lastY = e.clientY; placeCamera(); });
  stageCanvas.addEventListener('pointerup', () => { dragging = false; });
  stageCanvas.addEventListener('wheel', (e) => { e.preventDefault(); distance = Math.max(2.2, Math.min(9, distance + e.deltaY * .0035)); placeCamera(); }, { passive: false });
  addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') { select(selected - 1); e.preventDefault(); } if (e.key === 'ArrowRight') { select(selected + 1); e.preventDefault(); } });

  // ---------- Loop ----------
  let t0 = performance.now(), elapsed = 0;
  function visibleMeshes() { let n = 0; const walk = (o) => { if (!o.visible) return; if (o.isMesh) n++; for (const c of o.children) walk(c); }; walk(scene); return n; }
  function frame(now) {
    const dt = Math.min(.05, (now - t0) / 1000); t0 = now; elapsed += dt;
    if (current) poseResident(current, dt, elapsed, animation.moving, true);
    else for (const child of scene.children) if (child.userData.crowdFigure) { const f = child.userData.crowdFigure; poseResident(f, dt, elapsed + (f.identity.seed % 7), (f.identity.seed % 3) === 0, true); }
    motes.rotation.y += dt * .01;
    renderer.render(scene, camera);
    requestAnimationFrame(frame);
  }

  drawRoster(); drawControls(); renderFacts(); sizeStage(); placeCamera(); select(0); requestAnimationFrame(frame);
  window.__residentStudio = {
    ready: true, fallback: false, webgl: true,
    identities: () => roster.map((r) => ({ id: r.identity.id, name: r.identity.name, age: r.identity.age, gender: r.identity.gender, occupation: r.identity.occupation, signature: r.signature, outfit: r.identity.outfit.key })),
    select: (i) => { setCrowd(false); select(i); return window.__residentStudio.state(); },
    next: () => { select(selected + 1); return window.__residentStudio.state(); },
    animation: (id) => { setAnimation(id); return window.__residentStudio.state(); },
    context: (id) => { setContext(id); return window.__residentStudio.state(); },
    lod: (n) => { setLod(n); return window.__residentStudio.state(); },
    crowd: (on) => { setCrowd(on); return window.__residentStudio.state(); },
    orbit: (radians, height = elevation, dist = distance) => { orbit = radians; elevation = height; distance = dist; placeCamera(); return true; },
    figure: () => current,
    setPart: (name, visible) => {
      if (!current) return false;
      if (name === 'props') current.props.group.visible = visible;
      else if (name === 'face') current.face.detail.visible = visible;
      else if (name === 'hair') { const h = current.head.children.find((c) => c.name === 'hair'); if (h) h.visible = visible; }
      else if (name === 'clothing') current.clothing.visible = visible;
      else if (name === 'head') current.head.visible = visible;
      else if (name === 'posture') current.posture.visible = visible;
      else return false;
      return true;
    },
    debugMeshes: () => { const out = [], v = new THREE.Vector3(); scene.traverse((o) => { if (!o.isMesh) return; let vis = true; for (let p = o; p; p = p.parent) if (!p.visible) { vis = false; break; } o.getWorldPosition(v); out.push({ name: o.name || '', visible: vis, x: +v.x.toFixed(2), y: +v.y.toFixed(2), z: +v.z.toFixed(2), sx: +o.scale.x.toFixed(3), sy: +o.scale.y.toFixed(3), sz: +o.scale.z.toFixed(3), colour: o.material?.color?.getHexString?.() || '' }); }); return out; },
    state: () => {
      const identity = crowd ? null : roster[selected].identity;
      const visible = visibleMeshes();
      const meshes = current ? (() => { let n = 0; current.group.traverse((o) => { if (o.isMesh) n++; }); return n; })() : 0;
      return { index: selected, crowd, lod, animation: animation.id, context: context.id, fallback: false, webgl: true, visibleMeshes: visible, figureMeshes: meshes, identity: identity ? { id: identity.id, name: identity.name, age: identity.age, occupation: identity.occupation, height: +identity.body.height.toFixed(3), signature: appearanceSignature(identity), outfit: current?._outfitKey } : null, animations: ANIMATIONS.map((a) => a.id), contexts: CONTEXTS.map((c) => c.id) };
    },
  };
  setTimeout(() => { $('studio-status').textContent = `Ready · ${roster.length} identities · same identity module as the game`; }, 0);
}
