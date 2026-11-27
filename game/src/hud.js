// SKYBOUND — HUD: DOM overlay with altitude, speed, heading, throttle, mode, score,
// plus menus (title, mode select, pause, end). Styled with a clean aviation-instrument look.
import { CONFIG } from './config.js';

export class Hud {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'hud';
    this.root.style.cssText = `position:absolute;inset:0;pointer-events:none;
      font-family:'Segoe UI',system-ui,sans-serif;color:#eef4f8;`;
    document.body.appendChild(this.root);
    this.root.style.display = 'none';
  }

  show() { this.root.style.display = 'block'; }
  hide() { this.root.style.display = 'none'; }

  panel(left, top, inner, width = 190) {
    return `<div style="position:absolute;left:${left};top:${top};width:${width}px;
      background:rgba(10,16,24,0.72);border:1px solid rgba(140,180,220,0.35);border-radius:10px;
      padding:10px 14px;backdrop-filter:blur(3px);">${inner}</div>`;
  }

  row(label, value, color = '#eef4f8') {
    return `<div style="display:flex;justify-content:space-between;font-size:15px;margin:2px 0;">
      <span style="color:#9ab4c8;font-size:12px;letter-spacing:1px;">${label}</span>
      <span style="font-weight:700;color:${color};font-variant-numeric:tabular-nums;">${value}</span></div>`;
  }

  draw(flight, mission, mode, camMode) {
    const hdg = ((flight.heading * 180 / Math.PI) % 360 + 360) % 360;
    const stall = flight.stalled ? `<div style="color:#ff6a5a;font-weight:800;text-align:center;
      animation:none;margin-top:4px;">⚠ STALL</div>` : '';
    const objective = mission.mode === 'rings'
      ? this.row('RING', `${mission.nextRing}/${CONFIG.ringCount}`, '#7ee8a8') + this.row('TIME', `${Math.max(0, Math.ceil(mission.time))}s`, mission.time < 15 ? '#ff9a7a' : '#eef4f8')
      : mission.mode === 'landing'
        ? this.row('OBJECTIVE', 'LAND AT RWY', '#e8d87a')
        : this.row('DISTANCE', `${(flight.distanceFlown / 1000).toFixed(1)} km`, '#7ee8a8');
    this.root.innerHTML = `
      ${this.panel('20px', '20px', `
        ${this.row('ALTITUDE', `${Math.round(flight.pos.y)} m`, '#7ec9e8')}
        ${this.row('SPEED', `${Math.round(flight.speed)} m/s`)}
        ${this.row('HEADING', `${String(Math.round(hdg)).padStart(3, '0')}°`)}
        ${this.row('THROTTLE', `${Math.round(flight.throttle * 100)}%`, flight.throttle > 0.85 ? '#e8b84a' : '#eef4f8')}
        ${stall}
      `)}
      ${this.panel('20px', '190px', `
        <div style="font-size:11px;letter-spacing:2px;color:#8ab4c8;margin-bottom:4px;">${CONFIG.modeNames[mode]} · ${camMode.toUpperCase()} CAM</div>
        ${objective}
        ${this.row('SCORE', String(mission.score), '#e8d87a')}
        ${mission.message ? `<div style="color:#7ee8a8;font-weight:700;font-size:14px;margin-top:4px;">${mission.message}</div>` : ''}
      `)}
      <div style="position:absolute;right:20px;bottom:16px;font-size:12px;color:#9ab4c8;
        background:rgba(10,16,24,0.6);border-radius:8px;padding:6px 12px;">
        C camera · Shift/Ctrl throttle · Space brake · P pause · R restart
      </div>
    `;
    mission.message = '';
  }

  // Full-screen overlays
  overlay(title, subtitle, action, bg = 'rgba(8,14,22,0.78)') {
    this.root.innerHTML = `
      <div style="position:absolute;inset:0;background:${bg};display:flex;flex-direction:column;
        align-items:center;justify-content:center;pointer-events:auto;">
        <div style="font-size:64px;font-weight:800;letter-spacing:4px;color:#ffd98a;
          text-shadow:0 2px 18px rgba(255,180,80,0.35);margin-bottom:8px;">${title}</div>
        <div style="font-size:18px;color:#cfe0ec;margin-bottom:26px;max-width:640px;text-align:center;line-height:1.5;">${subtitle}</div>
        <div style="font-size:16px;color:#9ab4c8;">${action}</div>
      </div>`;
  }

  menu() {
    const modes = CONFIG.modes.map((m, i) => `
      <div style="background:rgba(20,32,44,0.9);border:1px solid rgba(140,180,220,0.3);border-radius:12px;
        padding:18px 26px;width:250px;text-align:center;">
        <div style="font-size:20px;font-weight:800;color:#ffd98a;margin-bottom:6px;">${i + 1}. ${CONFIG.modeNames[m]}</div>
        <div style="font-size:13px;color:#9ab4c8;line-height:1.4;">${
          m === 'free' ? 'Explore the archipelago at your own pace.' :
          m === 'rings' ? 'Fly 12 glowing rings before the timer ends.' :
          'Approach the runway and land as smoothly as you can.'
        }</div>
      </div>`).join('');
    this.root.innerHTML = `
      <div style="position:absolute;inset:0;background:linear-gradient(180deg,rgba(8,14,22,0.6),rgba(8,14,22,0.85));
        display:flex;flex-direction:column;align-items:center;justify-content:center;pointer-events:auto;">
        <div style="font-size:66px;font-weight:800;letter-spacing:6px;color:#ffd98a;
          text-shadow:0 2px 24px rgba(255,180,80,0.4);">SKYBOUND</div>
        <div style="font-size:18px;letter-spacing:8px;color:#8ab4c8;margin:4px 0 34px;">ISLAND FRONTIER</div>
        <div style="display:flex;gap:18px;">${modes}</div>
        <div style="font-size:15px;color:#9ab4c8;margin-top:30px;">
          W/S pitch · A/D roll · Shift throttle up · Ctrl down · Space brake · C camera</div>
        <div style="font-size:18px;color:#ffd98a;font-weight:700;margin-top:14px;">Press 1, 2 or 3 to fly</div>
      </div>`;
  }

  clearOverlay() { this.root.innerHTML = ''; }
}
