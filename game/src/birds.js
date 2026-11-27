// SKYBOUND — birds: flocks of gulls wheeling over the sea, pure ambience.
// Each bird is a tiny two-triangle chevron; a flock follows a slow circular path
// with bobbing and wing-beat flutter. Cheap, atmospheric, and screenshot-friendly.
import * as THREE from 'three';
import { makeRng } from './random.js';

function birdGeometry() {
  // Two swept wings as a single chevron shape.
  const g = new THREE.BufferGeometry();
  const w = 1.6, d = 0.55, h = 0.18;
  const verts = new Float32Array([
    // left wing
    -w, 0, d,   0, 0, -d,   0, h, 0,
    // right wing
    0, h, 0,    0, 0, -d,   w, 0, d,
  ]);
  g.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  g.computeVertexNormals();
  return g;
}

export function buildBirds(scene, seed, flockCount = 5) {
  const rng = makeRng(seed + 777);
  const geo = birdGeometry();
  const mat = new THREE.MeshBasicMaterial({ color: 0xf4f6f8, side: THREE.DoubleSide });
  const flocks = [];
  for (let f = 0; f < flockCount; f++) {
    const group = new THREE.Group();
    const count = 5 + Math.floor(rng() * 8);
    const members = [];
    for (let i = 0; i < count; i++) {
      const bird = new THREE.Mesh(geo, mat);
      bird.scale.setScalar(1.6 + rng() * 1.4);
      group.add(bird);
      members.push({
        mesh: bird,
        angle: rng() * Math.PI * 2,
        radius: 14 + rng() * 26,
        height: rng() * 10,
        speed: 0.5 + rng() * 0.5,
        flap: rng() * Math.PI * 2,
      });
    }
    const centre = new THREE.Vector3(
      (rng() - 0.5) * 4400,
      130 + rng() * 260,
      (rng() - 0.5) * 4400);
    group.position.copy(centre);
    scene.add(group);
    flocks.push({ group, members, drift: 0.02 + rng() * 0.03 });
  }
  return {
    flocks,
    update(time) {
      for (const flock of flocks) {
        flock.group.rotation.y += flock.drift * 0.016;
        for (const b of flock.members) {
          b.angle += b.speed * 0.016;
          const x = Math.cos(b.angle) * b.radius;
          const z = Math.sin(b.angle) * b.radius;
          b.mesh.position.set(x, b.height + Math.sin(time * 1.3 + b.flap) * 2.4, z);
          b.mesh.rotation.y = -b.angle;
          // Wing-beat flutter.
          b.mesh.rotation.z = Math.sin(time * 9 + b.flap) * 0.28;
        }
      }
    },
  };
}
