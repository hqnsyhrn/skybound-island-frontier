// SKYBOUND — vegetation: instanced palms and rock outcrops scattered over the islands.
// Everything is one draw call per instance type, so the archipelago gains detail without
// costing frame time. Placement is seeded so screenshots stay reproducible.
import * as THREE from 'three';
import { ISLANDS, groundHeight } from './terrain.js';
import { makeRng } from './random.js';

// A palm is a bent trunk plus a crown of drooping fronds, merged into one geometry.
function palmGeometry() {
  const trunkSegments = 7;
  const trunkHeight = 9.5;
  const lean = 1.8;
  const parts = [];
  for (let i = 0; i < trunkSegments; i++) {
    const t = i / trunkSegments;
    const radius = 0.42 * (1 - t * 0.45);
    const seg = new THREE.CylinderGeometry(radius * 0.86, radius, trunkHeight / trunkSegments, 5);
    const bend = Math.pow(t, 1.6) * lean;
    seg.translate(bend, trunkHeight / trunkSegments * (i + 0.5), 0);
    seg.rotateZ(-Math.pow(t, 1.4) * 0.28);
    parts.push(seg);
  }
  // Fronds: tapered cones flattened into leaf shapes.
  const fronds = 9;
  for (let f = 0; f < fronds; f++) {
    const angle = (f / fronds) * Math.PI * 2;
    const droop = 0.5 + (f % 3) * 0.12;
    const frond = new THREE.ConeGeometry(0.85, 6.4, 4, 1, false);
    frond.scale(1, 1, 0.16);
    frond.rotateX(Math.PI / 2);
    frond.rotateZ(droop);
    frond.translate(0, 0, -3.1);
    frond.rotateY(angle);
    frond.translate(lean * 0.92, trunkHeight - 0.4, 0);
    parts.push(frond);
  }
  return mergeGeometries(parts);
}

// Minimal geometry merge (position + normal only) to avoid pulling in an addon.
function mergeGeometries(list) {
  let vertexCount = 0;
  for (const g of list) vertexCount += g.attributes.position.count;
  const pos = new Float32Array(vertexCount * 3);
  const nrm = new Float32Array(vertexCount * 3);
  let offset = 0;
  for (const g of list) {
    const p = g.attributes.position, n = g.attributes.normal;
    pos.set(p.array, offset * 3);
    nrm.set(n.array, offset * 3);
    offset += p.count;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nrm, 3));
  out.computeBoundingSphere();
  return out;
}

// A rock is two overlapping low-poly chunks, dark and matte.
function rockGeometry() {
  const a = new THREE.DodecahedronGeometry(2.4, 0);
  a.scale(1, 0.62, 1.2);
  const b = new THREE.DodecahedronGeometry(1.5, 0);
  b.scale(1.1, 0.5, 0.9);
  b.translate(1.6, 0.5, -0.4);
  return mergeGeometries([a, b]);
}

export function buildVegetation(scene, seed) {
  const rng = makeRng(seed + 313);
  const palms = [];
  const rocks = [];

  for (const is of ISLANDS) {
    const isVolcano = is.volcano;
    // Palms hug the shoreline; rocks climb the slopes.
    for (let i = 0; i < 46; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = is.radius * (0.35 + rng() * 0.7);
      const x = is.x + Math.cos(angle) * dist;
      const z = is.z + Math.sin(angle) * dist;
      const h = groundHeight(x, z);
      if (h < 2.5) continue;                 // underwater or beach wet sand
      if (h > 68) continue;                  // too far up the mountain
      if (isVolcano && h > 40) continue;     // volcanoes above the treeline
      palms.push({ x, y: h, z, rot: rng() * Math.PI * 2, scale: 1.1 + rng() * 0.8 });
    }
    for (let i = 0; i < 10; i++) {
      const angle = rng() * Math.PI * 2;
      const dist = is.radius * (0.2 + rng() * 0.6);
      const x = is.x + Math.cos(angle) * dist;
      const z = is.z + Math.sin(angle) * dist;
      const h = groundHeight(x, z);
      if (h < 8 || h > 60) continue;
      rocks.push({ x, y: h - 0.4, z, rot: rng() * Math.PI * 2, scale: 0.7 + rng() * 1.5 });
    }
  }

  const group = new THREE.Group();

  const palmMat = new THREE.MeshLambertMaterial({ color: 0x4a7d3a });
  const palmMesh = new THREE.InstancedMesh(palmGeometry(), palmMat, Math.max(1, palms.length));
  const rockMat = new THREE.MeshLambertMaterial({ color: 0x6d675c });
  const rockMesh = new THREE.InstancedMesh(rockGeometry(), rockMat, Math.max(1, rocks.length));

  const m = new THREE.Matrix4();
  const q = new THREE.Quaternion();
  const v = new THREE.Vector3();
  const s = new THREE.Vector3();
  palms.forEach((p, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot);
    v.set(p.x, p.y, p.z);
    s.setScalar(p.scale);
    m.compose(v, q, s);
    palmMesh.setMatrixAt(i, m);
  });
  rocks.forEach((p, i) => {
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), p.rot);
    v.set(p.x, p.y, p.z);
    s.setScalar(p.scale);
    m.compose(v, q, s);
    rockMesh.setMatrixAt(i, m);
  });
  palmMesh.instanceMatrix.needsUpdate = true;
  rockMesh.instanceMatrix.needsUpdate = true;
  palmMesh.frustumCulled = false;
  rockMesh.frustumCulled = false;
  group.add(palmMesh, rockMesh);
  scene.add(group);
  return group;
}
