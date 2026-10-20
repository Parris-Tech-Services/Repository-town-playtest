import * as THREE from 'three';

// First-person walker on a flat floor: walk, run, crouch, jump, smoothed look.
const STAND = 1.65, CROUCH = 1.0, RADIUS = 0.35;
const SPEED = { walk: 4.2, run: 7.6, crouch: 2.0 };

export class Player {
  constructor(camera) {
    this.camera = camera;
    this.pos = new THREE.Vector3();
    this.yaw = 0; this.pitch = 0;
    this.vy = 0; this.y = 0;
    this.eye = STAND;
    this.vel = new THREE.Vector2();
    this.bob = 0;
    this.radius = RADIUS;
    this.baseHeight = 0;
  }

  place(x, z, yaw = this.yaw) { this.pos.set(x, 0, z); this.yaw = yaw; this.pitch = 0; this.vel.set(0, 0); this.y = 0; this.vy = 0; }

  update(dt, input, world, sensitivity = 0.0032) {
    const look = input.takeLook();
    this.yaw -= look.dx * sensitivity;
    this.pitch = THREE.MathUtils.clamp(this.pitch - look.dy * sensitivity, -1.35, 1.35);
    const m = input.movement();
    const crouching = m.crouching && this.y === 0;
    const speed = (crouching ? SPEED.crouch : m.running ? SPEED.run : SPEED.walk) * (this.speedFactor ?? 1);
    // Desired velocity in world space from camera-relative input.
    const sin = Math.sin(this.yaw), cos = Math.cos(this.yaw);
    const tx = (m.x * cos + m.z * sin) * speed, tz = (-m.x * sin + m.z * cos) * speed;
    const accel = this.y > 0 ? 4 : 14;
    this.vel.x += (tx - this.vel.x) * Math.min(1, accel * dt);
    this.vel.y += (tz - this.vel.y) * Math.min(1, accel * dt);
    const blocked = world.move(this.pos, this.vel.x * dt, this.vel.y * dt, this.radius);
    if (input.consume('jump') && this.y === 0 && !crouching) this.vy = 7.2;
    this.vy -= 22 * dt; this.y = Math.max(0, this.y + this.vy * dt); if (this.y === 0) this.vy = Math.max(0, this.vy);
    this.eye += ((crouching ? CROUCH : STAND) - this.eye) * Math.min(1, 10 * dt);
    const moving = Math.hypot(this.vel.x, this.vel.y);
    this.bob += moving * dt * 2.1;
    const bobY = this.y === 0 ? Math.sin(this.bob) * Math.min(0.045, moving * 0.008) : 0;
    this.camera.position.set(this.pos.x, this.baseHeight + this.y + this.eye + bobY, this.pos.z);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
    return { moving, blocked, crouching, running: m.running && !crouching };
  }

  forward() { return new THREE.Vector3(-Math.sin(this.yaw), 0, -Math.cos(this.yaw)); }
}
