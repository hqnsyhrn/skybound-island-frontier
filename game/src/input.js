// SKYBOUND — input: keyboard flight controls, camera toggle, pause, restart.
export class Input {
  constructor() {
    this.keys = new Set();
    this.pressed = new Set();
    window.addEventListener('keydown', (e) => {
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' '].includes(e.key)) e.preventDefault();
      if (!this.keys.has(e.code)) this.pressed.add(e.code);
      this.keys.add(e.code);
    });
    window.addEventListener('keyup', (e) => this.keys.delete(e.code));
  }
  cameraTogglePressed() { return this.pressed.has('KeyC'); }
  restartPressed() { return this.pressed.has('KeyR'); }
  pausePressed() { return this.pressed.has('KeyP') || this.pressed.has('Escape'); }
  confirmPressed() { return this.pressed.has('Enter') || this.pressed.has('Space'); }
  endFrame() { this.pressed.clear(); }
}
