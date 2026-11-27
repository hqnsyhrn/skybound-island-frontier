// SKYBOUND — trails: the wingtip vapour trails the aircraft leaves behind.
// Two ribbons of fading quads spawn from the wingtips while flying fast; they stretch,
// fade and recycle. A small touch that sells speed in both screenshots and flight.
import * as THREE from 'three';

const MAX_PER_TIP = 40;

function makeTrail() {
  const geo = new THREE.PlaneGeometry(0.16, 2.4);
  const mat = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false,
  });
  const puffs = [];
  for (let i = 0; i < MAX_PER_TIP; i++) {
    const mesh = new THREE.Mesh(geo, mat.clone());
    mesh.visible = false;
    puffs.push({ mesh, life: 0 });
  }
  return { puffs, next: 0, emitClock: 0 };
}

export class TrailSystem {
  constructor(scene) {
    this.scene = scene;
    this.left = makeTrail();
    this.right = makeTrail();
  }

  // worldTips: [{x,y,z}, {x,y,z}] current wingtip positions; fast: aircraft speed factor.
  update(dt, worldTips, speed) {
    for (const [tip, trail] of [[worldTips[0], this.left], [worldTips[1], this.right]]) {
      trail.emitClock += dt;
      const interval = Math.max(0.03, 0.12 - speed * 0.0008);
      if (trail.emitClock > interval && speed > 48) {
        trail.emitClock = 0;
        const puff = trail.puffs[trail.next];
        trail.next = (trail.next + 1) % MAX_PER_TIP;
        puff.mesh.visible = true;
        puff.mesh.position.set(tip.x, tip.y, tip.z);
        puff.mesh.scale.set(1, 1, 1);
        (puff.mesh.material).opacity = 0.5;
        puff.life = 1.6;
      }
      for (const puff of trail.puffs) {
        if (puff.life <= 0) continue;
        puff.life -= dt;
        if (puff.life <= 0) { puff.mesh.visible = false; continue; }
        const t = puff.life / 1.6;
        puff.mesh.material.opacity = 0.5 * t;
        puff.mesh.scale.setScalar(1 + (1 - t) * 2.2);
        puff.mesh.position.y += dt * 0.6;
      }
    }
  }
}
