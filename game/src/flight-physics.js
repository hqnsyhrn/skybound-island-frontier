// SKYBOUND — arcade flight physics: throttle, lift approximation, stall, banking turns,
// ground contact and landing assessment. Positions in metres, craft nose faces -Z.
import { CONFIG } from './config.js';
import { groundHeight } from './terrain.js';
import * as THREE from 'three';

export function createFlightState() {
  return {
    pos: new THREE.Vector3(0, 120, 2400),   // start airborne heading to the runway island
    vel: new THREE.Vector3(0, 0, -40),
    quat: new THREE.Quaternion(),
    throttle: 0.65,
    speed: 40,
    pitchInput: 0, rollInput: 0, yawInput: 0,
    pitch: 0, roll: 0, heading: 0,
    stalled: false, onGround: false,
    crashed: false,
    distanceFlown: 0,
  };
}

const tmpEuler = new THREE.Euler();

export function updateFlight(f, input, dt) {
  // Throttle
  if (input.keys.has('ShiftLeft') || input.keys.has('ShiftRight')) f.throttle = Math.min(CONFIG.maxThrottle, f.throttle + CONFIG.throttleRate * dt);
  if (input.keys.has('ControlLeft') || input.keys.has('ControlRight')) f.throttle = Math.max(0, f.throttle - CONFIG.throttleRate * dt);
  if (input.keys.has('Space')) f.throttle = Math.max(0, f.throttle - CONFIG.brakeStrength * dt);

  // Control inputs (smoothed)
  let pitch = 0, roll = 0;
  if (input.keys.has('KeyW') || input.keys.has('ArrowUp')) pitch += 1;   // nose up / climb
  if (input.keys.has('KeyS') || input.keys.has('ArrowDown')) pitch -= 1; // nose down / dive
  if (input.keys.has('KeyA') || input.keys.has('ArrowLeft')) roll = 1;
  if (input.keys.has('KeyD') || input.keys.has('ArrowRight')) roll = -1;
  f.pitchInput += (pitch - f.pitchInput) * Math.min(1, dt * 6);
  f.rollInput += (roll - f.rollInput) * Math.min(1, dt * 6);

  const speedT = Math.min(1, f.speed / CONFIG.maxSpeed);
  // Banked turning: roll drives a yaw rate.
  f.roll += f.rollInput * CONFIG.rollRate * (0.4 + 0.6 * speedT) * dt;
  f.roll = Math.max(-1.2, Math.min(1.2, f.roll));
  if (Math.abs(f.rollInput) < 0.01) f.roll *= 1 - Math.min(1, dt * 1.5);  // auto-level a little
  const turn = -f.roll * 0.9 * (0.5 + speedT * 0.5);
  f.heading += turn * dt;

  f.pitch += f.pitchInput * CONFIG.pitchRate * (0.5 + 0.5 * speedT) * dt;
  if (Math.abs(f.pitchInput) < 0.01 && !f.onGround) f.pitch *= 1 - Math.min(1, dt * 0.8); // nose eases back to level
  f.pitch = Math.max(-0.9, Math.min(0.9, f.pitch));

  // Speed from throttle minus drag and climb penalty.
  const targetSpeed = CONFIG.minSpeed + f.throttle * (CONFIG.maxSpeed - CONFIG.minSpeed);
  const climbDrag = Math.max(0, f.pitch) * 22;
  f.speed += ((targetSpeed - climbDrag) - f.speed) * Math.min(1, dt * 0.9);

  // Lift approximation: below stall speed the aircraft sinks regardless of pitch.
  f.stalled = f.speed < CONFIG.stallSpeed && !f.onGround;
  let vy = Math.sin(f.pitch) * f.speed;
  if (f.stalled) vy -= (CONFIG.stallSpeed - f.speed) * 2.2;
  else vy -= CONFIG.gravity * dt * (1 - Math.min(1, f.speed / CONFIG.minSpeed)) * 2.0;

  // Integrate position from heading + pitch.
  const dirX = -Math.sin(f.heading), dirZ = -Math.cos(f.heading);
  const vx = dirX * f.speed * Math.cos(f.pitch);
  const vz = dirZ * f.speed * Math.cos(f.pitch);
  f.pos.x += vx * dt;
  f.pos.z += vz * dt;
  f.pos.y += vy * dt;
  f.distanceFlown += f.speed * dt;

  // Ground contact
  const ground = groundHeight(f.pos.x, f.pos.z);
  f.onGround = false;
  if (f.pos.y <= ground + 1.8) {
    if (f.pos.y < ground - 4 || f.speed > 78) {
      f.crashed = true;                       // flew into terrain
    }
    f.pos.y = ground + 1.8;
    f.onGround = true;
    if (f.pitch > 0.05 && f.speed > 8) f.speed *= 1 - dt * 0.8;  // friction
    // Keep the nose level on the ground
    f.pitch *= 1 - Math.min(1, dt * 4);
    f.roll *= 1 - Math.min(1, dt * 4);
  }
  // Hard sea floor guard
  if (f.pos.y < -2) f.crashed = true;

  // Apply orientation: yaw (heading), then pitch, then roll.
  tmpEuler.set(f.pitch, f.heading, f.roll * 0.8, 'YXZ');
  f.quat.setFromEuler(tmpEuler);
}

// Touchdown quality for the landing mode, assessed when the wheels settle.
export function assessLanding(f) {
  const vSpeed = Math.abs(Math.sin(f.pitch) * f.speed);
  const speedScore = Math.max(0, 1 - f.speed / (CONFIG.landSpeedMax * 1.6));
  const angleScore = Math.max(0, 1 - Math.abs(f.pitch) / CONFIG.landAngleMax);
  // Distance from runway centre-line and threshold.
  const rw = CONFIG.runway;
  const dx = f.pos.x - rw.x;
  const dz = f.pos.z - rw.z;
  const centre = Math.hypot(dx, dz) < rw.length / 2 && Math.abs(dx) < rw.width / 2;
  const onRunway = centre ? 1 : 0;
  return {
    speed: Math.round(f.speed * 10) / 10,
    vSpeed: Math.round(vSpeed * 10) / 10,
    score: Math.round((speedScore * 40 + angleScore * 40 + onRunway * 20) * 10),
    onRunway: !!onRunway,
  };
}
