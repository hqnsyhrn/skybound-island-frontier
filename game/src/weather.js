// SKYBOUND — weather: drifting weather cells that change wind, cloud density and
// light scattering as you fly through them. Purely atmospheric: it never blocks play.
import * as THREE from 'three';
import { makeRng } from './random.js';

// A weather cell: a soft dome of tinted haze the aircraft can fly through.
function cellMesh(color, radius) {
  const geo = new THREE.SphereGeometry(radius, 12, 10);
  const mat = new THREE.MeshBasicMaterial({
    color, transparent: true, opacity: 0.12, side: THREE.BackSide, depthWrite: false, fog: false,
  });
  return new THREE.Mesh(geo, mat);
}

export class WeatherSystem {
  constructor(scene, seed) {
    const rng = makeRng(seed + 4242);
    this.cells = [];
    const kinds = [
      { name: 'clear', tint: 0xffffff, wind: 2 },
      { name: 'humid', tint: 0xcfe8dd, wind: 5 },
      { name: 'golden', tint: 0xf2d8a8, wind: 4 },
      { name: 'stormy', tint: 0x9fb2c8, wind: 9 },
    ];
    for (let i = 0; i < 7; i++) {
      const kind = kinds[Math.floor(rng() * kinds.length)];
      const radius = 500 + rng() * 700;
      const mesh = cellMesh(kind.tint, radius);
      mesh.position.set((rng() - 0.5) * 6000, 120 + rng() * 160, (rng() - 0.5) * 6000);
      scene.add(mesh);
      this.cells.push({ mesh, kind, radius, drift: new THREE.Vector3((rng() - 0.5) * 3, 0, (rng() - 0.5) * 3) });
    }
    this.current = null;
    this.wind = new THREE.Vector3(2, 0, 0);
  }

  // Returns the active weather kind when the aircraft sits inside a cell.
  update(dt, planePos) {
    this.current = null;
    for (const cell of this.cells) {
      cell.mesh.position.addScaledVector(cell.drift, dt);
      const d = cell.mesh.position.distanceTo(planePos);
      if (d < cell.radius) this.current = cell.kind;
    }
    // Ease the global wind toward the active cell's wind vector.
    if (this.current) {
      const target = new THREE.Vector3(this.current.wind, 0, -this.current.wind * 0.4);
      this.wind.lerp(target, Math.min(1, dt * 0.5));
    } else {
      this.wind.lerp(new THREE.Vector3(2, 0, 0), Math.min(1, dt * 0.3));
    }
    return this.current;
  }
}
