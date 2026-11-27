// SKYBOUND — ocean: large animated water plane with vertex waves and a sky-blended colour.
import * as THREE from 'three';

export function buildOcean(scene, size = 12000) {
  const geo = new THREE.PlaneGeometry(size, size, 96, 96);
  geo.rotateX(-Math.PI / 2);
  const mat = new THREE.MeshPhongMaterial({
    color: 0x1a6a9a, shininess: 90, specular: 0x8ac8e8,
    transparent: true, opacity: 0.94,
  });
  const mesh = new THREE.Mesh(geo, mat);
  mesh.position.y = 0;
  mesh.userData.base = Float32Array.from(geo.attributes.position.array);
  scene.add(mesh);
  return mesh;
}

export function updateOcean(ocean, time) {
  const pos = ocean.geometry.attributes.position;
  const base = ocean.userData.base;
  for (let i = 0; i < pos.count; i++) {
    const x = base[i * 3], z = base[i * 3 + 2];
    pos.setY(i, Math.sin(x * 0.008 + time * 1.2) * 1.4 + Math.cos(z * 0.01 + time * 0.9) * 1.1);
  }
  pos.needsUpdate = true;
  ocean.geometry.computeVertexNormals();
}
