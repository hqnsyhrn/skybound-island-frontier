// SKYBOUND — settings: persistent options (sound on/off, camera default, quality)
// stored in localStorage, with a small panel toggled from the menu with the S key.
const KEY = 'skybound.settings';

const defaults = {
  sound: true,
  startCamera: 'chase',      // 'chase' | 'cockpit'
  clouds: true,              // toggle cloud sprites for weaker machines
};

export function loadSettings() {
  try {
    return { ...defaults, ...JSON.parse(localStorage.getItem(KEY) || '{}') };
  } catch {
    return { ...defaults };
  }
}

export function saveSettings(s) {
  try { localStorage.setItem(KEY, JSON.stringify(s)); } catch { /* private mode */ }
}

export class SettingsPanel {
  constructor(onChange) {
    this.settings = loadSettings();
    this.onChange = onChange;
    this.root = document.createElement('div');
    this.root.id = 'settings';
    this.root.style.cssText = `position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);
      display:none;pointer-events:auto;background:rgba(14,22,32,0.94);
      border:1px solid rgba(140,180,220,0.4);border-radius:14px;padding:26px 34px;
      font-family:'Segoe UI',system-ui,sans-serif;color:#eef4f8;text-align:center;`;
    document.body.appendChild(this.root);
    this.render();
  }

  toggle() {
    const show = this.root.style.display !== 'block';
    this.root.style.display = show ? 'block' : 'none';
  }

  hide() { this.root.style.display = 'none'; }

  render() {
    const s = this.settings;
    const row = (label, key, on) => `
      <div data-key="${key}" class="skybound-toggle" style="cursor:pointer;margin:8px 0;
        display:flex;justify-content:space-between;gap:40px;align-items:center;">
        <span style="font-size:15px;">${label}</span>
        <span style="font-weight:800;color:${on ? '#7ee8a8' : '#ff9a7a'};">${on ? 'ON' : 'OFF'}</span>
      </div>`;
    this.root.innerHTML = `
      <div style="font-size:20px;font-weight:800;color:#ffd98a;margin-bottom:12px;">SETTINGS</div>
      ${row('Sound effects', 'sound', s.sound)}
      ${row('Clouds', 'clouds', s.clouds)}
      <div style="margin-top:10px;font-size:13px;color:#9ab4c8;">
        Start camera: <b style="color:#7ec9e8;">${s.startCamera.toUpperCase()}</b> (click to switch)</div>
      <div data-key="startCamera" class="skybound-toggle" style="cursor:pointer;margin-top:6px;
        font-size:13px;color:#7ee8a8;">switch start camera</div>
      <div style="margin-top:14px;font-size:12px;color:#9ab4c8;">S closes · saved automatically</div>`;
    this.root.querySelectorAll('.skybound-toggle').forEach(el => {
      el.addEventListener('click', () => {
        const key = el.dataset.key;
        if (key === 'startCamera') {
          s.startCamera = s.startCamera === 'chase' ? 'cockpit' : 'chase';
        } else {
          s[key] = !s[key];
        }
        saveSettings(s);
        this.render();
        this.onChange(s);
      });
    });
  }
}
