// Mechanical tactile sound synthesizer using Web Audio API
class HapticSoundController {
  constructor() {
    this.ctx = null;
  }

  init() {
    if (typeof window === 'undefined') return;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  playTick(pitchModifier = 1) {
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1400 * pitchModifier, t);
      filter.Q.setValueAtTime(3, t);

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(320 * pitchModifier, t);
      osc.frequency.exponentialRampToValueAtTime(40, t + 0.035);

      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.035);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(t);
      osc.stop(t + 0.035);
    } catch {
      // Audio safety
    }
  }

  playCelebration() {
    try {
      this.init();
      if (!this.ctx) return;

      const t = this.ctx.currentTime;
      const freqs = [311.13, 392.00, 466.16, 587.33, 783.99];

      freqs.forEach((f, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, t + idx * 0.06);

        gain.gain.setValueAtTime(0, t + idx * 0.06);
        gain.gain.linearRampToValueAtTime(0.06, t + idx * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, t + idx * 0.06 + 1.2);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(t + idx * 0.06);
        osc.stop(t + idx * 0.06 + 1.2);
      });
    } catch {
      // Audio safety
    }
  }

  playFlip() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.exponentialRampToValueAtTime(160, t + 0.15);
      gain.gain.setValueAtTime(0.08, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.15);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.15);
    } catch {
      // Audio safety
    }
  }

  playShuffle() {
    try {
      this.init();
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      for (let i = 0; i < 7; i++) {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(260 + i * 35, t + i * 0.045);
        gain.gain.setValueAtTime(0.07, t + i * 0.045);
        gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.045 + 0.04);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + i * 0.045);
        osc.stop(t + i * 0.045 + 0.04);
      }
    } catch {
      // Audio safety
    }
  }
}

export const sounds = new HapticSoundController();
