// Unified desktop + touch input. Movement is a vector in [-1, 1]; look deltas
// accumulate between frames and are consumed by the player each tick.
export class Input {
  constructor(canvas, touchRoot) {
    this.keys = new Set();
    this.look = { dx: 0, dy: 0 };
    this.stick = { x: 0, y: 0 };
    this.pressed = new Set();
    this.run = false;
    this.crouch = false;
    this.touch = matchMedia('(pointer: coarse)').matches;
    this.canvas = canvas;
    this.onCaptureChange = null;
    this.onCaptureError = null;
    this.bindKeyboard();
    this.bindMouse(canvas);
    this.bindTouch(canvas, touchRoot);
  }

  reset() {
    this.keys.clear(); this.pressed.clear(); this.stick.x = 0; this.stick.y = 0;
    this.takeLook();
  }

  bindKeyboard() {
    addEventListener('keydown', (e) => {
      if (e.target.closest?.('input, textarea, select, button, a, [contenteditable]')) return;
      const k = e.key.toLowerCase();
      if (!this.keys.has(k)) {
        if (k === ' ') this.pressed.add('jump');
        if (k === 'e' || k === 'f' || k === 'enter') this.pressed.add('use');
        if (k === 'c') this.crouch = !this.crouch;
        // Escape releases the browser's pointer lock; it must not also close the game UI.
        if (k === 'escape' && document.pointerLockElement !== this.canvas) this.pressed.add('back');
        if (k === 'l' && !this.touch) this.toggleMouseCapture();
        if (k === 'm') this.pressed.add('map');
      }
      this.keys.add(k);
      if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(k)) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.key.toLowerCase()));
    addEventListener('blur', () => this.reset());
  }

  bindMouse(canvas) {
    let drag = null;
    canvas.addEventListener('mousedown', (e) => { drag = { x: e.clientX, y: e.clientY }; });
    addEventListener('mouseup', () => { drag = null; });
    addEventListener('mousemove', (e) => {
      if (document.pointerLockElement === canvas) { this.look.dx += e.movementX; this.look.dy += e.movementY; return; }
      if (!drag) return;
      this.look.dx += e.clientX - drag.x; this.look.dy += e.clientY - drag.y;
      drag = { x: e.clientX, y: e.clientY };
    });
    canvas.addEventListener('dblclick', () => this.captureMouse());
    document.addEventListener('pointerlockchange', () => {
      drag = null;
      this.look.dx = 0; this.look.dy = 0;
      this.onCaptureChange?.(document.pointerLockElement === canvas);
    });
    document.addEventListener('pointerlockerror', () => this.onCaptureError?.());
  }

  get mouseCaptured() { return document.pointerLockElement === this.canvas; }

  captureMouse() {
    if (this.touch || typeof this.canvas.requestPointerLock !== 'function') return false;
    try {
      // Must run synchronously inside a user gesture (button, L or double-click).
      const request = this.canvas.requestPointerLock();
      request?.catch?.(() => this.onCaptureError?.());
      return true;
    } catch {
      this.onCaptureError?.();
      return false;
    }
  }

  releaseMouse() {
    if (this.mouseCaptured) document.exitPointerLock?.();
  }

  toggleMouseCapture() {
    if (this.mouseCaptured) this.releaseMouse();
    else this.captureMouse();
  }

  // Left half of the screen is a floating joystick; right half drags the view.
  bindTouch(canvas, root) {
    const stickEl = root.querySelector('#stick'), knob = root.querySelector('#knob');
    const touches = new Map();
    const start = (e) => {
      for (const t of e.changedTouches) {
        const kind = t.clientX < innerWidth * 0.45 ? 'move' : 'look';
        touches.set(t.identifier, { kind, x0: t.clientX, y0: t.clientY, x: t.clientX, y: t.clientY });
        if (kind === 'move') { stickEl.style.left = t.clientX - 55 + 'px'; stickEl.style.top = t.clientY - 55 + 'px'; stickEl.classList.add('on'); }
      }
      e.preventDefault();
    };
    const move = (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier); if (!s) continue;
        if (s.kind === 'look') { this.look.dx += (t.clientX - s.x) * 1.4; this.look.dy += (t.clientY - s.y) * 1.4; }
        else {
          let dx = t.clientX - s.x0, dy = t.clientY - s.y0; const len = Math.hypot(dx, dy), max = 50;
          if (len > max) { dx *= max / len; dy *= max / len; }
          this.stick.x = dx / max; this.stick.y = dy / max; knob.style.transform = `translate(${dx}px,${dy}px)`;
        }
        s.x = t.clientX; s.y = t.clientY;
      }
      e.preventDefault();
    };
    const end = (e) => {
      for (const t of e.changedTouches) {
        const s = touches.get(t.identifier); touches.delete(t.identifier);
        if (s?.kind === 'move') { this.stick.x = 0; this.stick.y = 0; knob.style.transform = ''; stickEl.classList.remove('on'); }
      }
    };
    canvas.addEventListener('touchstart', start, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', end);
    canvas.addEventListener('touchcancel', end);
    const btn = (id, fn) => { const el = root.querySelector(id); el.addEventListener('touchstart', (e) => { e.preventDefault(); fn(el); }, { passive: false }); el.addEventListener('click', () => fn(el)); };
    btn('#t-jump', () => this.pressed.add('jump'));
    btn('#t-use', () => this.pressed.add('use'));
    btn('#t-run', (el) => { this.run = !this.run; if (this.run) this.crouch = false; this.sync(root); });
    btn('#t-crouch', (el) => { this.crouch = !this.crouch; if (this.crouch) this.run = false; this.sync(root); });
  }

  sync(root) {
    root.querySelector('#t-run').setAttribute('aria-pressed', String(this.run));
    root.querySelector('#t-crouch').setAttribute('aria-pressed', String(this.crouch));
  }

  movement() {
    const k = this.keys;
    let x = (k.has('d') || k.has('arrowright') ? 1 : 0) - (k.has('a') || k.has('arrowleft') ? 1 : 0);
    let z = (k.has('s') || k.has('arrowdown') ? 1 : 0) - (k.has('w') || k.has('arrowup') ? 1 : 0);
    x += this.stick.x; z += this.stick.y;
    const len = Math.hypot(x, z);
    if (len > 1) { x /= len; z /= len; }
    return { x, z, running: this.run || k.has('shift'), crouching: this.crouch };
  }

  consume(name) { const had = this.pressed.has(name); this.pressed.delete(name); return had; }
  takeLook() { const l = { ...this.look }; this.look.dx = 0; this.look.dy = 0; return l; }
}

