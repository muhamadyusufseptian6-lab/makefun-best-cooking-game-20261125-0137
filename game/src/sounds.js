// sounds.js — every sound is synthesized with WebAudio, no audio files and
// no network. Created on the first user gesture, so browsers allow it.

export class SoundFX {
  constructor() {
    this.ctx = null;
    this.muted = false;
    this.sizzleNodes = null;
  }

  ensure() {
    if (!this.ctx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      this.ctx = new AudioContext();
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  tone(freq, seconds, type = 'sine', volume = 0.12, when = 0) {
    if (!this.ctx || this.muted) return;
    const t0 = this.ctx.currentTime + when;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    gain.gain.setValueAtTime(volume, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + seconds);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t0);
    osc.stop(t0 + seconds + 0.02);
  }

  noise(seconds, volume = 0.08, filterFreq = 1800) {
    if (!this.ctx || this.muted) return;
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = filterFreq;
    const gain = this.ctx.createGain();
    gain.gain.value = volume;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start();
  }

  chop() { this.noise(0.09, 0.14, 2400); this.tone(190, 0.06, 'triangle', 0.08); }
  pop() { this.tone(520, 0.07, 'square', 0.06); }
  ding() { this.tone(880, 0.18, 'sine', 0.14); this.tone(1318, 0.3, 'sine', 0.1, 0.08); }
  error() { this.tone(160, 0.22, 'sawtooth', 0.1); this.tone(110, 0.3, 'sawtooth', 0.08, 0.08); }
  fanfare() { [523, 659, 784, 1046].forEach((f, i) => this.tone(f, 0.22, 'triangle', 0.12, i * 0.09)); }
  tick() { this.tone(1200, 0.04, 'square', 0.04); }
  rush() { [392, 523, 659].forEach((f, i) => this.tone(f, 0.16, 'square', 0.09, i * 0.07)); }

  startSizzle() {
    if (!this.ctx || this.muted || this.sizzleNodes) return;
    const len = this.ctx.sampleRate;
    const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
    const src = this.ctx.createBufferSource();
    src.buffer = buffer;
    src.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'highpass';
    filter.frequency.value = 4000;
    const gain = this.ctx.createGain();
    gain.gain.value = 0.015;
    src.connect(filter).connect(gain).connect(this.ctx.destination);
    src.start();
    this.sizzleNodes = { src, gain };
  }

  stopSizzle() {
    if (!this.sizzleNodes) return;
    try { this.sizzleNodes.src.stop(); } catch {
      // already stopped
    }
    this.sizzleNodes = null;
  }
}
