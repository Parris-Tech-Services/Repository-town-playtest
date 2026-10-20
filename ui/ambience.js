// Town sound, synthesised with WebAudio (no audio files): wind, birdsong by day,
// crickets at night, a murmur on the high street, nearby trucks, the Town Hall bell,
// the train horn, footsteps, doors and relic chimes. Browsers only allow sound after a
// click or key press, so it starts on the first one.
const KEY = 'repository-town.sound';

export function createAmbience() {
  let ctx = null, master = null, wind = null, crickets = null, street = null, rumble = null, nextBird = 0, nextCricket = 0;
  let stepTimer = 0;
  let on = false; try { on = localStorage.getItem(KEY) === 'on'; } catch { /* storage blocked */ }

  function noiseBuffer(c, seconds = 2) {
    const b = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate), d = b.getChannelData(0);
    let last = 0;
    for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } // brown noise
    return b;
  }
  function loop(c, buffer, filterType, freq, q = 1) {
    const src = c.createBufferSource(); src.buffer = buffer; src.loop = true;
    const f = c.createBiquadFilter(); f.type = filterType; f.frequency.value = freq; f.Q.value = q;
    const g = c.createGain(); g.gain.value = 0;
    src.connect(f).connect(g).connect(master); src.start();
    return { gain: g, filter: f };
  }
  function start() {
    if (ctx || !on) return;
    const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = 0.5; master.connect(ctx.destination);
    const brown = noiseBuffer(ctx);
    wind = loop(ctx, brown, 'lowpass', 500);
    street = loop(ctx, brown, 'bandpass', 700, 0.7);
    rumble = loop(ctx, brown, 'lowpass', 120);
    const white = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), wd = white.getChannelData(0);
    for (let i = 0; i < wd.length; i++) wd[i] = Math.random() * 2 - 1;
    crickets = white;
  }
  // A short chirp: a sine sweeping up or down, like a magpie or a willie wagtail.
  function chirp(vol) {
    const t = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    const f0 = 2200 + Math.random() * 2200, f1 = f0 * (0.7 + Math.random() * 0.8);
    o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + 0.09);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    o.connect(g).connect(master); o.start(t); o.stop(t + 0.14);
  }
  // A cricket: a few fast pulses of filtered noise around 4.5 kHz.
  function cricket(vol) {
    const t = ctx.currentTime, src = ctx.createBufferSource(), f = ctx.createBiquadFilter(), g = ctx.createGain();
    src.buffer = crickets; f.type = 'bandpass'; f.frequency.value = 4300 + Math.random() * 600; f.Q.value = 18;
    g.gain.setValueAtTime(0, t);
    for (let i = 0; i < 4; i++) { g.gain.linearRampToValueAtTime(vol, t + i * 0.05 + 0.01); g.gain.linearRampToValueAtTime(0, t + i * 0.05 + 0.035); }
    src.connect(f).connect(g).connect(master); src.start(t); src.stop(t + 0.25);
  }

  // A church-style bell: a few inharmonic partials with a long decay, struck n times.
  function bell(n, vol) {
    for (let k = 0; k < n; k++) {
      const t = ctx.currentTime + k * 1.6;
      for (const [f, a] of [[392, 1], [784, 0.5], [1046, 0.3], [470, 0.25]]) {
        const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = f;
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol * a, t + 0.01); g.gain.exponentialRampToValueAtTime(0.0001, t + 2.4);
        o.connect(g).connect(master); o.start(t); o.stop(t + 2.5);
      }
    }
  }
  // A two-tone diesel horn.
  function horn(vol) {
    const t = ctx.currentTime;
    for (const f of [277, 349]) {
      const o = ctx.createOscillator(), g = ctx.createGain(), lp = ctx.createBiquadFilter(); o.type = 'sawtooth'; o.frequency.value = f; lp.type = 'lowpass'; lp.frequency.value = 1400;
      g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + 0.08); g.gain.setValueAtTime(vol, t + 1.4); g.gain.linearRampToValueAtTime(0, t + 1.6);
      o.connect(lp).connect(g).connect(master); o.start(t); o.stop(t + 1.7);
    }
  }
  // One-off sounds from the town, quieter with distance (m).
  function play(e, dist) {
    if (!ctx || !on) return;
    const vol = Math.max(0, 1 - dist / 400);
    if (vol <= 0) return;
    if (e.kind === 'bell') bell(e.n, 0.12 * vol);
    if (e.kind === 'horn') horn(0.08 * vol);
  }

  // A short plucked tone: footsteps, doors, relic chimes.
  function tone(freq, dur = 0.18, vol = 0.08, type = 'sine', slide = 0) {
    if (!ctx || !on) return;
    const now = ctx.currentTime, o = ctx.createOscillator(), g = ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, now);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, freq + slide), now + dur);
    g.gain.setValueAtTime(0.001, now); g.gain.linearRampToValueAtTime(vol, now + 0.02); g.gain.exponentialRampToValueAtTime(0.0008, now + dur);
    o.connect(g).connect(master); o.start(now); o.stop(now + dur + 0.02);
  }

  // Called every frame. day: 0–1 daylight; busy: 0–1 people nearby; truck: distance to the
  // nearest truck (m); moving/running: the player's footsteps.
  function update(dt, { day, busy = 0, truck = Infinity, indoors = false, moving = false, running = false }) {
    if (!ctx || !on) return;
    if (ctx.state === 'suspended') ctx.resume();
    const set = (node, v) => node.gain.gain.setTargetAtTime(v, ctx.currentTime, 0.4);
    const out = indoors ? 0.25 : 1;
    set(wind, (0.05 + 0.04 * Math.sin(ctx.currentTime * 0.13)) * out);
    set(street, 0.05 * busy * out);
    set(rumble, Math.max(0, 1 - truck / 40) * 0.3 * out);
    const now = ctx.currentTime;
    if (day > 0.15 && now > nextBird) { const n = 1 + Math.floor(Math.random() * 3); for (let i = 0; i < n; i++) setTimeout(() => ctx && chirp(0.05 * day * out), i * 140); nextBird = now + 1.5 + Math.random() * 5 / Math.max(0.3, day); }
    if (day < 0.25 && now > nextCricket) { cricket(0.03 * (1 - day * 4) * out); nextCricket = now + 0.35 + Math.random() * 0.9; }
    if (moving) { stepTimer -= dt * (running ? 1.65 : 1); if (stepTimer <= 0) { stepTimer = 0.42; tone(indoors ? 135 : 110, 0.045, 0.035, 'triangle', -25); } }
    else stepTimer = Math.min(stepTimer, 0.12);
  }

  function setOn(v) {
    on = v; try { localStorage.setItem(KEY, v ? 'on' : 'off'); } catch { /* storage blocked */ }
    if (!v && ctx) { ctx.close(); ctx = null; }
    if (v) { start(); setTimeout(() => { tone(523.25, 0.12, 0.06, 'triangle'); setTimeout(() => tone(659.25, 0.16, 0.06, 'triangle'), 90); }, 50); }
  }
  return {
    start, update, setOn, play,
    door: () => tone(220, 0.14, 0.05, 'triangle', 60),
    relic: () => { tone(587.33, 0.15, 0.07, 'triangle'); setTimeout(() => tone(880, 0.25, 0.07, 'triangle'), 110); },
    get on() { return on; }, get running() { return !!ctx && ctx.state === 'running'; },
  };
}
