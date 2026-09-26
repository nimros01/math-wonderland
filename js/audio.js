// Sound effects synthesized with Web Audio, so there are no files to download.
import { state } from './progress.js';

let ctx = null;

export function unlockAudio() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext;
    if (AC) ctx = new AC();
  }
  if (ctx && ctx.state === 'suspended') ctx.resume();
}

function tone(freq, start, dur, type = 'sine', vol = 0.18) {
  if (!ctx || state.muted) return;
  const t = ctx.currentTime + start;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, t);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(vol, t + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(g).connect(ctx.destination);
  o.start(t);
  o.stop(t + dur + 0.05);
}

const seq = (notes, step, type, vol) => notes.forEach((f, i) => tone(f, i * step, step * 1.6, type, vol));

export const sfx = {
  tap: () => tone(520, 0, 0.06, 'triangle', 0.08),
  ok: () => seq([660, 990], 0.09, 'triangle'),
  bad: () => { tone(220, 0, 0.18, 'square', 0.05); tone(180, 0.12, 0.22, 'square', 0.05); },
  streak: () => seq([523, 659, 784, 1047], 0.07, 'triangle'),
  star: () => seq([784, 1175], 0.08, 'sine', 0.2),
  chest: () => seq([392, 523, 659, 784, 1047, 1319], 0.08, 'triangle'),
  grow: () => seq([262, 330, 392, 523, 659, 784, 1047], 0.09, 'sine', 0.2),
  fail: () => seq([392, 330, 262], 0.14, 'triangle', 0.12),
};
