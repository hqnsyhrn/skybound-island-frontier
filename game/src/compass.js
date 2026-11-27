// SKYBOUND — compass: a horizontal heading tape rendered as a DOM strip at the top centre.
// Ticks every 15°, cardinal letters, and a caret marking the current heading.
export class CompassTape {
  constructor() {
    this.root = document.createElement('div');
    this.root.id = 'compass';
    this.root.style.cssText = `position:absolute;left:50%;top:14px;transform:translateX(-50%);
      width:340px;height:34px;overflow:hidden;pointer-events:none;
      background:rgba(10,16,24,0.65);border:1px solid rgba(140,180,220,0.35);border-radius:8px;`;
    this.strip = document.createElement('div');
    this.strip.style.cssText = `position:absolute;top:0;height:100%;white-space:nowrap;
      font:600 13px 'Segoe UI',system-ui,sans-serif;color:#dfe9f2;`;
    this.root.appendChild(this.strip);
    this.caret = document.createElement('div');
    this.caret.style.cssText = `position:absolute;left:50%;top:0;width:2px;height:100%;
      background:#ffd98a;transform:translateX(-1px);`;
    this.root.appendChild(this.caret);
    // Build the tick strip once: three copies for seamless wrap.
    const names = { 0: 'N', 90: 'E', 180: 'S', 270: 'W' };
    let html = '';
    for (let copy = 0; copy < 3; copy++) {
      for (let d = 0; d < 360; d += 15) {
        const big = d % 90 === 0;
        html += `<span style="position:absolute;left:${copy * 360 + d * 2}px;top:6px;
          font-size:${big ? 14 : 11}px;color:${big ? '#ffd98a' : '#9ab4c8'};">
          ${big ? names[d] : '|'}</span>`;
      }
    }
    this.strip.innerHTML = html;
    this.hdg = 0;
  }

  // heading in radians (0 = north, clockwise).
  draw(heading) {
    const deg = ((heading * 180 / Math.PI) % 360 + 360) % 360;
    this.hdg = deg;
    // Slide the strip so the current heading sits under the caret.
    const px = deg * 2;                    // 2px per degree
    this.strip.style.transform = `translateX(${170 - px - 360}px)`;
  }

  show(visible) { this.root.style.display = visible ? 'block' : 'none'; }
}
