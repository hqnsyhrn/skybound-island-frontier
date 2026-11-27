// SKYBOUND — aircraft: a built-from-parts bush plane (fuselage, wings, tail, prop, gear)
// with a propeller that spins with throttle and nav lights.
import * as THREE from 'three';

export function buildAircraft() {
  const plane = new THREE.Group();

  // Fuselage: tapered body
  const bodyMat = new THREE.MeshPhongMaterial({ color: 0xd8482c, shininess: 40 });
  const creamMat = new THREE.MeshPhongMaterial({ color: 0xf2e8d0, shininess: 30 });
  const darkMat = new THREE.MeshPhongMaterial({ color: 0x2a2622 });
  const glassMat = new THREE.MeshPhongMaterial({ color: 0x9ad0e8, shininess: 100, transparent: true, opacity: 0.7 });

  const fuse = new THREE.Mesh(new THREE.CapsuleGeometry(1.1, 5.4, 6, 12), bodyMat);
  fuse.rotation.x = Math.PI / 2;
  plane.add(fuse);

  // Nose cowling
  const cow = new THREE.Mesh(new THREE.CylinderGeometry(0.95, 1.05, 1.4, 12), darkMat);
  cow.rotation.x = Math.PI / 2;
  cow.position.z = -3.6;
  plane.add(cow);

  // Propeller hub + blades
  const propGroup = new THREE.Group();
  const hub = new THREE.Mesh(new THREE.SphereGeometry(0.28, 8, 8), darkMat);
  propGroup.add(hub);
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.22, 4.6, 0.08), darkMat);
    blade.rotation.z = (i * Math.PI * 2) / 3;
    propGroup.add(blade);
  }
  propGroup.position.z = -4.4;
  plane.add(propGroup);
  plane.userData.prop = propGroup;

  // Cabin glass
  const cabin = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.0, 2.4), glassMat);
  cabin.position.set(0, 0.85, -0.4);
  plane.add(cabin);

  // High wing with struts
  const wing = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.16, 2.0), creamMat);
  wing.position.set(0, 1.35, -0.6);
  plane.add(wing);
  const wingStripe = new THREE.Mesh(new THREE.BoxGeometry(11.5, 0.05, 0.5), bodyMat);
  wingStripe.position.set(0, 1.45, -1.3);
  plane.add(wingStripe);
  for (const side of [-1, 1]) {
    const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 2.6, 6), darkMat);
    strut.position.set(side * 2.4, 0.5, -0.4);
    strut.rotation.z = side * 0.5;
    plane.add(strut);
  }

  // Tail: horizontal stabiliser + fin
  const hstab = new THREE.Mesh(new THREE.BoxGeometry(4.6, 0.12, 1.1), creamMat);
  hstab.position.set(0, 0.3, 3.0);
  plane.add(hstab);
  const fin = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.7, 1.3), bodyMat);
  fin.position.set(0, 1.0, 3.1);
  plane.add(fin);

  // Landing gear
  for (const side of [-1, 1]) {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 1.3, 6), darkMat);
    leg.position.set(side * 1.4, -1.2, -1.2);
    leg.rotation.z = side * 0.35;
    plane.add(leg);
    const wheel = new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.36, 0.22, 12), darkMat);
    wheel.rotation.z = Math.PI / 2;
    wheel.position.set(side * 1.9, -1.8, -1.2);
    plane.add(wheel);
  }
  const tailLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.8, 6), darkMat);
  tailLeg.position.set(0, -0.9, 3.0);
  plane.add(tailLeg);

  // Nav lights
  const navL = new THREE.Mesh(new THREE.SphereGeometry(0.12, 6, 6), new THREE.MeshBasicMaterial({ color: 0xff3333 }));
  navL.position.set(-5.7, 1.35, -0.6);
  plane.add(navL);
  const navR = navL.clone();
  navR.position.x = 5.7;
  navR.material = new THREE.MeshBasicMaterial({ color: 0x33ff55 });
  plane.add(navR);

  // Tag cockpit-obstructing parts so the camera rig can hide them in cockpit view.
  plane.userData.cockpitHidden = [wing, wingStripe, propGroup, ...plane.children.filter(ch => ch.geometry && ch.geometry.type === 'CylinderGeometry')];

  return plane;
}
