// SKYBOUND — environment: sky dome gradient, sun light, fog, cloud billboards.
import * as THREE from 'three';
import { makeRng } from './random.js';

export function buildEnvironment(scene, seed) {
  // Sky: big gradient dome via vertex-coloured sphere.
  const skyGeo = new THREE.SphereGeometry(6000, 24, 16);
  const top = new THREE.Color(0x2a6ab0), mid = new THREE.Color(0x8ac4e0), bot = new THREE.Color(0xe8d8b0);
  const colors = new Float32Array(skyGeo.attributes.position.count * 3);
  const pos = skyGeo.attributes.position;
  const c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const t = Math.max(0, Math.min(1, pos.getY(i) / 6000 * 0.5 + 0.5));
    if (t < 0.5) c.copy(bot).lerp(mid, t * 2); else c.copy(mid).lerp(top, (t - 0.5) * 2);
    colors[i * 3] = c.r; colors[i * 3 + 1] = c.g; colors[i * 3 + 2] = c.b;
  }
  skyGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  const sky = new THREE.Mesh(skyGeo, new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.BackSide, fog: false }));
  scene.add(sky);

  // Sun
  const sun = new THREE.DirectionalLight(0xffe0b0, 2.6);
  sun.position.set(600, 900, -400);
  scene.add(sun);
  const ambient = new THREE.HemisphereLight(0xbcd8f0, 0x4a6a50, 0.65);
  scene.add(ambient);

  // Clouds: soft sprite clusters at different altitudes.
  const rng = makeRng(seed + 5);
  const cloudTex = makeCloudTexture();
  const cloudMat = new THREE.SpriteMaterial({ map: cloudTex, transparent: true, opacity: 0.85, fog: false });
  const clouds = [];
  for (let i = 0; i < 30; i++) {
    const s = new THREE.Sprite(cloudMat.clone());
    const scale = 200 + rng() * 420;
    s.scale.set(scale, scale * 0.45, 1);
    s.position.set((rng() - 0.5) * 7000, 220 + rng() * 500, (rng() - 0.5) * 7000);
    s.material.opacity = 0.5 + rng() * 0.35;
    scene.add(s);
    clouds.push(s);
  }
  return { sky, sun, ambient, clouds };
}

function makeCloudTexture() {
  const cv = document.createElement('canvas');
  cv.width = cv.height = 128;
  const g = cv.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 8, 64, 64, 62);
  grad.addColorStop(0, 'rgba(255,255,255,0.95)');
  grad.addColorStop(0.6, 'rgba(250,250,255,0.5)');
  grad.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  // Puffy lobes
  for (let i = 0; i < 7; i++) {
    const x = 30 + Math.random() * 68, y = 45 + Math.random() * 38, r = 14 + Math.random() * 22;
    const lg = g.createRadialGradient(x, y, 2, x, y, r);
    lg.addColorStop(0, 'rgba(255,255,255,0.8)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = lg;
    g.fillRect(x - r, y - r, r * 2, r * 2);
  }
  const tex = new THREE.CanvasTexture(cv);
  return tex;
}
