// SKYBOUND — smoke: engine puffs when the throttle is high, and a dust burst on touchdown.
// A tiny pool of sprite puffs is recycled; nothing is allocated per frame.
import * as THREE from 'three';

const POOL = 36;

function puffTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 64;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(32, 32, 4, 32, 32, 30);
  grad.addColorStop(0, 'rgba(210,210,215,0.7)');
  grad.addColorStop(1, 'rgba(210,210,215,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(cv);
}

export class SmokeSystem {
  constructor(scene) {
    this.scene = scene;
    const tex = puffTexture();
    this.pool = [];
    for (let i = 0; i < POOL; i++) {
      const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false });
      const s = new THREE.Sprite(mat);
      s.visible = false;
      scene.add(s);
      this.pool.push({ sprite: s, life: 0, rise: 1 });
    }
    this.next = 0;
    this.clock = 0;
  }

  spawn(pos, scale, rise) {
    const p = this.pool[this.next];
    this.next = (this.next + 1) % POOL;
    p.sprite.visible = true;
    p.sprite.position.copy(pos);
    p.sprite.scale.setScalar(scale);
    p.sprite.material.opacity = 0.45;
    p.life = 1.4;
    p.rise = rise;
  }

  // enginePos: behind the cowling; emitting: throttle high; dustAt: wheel pos on ground.
  update(dt, enginePos, emitting, dustAt) {
    this.clock += dt;
    if (emitting && this.clock > 0.09) {
      this.clock = 0;
      this.spawn(enginePos, 1.6 + Math.random() * 0.8, 2.2);
    }
    if (dustAt && this.clock > 0.05) {
      this.spawn(dustAt, 2.4 + Math.random() * 1.2, 0.8);
    }
    for (const p of this.pool) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.life <= 0) { p.sprite.visible = false; continue; }
      const t = p.life / 1.4;
      p.sprite.material.opacity = 0.45 * t;
      p.sprite.position.y += p.rise * dt;
      p.sprite.scale.multiplyScalar(1 + dt * 0.9);
    }
  }
}
