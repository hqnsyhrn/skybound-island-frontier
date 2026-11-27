// SKYBOUND: Island Frontier — main: scene setup, state machine (menu → play → end),
// screenshot hooks (?shot=menu|chase|cockpit|ring|runway&seed=N) and the game loop.
import * as THREE from 'three';
import { CONFIG } from './config.js';
import { makeRng } from './random.js';
import { buildIslands, buildTerrainMeshes, buildRunway, groundHeight } from './terrain.js';
import { buildOcean, updateOcean } from './ocean.js';
import { buildEnvironment } from './environment.js';
import { buildAircraft } from './aircraft.js';
import { createFlightState, updateFlight } from './flight-physics.js';
import { CameraRig } from './camera.js';
import { buildRings, Mission } from './missions.js';
import { Hud } from './hud.js';
import { sfx } from './audio.js';
import { Input } from './input.js';

const params = new URLSearchParams(location.search);
const shotMode = params.get('shot');
const seed = Number(params.get('seed') ?? 7);
const rng = makeRng(seed);

// Scene
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.getElementById('app').appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0xa8c8d8, CONFIG.fogNear, CONFIG.fogFar);
const camera = new THREE.PerspectiveCamera(62, window.innerWidth / window.innerHeight, 0.5, 9000);

buildIslands(seed, CONFIG.islandCount);
buildEnvironment(scene, seed);
buildTerrainMeshes(scene, seed);
buildRunway(scene, CONFIG.runway);
const ocean = buildOcean(scene);
const aircraft = buildAircraft();
scene.add(aircraft);
const rig = new CameraRig(camera);
rig.attachPanel(aircraft);
const hud = new Hud();

// State
let state = 'menu';                 // menu | play | end
let mode = 'free';
let flight = null;
let mission = null;
let rings = null;
let paused = false;
let camMode = 'chase';
let time = 0;
const input = new Input();

function startGame(m) {
  mode = m;
  flight = createFlightState();
  mission = new Mission(m);
  if (m === 'rings') rings = buildRings(scene, seed, makeRng);
  // Landing mode starts aligned with the runway approach.
  if (m === 'landing') {
    flight.pos.set(CONFIG.runway.x, 160, CONFIG.runway.z + 1400);
    flight.heading = 0; flight.throttle = 0.45; flight.speed = 45;
  }
  state = 'play';
  hud.show();
  hud.clearOverlay();
  sfx.startEngine();
}

function endGame() {
  state = 'end';
  sfx.stopEngine();
  hud.show();
  const title = mission.won ? 'MISSION COMPLETE' : flight.crashed ? 'CRASHED' : 'TIME UP';
  const detail = mission.landing
    ? `Touchdown ${mission.landing.speed} m/s · sink rate ${mission.landing.vSpeed} m/s · ${mission.landing.onRunway ? 'on the runway' : 'off the runway'}`
    : mode === 'rings' ? `${mission.nextRing} of ${CONFIG.ringCount} rings flown` : 'Sortie complete.';
  hud.overlay(title, `${detail}<br>Score: <b style="color:#ffd98a">${mission.score}</b> · Distance ${(flight.distanceFlown / 1000).toFixed(1)} km`,
    'Press ENTER to return to the menu');
}

function update(dt) {
  time += dt;
  updateOcean(ocean, time);
  if (state !== 'play') return;
  if (input.pausePressed()) { paused = !paused; if (paused) hud.overlay('PAUSED', 'The islands wait.', 'P to resume · R restart · ESC resume'); else hud.clearOverlay(); }
  if (paused) return;
  if (input.restartPressed()) { paused = false; startGame(mode); return; }
  if (input.cameraTogglePressed()) camMode = camMode === 'chase' ? 'cockpit' : 'chase';

  updateFlight(flight, input, dt);
  mission.update(dt, flight, rings ?? []);
  sfx.setEngine(flight.throttle);
  if (flight.crashed) { sfx.crash(); mission.done = true; mission.won = false; endGame(); return; }
  if (mission.done) { if (mission.won) sfx.success(); endGame(); return; }
}

function frame(ts) {
  const dt = Math.min(0.05, (ts - (frame.last ?? ts)) / 1000);
  frame.last = ts;
  if (shotMode) { renderShot(); return; }
  update(dt);
  draw();
  input.endFrame();
  requestAnimationFrame(frame);
}

function draw() {
  if (state === 'play' && !paused) {
    aircraft.position.copy(flight.pos);
    aircraft.quaternion.copy(flight.quat);
    aircraft.userData.prop.rotation.z += flight.throttle * dt() * 60 + 8;
    rig.update(0.016, flight, aircraft);
    if (rig.mode === 'cockpit') rig.drawPanel(flight);
    hud.draw(flight, mission, mode, rig.mode);
  }
  renderer.render(scene, camera);
}

function dt() { return 0.016; }

// Screenshot frames — deterministic poses for the entry's screenshots.
function renderShot() {
  flight = createFlightState();
  mission = new Mission('free');
  buildRings(scene, seed, makeRng);
  const poses = {
    menu: () => {
      state = 'menu';
      hud.show();
      hud.menu();
      flight.pos.set(0, 220, 2600);
      flight.heading = 0.3;
    },
    chase: () => {
      flight.pos.set(-140, 190, 1750); flight.heading = 0.22; flight.throttle = 0.8; flight.speed = 62;
      flight.pitch = 0.02; flight.roll = 0.10;
      camMode = 'chase';
    },
    cockpit: () => {
      flight.pos.set(-140, 210, 1750); flight.heading = 0.22; flight.throttle = 0.75; flight.speed = 58;
      camMode = 'cockpit';
      rig.mode = 'cockpit';
    },
    ring: () => {
      flight.pos.set(-430, 150, 1560); flight.heading = 0.18; flight.throttle = 0.85; flight.speed = 70;
      mission.mode = 'rings'; mission.nextRing = 5; mission.score = 850; mission.time = CONFIG.ringTime * 0.7;
      camMode = 'chase';
    },
    runway: () => {
      flight.pos.set(CONFIG.runway.x, 42, CONFIG.runway.z + 330); flight.heading = 0;
      flight.throttle = 0.3; flight.speed = 34; flight.pitch = -0.06;
      mission.mode = 'landing';
      camMode = 'chase';
    },
  };
  (poses[shotMode] ?? poses.chase)();
  aircraft.position.copy(flight.pos);
  aircraft.quaternion.copy(flight.quat);
  aircraft.userData.prop.rotation.z = 2;
  rig.mode = camMode;
  // Warm the camera up so chase framing is settled for the capture.
  for (let i = 0; i < 120; i++) rig.update(0.05, flight, aircraft);
  if (camMode === 'cockpit') rig.drawPanel(flight);
  hud.show();
  if (shotMode !== 'menu') hud.draw(flight, mission, mission.mode, camMode);
  renderer.render(scene, camera);
}

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Menu keys / end keys are handled here for the state machine.
window.addEventListener('keydown', (e) => {
  if (state === 'menu' && ['Digit1', 'Digit2', 'Digit3'].includes(e.code)) {
    startGame(CONFIG.modes[Number(e.code.slice(-1)) - 1]);
  } else if (state === 'end' && (e.code === 'Enter' || e.code === 'KeyR')) {
    state = 'menu';
    hud.menu();
  }
});

if (shotMode) {
  setTimeout(renderShot, 400);
  // Keep compositing so headless captures pick up the frame.
  (function spin() { draw(); requestAnimationFrame(spin); })();
} else {
  hud.menu();
  hud.show();
  requestAnimationFrame(frame);
}
