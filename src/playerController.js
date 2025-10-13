import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

export class PlayerController {
  constructor(camera, domElement, scene, obstacles, hudElement = null) {
    this.camera = camera;
    this.domElement = domElement || document.body;
    this.scene = scene;
    this.obstacles = obstacles;
    this.hud = hudElement;

    this.controls = new PointerLockControls(this.camera, this.domElement);
    this.controls.addEventListener('lock', () => { if(!this.isSitting) this.setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir'); });
    this.controls.addEventListener('unlock', () => this.setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir'));

    this.keys = { w:false, a:false, s:false, d:false, shift:false, space:false };
    addEventListener('keydown', e => { if (e.code === 'KeyW') this.keys.w = true; if (e.code === 'KeyA') this.keys.a = true; if (e.code === 'KeyS') this.keys.s = true; if (e.code === 'KeyD') this.keys.d = true; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = true; if (e.code === 'Space') this.keys.space = true; });
    addEventListener('keyup', e => { if (e.code === 'KeyW') this.keys.w = false; if (e.code === 'KeyA') this.keys.a = false; if (e.code === 'KeyS') this.keys.s = false; if (e.code === 'KeyD') this.keys.d = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') this.keys.shift = false; if (e.code === 'Space') this.keys.space = false; });

    this.isSitting = false;
    this.isReadingPDF = false;

    this.speed = 4; this.runMult = 2; this.jumpVel = 5; this.gravity = 15; this.velY = 0; this.onFloor = true;
    this.bounds = { minX: -11, maxX: 11, minZ: -14, maxZ: 14 };

    this.prev = performance.now();
    this.forward = new THREE.Vector3(); this.up = new THREE.Vector3(0,1,0); this.right = new THREE.Vector3(); this.intent = new THREE.Vector3();
  }

  setHUD(msg){ if (this.hud) this.hud.innerHTML = `<span class="pill">${msg}</span>`; }

  lock() { if (!this.isSitting && !this.isReadingPDF) this.controls.lock(); }

  unlock() { this.controls.unlock(); }

  resolveCollisions(qx, qz, r = 0.4) {
    qx = Math.max(this.bounds.minX, Math.min(this.bounds.maxX, qx));
    qz = Math.max(this.bounds.minZ, Math.min(this.bounds.maxZ, qz));
    for (let i = 0; i < 3; i++) {
      let pushed = false;
      for (const o of this.obstacles) {
        const dx = qx - o.x, dz = qz - o.z, dist = Math.hypot(dx, dz), minDist = r + o.r;
        if (dist < minDist) {
          const overlap = minDist - dist;
          qx += (dx/dist) * overlap;
          qz += (dz/dist) * overlap;
          pushed = true;
        }
      }
      if (!pushed) break;
    }
    return { nx: qx, nz: qz };
  }

  update(dt) {
    // movement and physics
    if (this.controls.isLocked && !this.isSitting) {
      this.camera.getWorldDirection(this.forward); this.forward.y = 0; this.forward.normalize();
      this.right.crossVectors(this.forward, this.up).normalize();
      this.intent.set(0,0,0);
      let v = this.speed * (this.keys.shift ? this.runMult : 1);
      if (this.keys.w) this.intent.add(this.forward); if (this.keys.s) this.intent.sub(this.forward); if (this.keys.d) this.intent.add(this.right); if (this.keys.a) this.intent.sub(this.right);
      if (this.intent.lengthSq() > 0) this.intent.setLength(v * dt);

      if (this.onFloor && this.keys.space) { this.velY = this.jumpVel; this.onFloor = false; }
      this.velY -= this.gravity * dt;
      let ny = this.camera.position.y + this.velY * dt;
      if (ny < 1.7) { ny = 1.7; this.velY = 0; this.onFloor = true; }

      let qx = this.camera.position.x + this.intent.x, qz = this.camera.position.z + this.intent.z;
      const solved = this.resolveCollisions(qx, qz);
      this.camera.position.set(solved.nx, ny, solved.nz);
    }
  }
}
