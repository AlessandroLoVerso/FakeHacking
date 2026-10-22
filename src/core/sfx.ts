// Suoni sintetizzati al volo con Web Audio: niente file audio da distribuire.
import { getSettings } from './settings';
import { rand } from './util';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let muted = false;

function audio(): { ctx: AudioContext; out: GainNode } | null {
  const s = getSettings();
  if (!s.sound || muted) return null;
  if (!ctx) {
    try {
      ctx = new AudioContext();
      master = ctx.createGain();
      master.connect(ctx.destination);
    } catch {
      return null;
    }
  }
  if (ctx.state === 'suspended') void ctx.resume();
  master!.gain.value = (s.volume / 100) * 0.5;
  return { ctx, out: master! };
}

function tone(freq: number, dur: number, type: OscillatorType = 'square', vol = 0.15, delay = 0) {
  const a = audio();
  if (!a) return;
  const t = a.ctx.currentTime + delay;
  const osc = a.ctx.createOscillator();
  const g = a.ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  osc.connect(g).connect(a.out);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}

function noise(dur: number, vol: number, filterFreq: number) {
  const a = audio();
  if (!a) return;
  const len = Math.floor(a.ctx.sampleRate * dur);
  const buf = a.ctx.createBuffer(1, len, a.ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = a.ctx.createBufferSource();
  src.buffer = buf;
  const f = a.ctx.createBiquadFilter();
  f.type = 'bandpass';
  f.frequency.value = filterFreq;
  const g = a.ctx.createGain();
  g.gain.value = vol;
  src.connect(f).connect(g).connect(a.out);
  src.start();
}

let lastKey = 0;

export const sfx = {
  setMuted(v: boolean) {
    muted = v;
  },
  isMuted: () => muted || !getSettings().sound,
  key() {
    const now = performance.now();
    if (now - lastKey < 25) return;
    lastKey = now;
    noise(0.03, 0.35, rand(1800, 3200));
  },
  blip() {
    tone(rand(1200, 2400), 0.05, 'square', 0.05);
  },
  beep() {
    tone(880, 0.09, 'square', 0.08);
  },
  success() {
    [523, 659, 784, 1047].forEach((f, i) => tone(f, 0.18, 'triangle', 0.18, i * 0.08));
  },
  denied() {
    tone(140, 0.45, 'sawtooth', 0.2);
    tone(110, 0.45, 'sawtooth', 0.2, 0.05);
  },
  alert() {
    tone(1000, 0.12, 'square', 0.1);
    tone(1000, 0.12, 'square', 0.1, 0.18);
  },
  /** Sirena a salire e scendere per `ms` millisecondi. */
  siren(ms: number) {
    const a = audio();
    if (!a) return;
    const t = a.ctx.currentTime;
    const osc = a.ctx.createOscillator();
    const g = a.ctx.createGain();
    osc.type = 'sawtooth';
    const cycles = Math.max(1, Math.round(ms / 900));
    for (let i = 0; i < cycles; i++) {
      osc.frequency.setValueAtTime(520, t + i * 0.9);
      osc.frequency.linearRampToValueAtTime(980, t + i * 0.9 + 0.45);
      osc.frequency.linearRampToValueAtTime(520, t + i * 0.9 + 0.9);
    }
    g.gain.setValueAtTime(0.07, t);
    g.gain.setValueAtTime(0.07, t + ms / 1000 - 0.1);
    g.gain.linearRampToValueAtTime(0.0001, t + ms / 1000);
    osc.connect(g).connect(a.out);
    osc.start(t);
    osc.stop(t + ms / 1000 + 0.05);
  },
  boom() {
    noise(1.4, 1.2, 120);
    tone(55, 1.2, 'sine', 0.5);
  },
  tick() {
    tone(1600, 0.03, 'square', 0.06);
  },
};
