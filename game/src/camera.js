// SKYBOUND — cameras: smooth chase cam that banks with turns, and a cockpit cam with
// an instrument panel drawn on a canvas texture in front of the pilot.
import * as THREE from 'three';

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.mode = 'chase';                 // chase | cockpit
    this.pos = new THREE.Vector3(0, 130, 2470);
    this.look = new THREE.Vector3();
    this.panel = null;                    // cockpit panel mesh
  }

  toggle() { this.mode = this.mode === 'chase' ? 'cockpit' : 'chase'; }

  attachPanel(aircraftScene) {
    // Instrument panel sits ahead of the pilot in cockpit view.
    const cv = document.createElement('canvas');
    cv.width = 512; cv.height = 256;
    this.panelCanvas = cv;
    const tex = new THREE.CanvasTexture(cv);
    const mesh = new THREE.Mesh(
      new THREE.PlaneGeometry(1.6, 0.8),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true }));
    mesh.position.set(0, 0.42, -1.8);
    mesh.rotation.x = -0.18;
    aircraftScene.add(mesh);
    this.panel = mesh;
    this.panelTex = tex;
  }

  drawPanel(flight) {
    if (!this.panelCanvas) return;
    const g = this.panelCanvas.getContext('2d');
    // Dark panel with bezel
    g.fillStyle = 'rgba(18,20,26,0.92)';
    g.fillRect(0, 0, 512, 256);
    g.strokeStyle = '#3a4048'; g.lineWidth = 6;
    g.strokeRect(3, 3, 506, 250);
    const drawGauge = (x, y, r, value, label, unit, color = '#7ec96a') => {
      g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2);
      g.fillStyle = '#0c0e12'; g.fill();
      g.strokeStyle = '#4a5058'; g.lineWidth = 3; g.stroke();
      // Needle arc
      g.beginPath();
      g.arc(x, y, r - 8, Math.PI * 0.75, Math.PI * 0.75 + Math.PI * 1.5 * Math.min(1, Math.max(0, value)));
      g.strokeStyle = color; g.lineWidth = 5; g.stroke();
      g.fillStyle = '#e8e4d8'; g.font = 'bold 20px monospace'; g.textAlign = 'center';
      g.fillText(label, x, y + 4);
      g.font = '14px monospace';
      g.fillText(unit, x, y + r - 10);
    };
    drawGauge(110, 110, 70, flight.pos.y / 800, 'ALT', `${Math.round(flight.pos.y)} m`);
    drawGauge(256, 110, 70, flight.speed / 90, 'SPD', `${Math.round(flight.speed)} m/s`, '#6ab8e8');
    drawGauge(402, 110, 70, flight.throttle, 'THR', `${Math.round(flight.throttle * 100)}%`, '#e8b84a');
    // Heading strip
    g.fillStyle = '#0c0e12'; g.fillRect(60, 200, 392, 40);
    g.strokeStyle = '#4a5058'; g.strokeRect(60, 200, 392, 40);
    const hdg = ((flight.heading * 180 / Math.PI) % 360 + 360) % 360;
    g.fillStyle = '#e8e4d8'; g.font = 'bold 22px monospace'; g.textAlign = 'center';
    g.fillText(`HDG ${String(Math.round(hdg)).padStart(3, '0')}°`, 256, 228);
    this.panelTex.needsUpdate = true;
  }

  update(dt, flight, aircraftGroup) {
    const hidden = aircraftGroup.userData.cockpitHidden || [];
    for (const part of hidden) part.visible = this.mode !== 'cockpit';
    if (this.mode === 'cockpit') {
      // Camera at the pilot's eyes, oriented with the aircraft.
      const eye = new THREE.Vector3(0, 1.0, -0.6).applyQuaternion(flight.quat).add(flight.pos);
      this.camera.position.copy(eye);
      this.camera.quaternion.copy(flight.quat);
      if (this.panel) this.panel.visible = true;
      return;
    }
    if (this.panel) this.panel.visible = false;
    // Chase: behind and above, banking slightly with the roll.
    const back = new THREE.Vector3(0, 4.2, 20).applyQuaternion(flight.quat);
    const target = flight.pos.clone().add(back);
    this.pos.lerp(target, Math.min(1, dt * 3.2));
    this.camera.position.copy(this.pos);
    // Look slightly ahead of and below the aircraft: keeps rings & terrain in frame.
    const ahead = new THREE.Vector3(0, -6, -60).applyQuaternion(flight.quat).add(flight.pos);
    this.look.lerp(ahead, Math.min(1, dt * 5));
    this.camera.lookAt(this.look);
    // Bank the camera subtly with the aircraft's roll.
    this.camera.rotateZ(flight.roll * 0.18);
  }
}
