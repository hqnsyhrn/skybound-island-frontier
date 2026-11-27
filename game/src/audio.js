// SKYBOUND — audio: engine hum that tracks throttle, chimes for rings, wind, crash sound.
let ctx = null;
let engine = null, engineGain = null;
function ac() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)();
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export const sfx = {
  enabled: true,
  startEngine() {
    if (!this.enabled || engine) return;
    const a = ac();
    const o = a.createOscillator(), o2 = a.createOscillator(), g = a.createGain(), f = a.createBiquadFilter();
    o.type = 'sawtooth'; o.frequency.value = 55;
    o2.type = 'triangle'; o2.frequency.value = 110;
    f.type = 'lowpass'; f.frequency.value = 240;
    g.gain.value = 0.05;
    o.connect(f); o2.connect(f); f.connect(g).connect(a.destination);
    o.start(); o2.start();
    engine = { o, o2, f };
    engineGain = g;
  },
  setEngine(throttle) {
    if (!engine) return;
    const a = ac();
    engine.o.frequency.setTargetAtTime(50 + throttle * 40, a.currentTime, 0.1);
    engine.o2.frequency.setTargetAtTime(100 + throttle * 80, a.currentTime, 0.1);
    engineGain.gain.setTargetAtTime(0.03 + throttle * 0.05, a.currentTime, 0.1);
  },
  stopEngine() {
    if (engine) { try { engine.o.stop(); engine.o2.stop(); } catch {} engine = null; }
  },
  ring() {
    if (!this.enabled) return;
    const a = ac();
    [880, 1174].forEach((fq, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'sine'; o.frequency.value = fq;
      g.gain.setValueAtTime(0.09, a.currentTime + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + i * 0.07 + 0.25);
      o.connect(g).connect(a.destination);
      o.start(a.currentTime + i * 0.07); o.stop(a.currentTime + i * 0.07 + 0.3);
    });
  },
  crash() {
    if (!this.enabled) return;
    const a = ac();
    const buf = a.createBuffer(1, a.sampleRate * 0.6, a.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / d.length) * 0.5;
    const s = a.createBufferSource(); s.buffer = buf;
    const g = a.createGain(); g.gain.value = 0.2;
    const f = a.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 400;
    s.connect(f).connect(g).connect(a.destination); s.start();
  },
  success() {
    if (!this.enabled) return;
    const a = ac();
    [523, 659, 784, 1047].forEach((fq, i) => {
      const o = a.createOscillator(), g = a.createGain();
      o.type = 'triangle'; o.frequency.value = fq;
      g.gain.setValueAtTime(0.08, a.currentTime + i * 0.12);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + i * 0.12 + 0.3);
      o.connect(g).connect(a.destination);
      o.start(a.currentTime + i * 0.12); o.stop(a.currentTime + i * 0.12 + 0.35);
    });
  },
};
