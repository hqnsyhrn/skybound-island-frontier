// SKYBOUND — missions: the three game modes' setup, update and completion.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { groundHeight } from './terrain.js';
import { assessLanding } from './flight-physics.js';

// Glowing checkpoint rings (torus + inner glow disc).
export function buildRings(scene, seed, makeRng) {
  const rings = [];
  const rng = makeRng(seed + 99);
  let px = 0, pz = 2000, py = 120;
  for (let i = 0; i < CONFIG.ringCount; i++) {
    px += (rng() - 0.45) * 500;
    pz -= 320 + rng() * 240;
    py = Math.max(60, Math.min(420, py + (rng() - 0.5) * 140));
    // Keep rings clear of terrain: at least 55 m above the ground below.
    const gh = groundHeight(px, pz);
    py = Math.max(py, gh + 55);
    const group = new THREE.Group();
    const torus = new THREE.Mesh(
      new THREE.TorusGeometry(CONFIG.ringRadius, 1.6, 10, 40),
      new THREE.MeshBasicMaterial({ color: 0x35c8f0, transparent: true, opacity: 0.9 }));
    group.add(torus);
    const glow = new THREE.Mesh(
      new THREE.CircleGeometry(CONFIG.ringRadius * 0.96, 32),
      new THREE.MeshBasicMaterial({ color: 0x35c8f0, transparent: true, opacity: 0.15, side: THREE.DoubleSide }));
    group.add(glow);
    group.position.set(px, py, pz);
    group.lookAt(px, py, pz - 500);
    scene.add(group);
    rings.push({ group, x: px, y: py, z: pz, passed: false });
  }
  return rings;
}

export class Mission {
  constructor(mode) {
    this.mode = mode;
    this.reset();
  }
  reset() {
    this.score = 0;
    this.combo = 0;
    this.time = this.mode === 'rings' ? CONFIG.ringTime : 0;
    this.done = false;
    this.won = false;
    this.nextRing = 0;
    this.landing = null;
    this.message = '';
  }
  update(dt, flight, rings) {
    if (this.done) return;
    if (this.mode === 'rings') {
      this.time -= dt;
      if (this.time <= 0) { this.done = true; this.won = this.nextRing >= CONFIG.ringCount; return; }
      const r = rings[this.nextRing];
      if (r && !r.passed) {
        const d = Math.hypot(flight.pos.x - r.x, flight.pos.y - r.y, flight.pos.z - r.z);
        if (d < CONFIG.ringRadius) {
          r.passed = true;
          r.group.children[0].material.color.setHex(0x35e878);
          r.group.children[1].material.color.setHex(0x35e878);
          this.combo += 1;
          const gain = CONFIG.ringScore + (this.combo - 1) * CONFIG.ringComboBonus;
          this.score += gain;
          this.message = `RING +${gain}${this.combo > 1 ? ` ×${this.combo}` : ''}`;
          this.nextRing += 1;
          if (this.nextRing >= CONFIG.ringCount) { this.done = true; this.won = true; this.time = Math.max(this.time, 0); }
        }
      }
    } else if (this.mode === 'landing') {
      if (flight.onGround && flight.speed < 2 && !this.done) {
        // Assess once the aircraft has rolled to a stop.
        this.landing = assessLanding(flight);
        this.score = this.landing.score;
        this.done = true;
        this.won = this.landing.onRunway && this.landing.score >= 55;
      }
    }
  }
}
