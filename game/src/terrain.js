// SKYBOUND — terrain: heightfield islands, volcanic peaks, beaches and forest tint.
// Islands are radial falloff mounds with noise; heights are computed analytically so the
// flight physics can query ground elevation anywhere without raycasting.
import * as THREE from 'three';
import { makeRng } from './random.js';

// One shared noise function (value noise with smooth interpolation).
function noise2(x, y, seed) {
  const xi = Math.floor(x), yi = Math.floor(y);
  const xf = x - xi, yf = y - yi;
  const h = (i, j) => {
    let n = Math.sin(i * 127.1 + j * 311.7 + seed * 74.7) * 43758.5453;
    return n - Math.floor(n);
  };
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  return h(xi, yi) * (1 - u) * (1 - v) + h(xi + 1, yi) * u * (1 - v)
       + h(xi, yi + 1) * (1 - u) * v + h(xi + 1, yi + 1) * u * v;
}

export const ISLANDS = [];  // {x, z, radius, height, volcano}

export function buildIslands(seed, count) {
  ISLANDS.length = 0;
  const rng = makeRng(seed);
  for (let i = 0; i < count; i++) {
    const angle = rng() * Math.PI * 2;
    const dist = 400 + rng() * 2800;
    ISLANDS.push({
      x: Math.cos(angle) * dist,
      z: Math.sin(angle) * dist,
      radius: 320 + rng() * 520,
      height: 90 + rng() * 260,
      volcano: rng() < 0.3,
      seed: rng() * 1000,
    });
  }
  // The home island with the runway sits at the origin-ish south.
  ISLANDS.push({ x: 0, z: 2900, radius: 520, height: 90, volcano: false, seed: 42 });
}

// Height contribution of a single island (used for its mesh and the global field).
function islandHeight(is, x, z) {
  const d = Math.hypot(x - is.x, z - is.z);
  const reach = is.radius * 2.0;
  if (d > reach) return -16;
  const t = Math.max(0, 1 - d / reach);
  const falloff = t * t * (3 - 2 * t);
  // Smooth shelf: terrain eases from peak height down below sea level at the rim,
  // so islands slope into the ocean instead of ending in cliffs.
  const shelf = falloff * falloff;
  const n = noise2(x / 90 + is.seed, z / 90 + is.seed, is.seed) * 0.45
          + noise2(x / 40, z / 40, is.seed + 9) * 0.2;
  let peak = -16 + (is.height + 16) * shelf * (0.75 + n * 0.5);
  if (is.volcano) {
    // Smooth crater cone: ease the cone onto the shelf so no cliff ring forms.
    const cone = Math.max(0, Math.min(1, 1 - d / (is.radius * 0.55)));
    const cs = cone * cone * (3 - 2 * cone);
    const conePeak = is.height * (0.55 + cs * 0.75) - cs * cs * 26;
    peak = peak + cs * (conePeak - peak);
  }
  return peak;
}

// Ground elevation at any world point (analytic, cheap enough per frame).
export function groundHeight(x, z) {
  let h = -14;                       // sea floor below water
  for (const is of ISLANDS) {
    const p = islandHeight(is, x, z);
    if (p > h) h = p;
  }
  return h;
}

// Terrain mesh per island: radial grid mounds + vertex colours by height.
export function buildTerrainMeshes(scene, seed) {
  const group = new THREE.Group();
  const segs = 40;
  for (const is of ISLANDS) {
    const geo = new THREE.PlaneGeometry(is.radius * 2.3, is.radius * 2.3, segs, segs);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const wx = pos.getX(i) + is.x, wz = pos.getZ(i) + is.z;
      const h = groundHeight(wx, wz);
      pos.setY(i, h);
      // Beach → grass → forest → rock → snow/volcano
      if (h < 3) c.setHex(0xe0c88a);           // sand
      else if (h < 20) c.setHex(0x8fb84e);     // grass
      else if (h < is.height * 0.72) c.setHex(0x2f6a34); // forest
      else if (h < is.height * 0.94) c.setHex(0x77715f); // rock
      else c.setHex(is.volcano ? 0x35302c : 0xcfcabc);   // crater / snow
      // Darken by slope-ish noise for texture
      const shade = 0.85 + noise2(wx / 25, wz / 25, 7) * 0.3;
      colors[i * 3] = c.r * shade; colors[i * 3 + 1] = c.g * shade; colors[i * 3 + 2] = c.b * shade;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();
    const mat = new THREE.MeshLambertMaterial({ vertexColors: true });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(is.x, 0, is.z);
    group.add(mesh);
  }
  scene.add(group);
  return group;
}

// The runway: flat strip on the home island at CONFIG.runway.
export function buildRunway(scene, runway) {
  const group = new THREE.Group();
  const asphalt = new THREE.Mesh(
    new THREE.PlaneGeometry(runway.width, runway.length),
    new THREE.MeshLambertMaterial({ color: 0x3c4048 }));
  asphalt.rotation.x = -Math.PI / 2;
  asphalt.position.set(runway.x, 1.2, runway.z);
  group.add(asphalt);
  // Centre-line dashes
  const dashMat = new THREE.MeshBasicMaterial({ color: 0xe8e8e0 });
  for (let d = -runway.length / 2 + 20; d < runway.length / 2 - 10; d += 40) {
    const dash = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 18), dashMat);
    dash.rotation.x = -Math.PI / 2;
    dash.position.set(runway.x, 1.3, runway.z + d);
    group.add(dash);
  }
  // Threshold bars
  for (const side of [-1, 1]) {
    const bar = new THREE.Mesh(new THREE.PlaneGeometry(runway.width * 0.7, 3), dashMat);
    bar.rotation.x = -Math.PI / 2;
    bar.position.set(runway.x, 1.3, runway.z + side * (runway.length / 2 - 8));
    group.add(bar);
  }
  scene.add(group);
  return group;
}
