// Side-by-side review of the procedural resident figure and the Quaternius rigged candidate.
// Both use the same persistent identity record; the page is deliberately isolated from the
// town simulation so that visual comparisons and performance numbers are unambiguous.
import * as THREE from 'three';
import { identityFor, describeIdentity } from './world/resident-identity.js';
import { makeResidentFigure, poseResident } from './world/resident-figure.js';
import { loadQuaterniusTemplate, createQuaterniusFigure } from './world/resident-quaternius.js';

const PEOPLE = [
  { id: 'cmp:ada', name: 'Ada Whitfield', age: 34, gender: 'female', job: 'registered nurse', workplaceKind: 'hospital' },
  { id: 'cmp:tom', name: 'Tom Fraser', age: 41, gender: 'male', job: 'diesel mechanic', workplaceKind: 'car_repair' },
  { id: 'cmp:esme', name: 'Esme Carter', age: 8, gender: 'female', job: 'student', workplaceKind: 'school', role: 'child' },
  { id: 'cmp:june', name: 'June Whitlock', age: 73, gender: 'female', job: 'retired' },
  { id: 'cmp:sam', name: 'Sam Okafor', age: 31, gender: 'male', job: 'police officer', workplaceKind: 'police' },
  { id: 'cmp:priya', name: 'Priya Nair', age: 29, gender: 'female', job: 'supermarket team member', workplaceKind: 'supermarket' },
  { id: 'cmp:russ', name: 'Russell Doyle', age: 58, gender: 'male', job: 'farmer', workplaceKind: 'agrarian' },
  { id: 'cmp:noah', name: 'Noah Bennett', age: 16, gender: 'male', job: 'student', workplaceKind: 'school', role: 'child' },
];
const ANIMS = ['idle', 'walk', 'talk', 'sit'];
const $ = (id) => document.getElementById(id);
const roster = PEOPLE.map((p) => ({ person: p, identity: identityFor(p.id, p, { activity: 'home', minute: 9 * 60, weather: 'sunny' }) }));
let selected = 0, animation = 'idle';

function createRenderer() {
  const attempts = [
    { antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: false },
    { antialias: false, alpha: true, preserveDrawingBuffer: true, failIfMajorPerformanceCaveat: false },
    { antialias: false, alpha: true, failIfMajorPerformanceCaveat: false },
  ];
  for (const opts of attempts) {
    const cv = document.createElement('canvas');
    try { const r = new THREE.WebGLRenderer({ canvas: cv, ...opts }); cv.id = 'cmp-canvas'; $('cmp-canvas').replaceWith(cv); return r; } catch (e) { console.warn('compare WebGL attempt failed', e.message); }
  }
  return null;
}

const renderer = createRenderer();
if (!renderer) {
  $('cmp-status').textContent = 'WebGL is unavailable — cannot render the 3D comparison in this browser.';
  $('cmp-help').textContent = 'Enable hardware acceleration or use a browser with WebGL to review the models.';
  window.__residentCompare = { ready: true, webgl: false, fallback: true, identities: () => roster.map((r) => ({ id: r.identity.id, name: r.identity.name, signature: r.identity.id })), state: () => ({ webgl: false, fallback: true }) };
} else {
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a1119);
  scene.fog = new THREE.Fog(0x0a1119, 7, 18);
  const camera = new THREE.PerspectiveCamera(32, 1, .05, 60);
  const target = new THREE.Vector3(0, 1.0, 0);
  let orbit = 0, elevation = .1, distance = 4.6;
  const placeCamera = () => {
    camera.position.set(Math.sin(orbit) * distance * Math.cos(elevation), 1.0 + Math.sin(elevation) * distance, Math.cos(orbit) * distance * Math.cos(elevation));
    camera.lookAt(target);
  };
  scene.add(new THREE.HemisphereLight(0xdfeaff, 0x243447, 1.5));
  const key = new THREE.DirectionalLight(0xfff1db, 2.4); key.position.set(3, 6, 4); key.castShadow = true; key.shadow.mapSize.set(1024, 1024); scene.add(key);
  const rim = new THREE.DirectionalLight(0x6fa8ff, 1.2); rim.position.set(-4, 2.5, -3); scene.add(rim);
  const floor = new THREE.Mesh(new THREE.CircleGeometry(9, 64), new THREE.MeshStandardMaterial({ color: 0x16202e, roughness: .82 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  const grid = new THREE.GridHelper(10, 20, 0x2c4a63, 0x1b3144); grid.position.y = .002; scene.add(grid);
  const divider = new THREE.Mesh(new THREE.BoxGeometry(.01, 2.2, .01), new THREE.MeshBasicMaterial({ color: 0x3a5b7a })); divider.position.set(0, 1.1, 0); scene.add(divider);

  const size = () => {
    const w = Math.max(320, $('stage-wrap').clientWidth), h = Math.max(320, $('stage-wrap').clientHeight);
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
  };
  addEventListener('resize', size);

  const procedural = { fig: null };
  const quaternius = { fig: null };
  let template = null;

  function buildProcedural(identity) {
    const fig = makeResidentFigure(identity);
    fig.group.scale.setScalar(Math.max(.45, Math.min(1.15, identity.body.height / 1.82)));
    fig.group.position.set(-.82, 0, 0);
    fig.setActivity(animation === 'walk' ? 'walk' : animation === 'sit' ? 'sit' : animation === 'talk' ? 'talk' : 'home');
    fig.setLod(0);
    fig.group.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    scene.add(fig.group);
    return fig;
  }
  function buildQuaternius(identity) {
    const fig = createQuaterniusFigure(identity, template);
    fig.root.position.set(.82, 0, 0);
    fig.root.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    fig.setState(animation);
    scene.add(fig.root);
    return fig;
  }
  function clear() {
    if (procedural.fig) { scene.remove(procedural.fig.group); procedural.fig = null; }
    if (quaternius.fig) { quaternius.fig.dispose(); quaternius.fig = null; }
  }
  function select(index) {
    selected = ((index % roster.length) + roster.length) % roster.length;
    clear();
    const identity = roster[selected].identity;
    procedural.fig = buildProcedural(identity);
    if (template) quaternius.fig = buildQuaternius(identity);
    drawRoster(); drawPerson();
  }
  function setAnimation(next) {
    animation = next;
    if (procedural.fig) {
      const activity = next === 'walk' ? 'walk' : next === 'sit' ? 'sit' : next === 'talk' ? 'talk' : 'home';
      procedural.fig.setActivity(activity);
      procedural.fig.group.userData.animation = next;
    }
    if (quaternius.fig) quaternius.fig.setState(next);
    drawControls();
  }
  function drawRoster() {
    $('cmp-roster').innerHTML = roster.map((r, i) => `<button type="button" role="option" aria-selected="${i === selected}" class="${i === selected ? 'active' : ''}" data-i="${i}">${r.identity.name}<small>${r.identity.age} · ${r.identity.occupation}</small></button>`).join('');
    for (const b of $('cmp-roster').querySelectorAll('button')) b.onclick = () => select(+b.dataset.i);
  }
  function drawPerson() {
    const id = roster[selected].identity;
    $('cmp-person').textContent = describeIdentity(id);
  }
  function drawControls() {
    $('cmp-anim').innerHTML = ANIMS.map((a) => `<button type="button" data-a="${a}" class="${a === animation ? 'active' : ''}">${a}</button>`).join('');
    for (const b of $('cmp-anim').querySelectorAll('button')) b.onclick = () => setAnimation(b.dataset.a);
  }
  // Iterative drawing with a simple orbit.
  let drag = false, lx = 0, ly = 0;
  const cv = $('cmp-canvas');
  cv.addEventListener('pointerdown', (e) => { drag = true; lx = e.clientX; ly = e.clientY; cv.setPointerCapture(e.pointerId); });
  cv.addEventListener('pointermove', (e) => { if (!drag) return; orbit -= (e.clientX - lx) * .006; elevation = Math.max(-.1, Math.min(.5, elevation + (e.clientY - ly) * .004)); lx = e.clientX; ly = e.clientY; placeCamera(); });
  cv.addEventListener('pointerup', () => { drag = false; });
  cv.addEventListener('wheel', (e) => { e.preventDefault(); distance = Math.max(2.6, Math.min(8, distance + e.deltaY * .004)); placeCamera(); }, { passive: false });

  let t0 = performance.now(), t = 0, frames = 0, fps = 0, lastFpsT = 0;
  function loop(now) {
    const dt = Math.min(.05, (now - t0) / 1000); t0 = now; t += dt; frames++;
    if (now - lastFpsT > 500) { fps = Math.round(frames / ((now - lastFpsT) / 1000)); frames = 0; lastFpsT = now; }
    if (procedural.fig) poseResident(procedural.fig, dt, t, animation === 'walk', true);
    if (quaternius.fig) quaternius.fig.update(dt);
    renderer.render(scene, camera);
    requestAnimationFrame(loop);
  }

  // Boot.
  drawRoster(); drawPerson(); drawControls(); size(); placeCamera();
  (async () => {
    try {
      template = await loadQuaterniusTemplate();
      select(0);
      $('cmp-status').textContent = 'Ready · procedural vs Quaternius';
    } catch (e) {
      console.error(e);
      $('cmp-status').textContent = 'Quaternius assets failed to load: ' + e.message;
      select(0);
    }
    requestAnimationFrame(loop);
  })();

  window.__residentCompare = {
    ready: true, webgl: true, fallback: false,
    identities: () => roster.map((r) => ({ id: r.identity.id, name: r.identity.name, age: r.identity.age, gender: r.identity.gender, occupation: r.identity.occupation })),
    select: (i) => { select(i); return window.__residentCompare.state(); },
    next: () => { select(selected + 1); return window.__residentCompare.state(); },
    animation: (a) => { setAnimation(a); return window.__residentCompare.state(); },
    state: () => {
      const info = renderer.info.render;
      let pMeshes = 0, qMeshes = 0;
      if (procedural.fig) procedural.fig.group.traverse((o) => { if (o.isMesh) pMeshes++; });
      if (quaternius.fig) quaternius.fig.root.traverse((o) => { if (o.isMesh) qMeshes++; });
      return {
        webgl: true, fallback: false, selected, animation, fps, calls: info.calls, triangles: info.triangles,
        proceduralMeshes: pMeshes, quaterniusMeshes: qMeshes,
        quaterniusLoaded: !!quaternius.fig, quaterniusState: quaternius.fig?.state() || null,
        identity: roster[selected].identity.name,
      };
    },
  };
  setTimeout(() => { if ($('cmp-status').textContent.startsWith('Ready')) $('cmp-status').textContent = 'Ready · drag to orbit · choose an animation'; }, 100);
}
