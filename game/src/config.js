// SKYBOUND: Island Frontier — configuration: world, flight model and mode tuning.
export const CONFIG = {
  // World
  seaLevel: 0,
  islandCount: 14,
  worldRadius: 4000,            // metres of playable sea before wrap-around fog
  fogNear: 900, fogFar: 3200,

  // Flight model (arcade)
  gravity: 9.8,
  maxSpeed: 90,                 // m/s
  minSpeed: 18,                 // below this the aircraft stalls
  stallSpeed: 16,
  maxThrottle: 1.0,
  throttleRate: 0.55,           // per second
  pitchRate: 1.1,               // rad/s at full deflection
  rollRate: 2.0,
  yawRate: 0.45,
  liftFactor: 0.9,              // how strongly speed keeps altitude
  dragFactor: 0.012,
  brakeStrength: 0.5,

  // Rings
  ringCount: 12,
  ringRadius: 22,
  ringScore: 100,
  ringComboBonus: 50,
  ringTime: 120,                // seconds for the ring challenge

  // Landing
  landSpeedMax: 30,             // m/s for a good touchdown
  landAngleMax: 0.12,           // rad of pitch at touchdown
  runway: { x: 0, z: 2600, heading: 0, length: 420, width: 34 },

  // Modes
  modes: ['free', 'rings', 'landing'],
  modeNames: { free: 'FREE FLIGHT', rings: 'RING CHALLENGE', landing: 'PRECISION LANDING' },
};
