// Tiny WebAudio synth: every sound is generated, no audio files.
// Silent until the first user gesture (AudioContext starts lazily).
export class Sfx {
  constructor() {
    this.ctx = null;
    this.muted = false;
  }

  ensure() {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        this.ctx = new AC();
      } catch {
        this.ctx = null;
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') void this.ctx.resume();
    return this.ctx;
  }

  tone(freq, dur, type = 'sine', vol = 0.12, slideTo = null) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  noise(dur, vol = 0.15, freq = 1200) {
    const ctx = this.ensure();
    if (!ctx || this.muted) return;
    const t0 = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start(t0);
  }

  chop() { this.noise(0.08, 0.2, 2500); }
  pickup() { this.tone(520, 0.07, 'triangle', 0.1); }
  place() { this.tone(300, 0.08, 'triangle', 0.1, 200); }
  sizzle() { this.noise(0.35, 0.08, 4000); }
  ding() { this.tone(880, 0.18, 'sine', 0.14); this.tone(1320, 0.25, 'sine', 0.1); }
  error() { this.tone(160, 0.22, 'sawtooth', 0.1, 110); }
  tick() { this.tone(1000, 0.05, 'square', 0.05); }
  serve() { this.tone(660, 0.1, 'triangle', 0.12); setTimeout(() => this.tone(990, 0.16, 'triangle', 0.12), 90); }
}
