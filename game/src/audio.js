// Vaultfall — sound effects synthesized with WebAudio: no audio files, every blip is
// an oscillator (or a breath of filtered noise) shaped by a gain envelope.
// The context is created lazily on the first user gesture, as browsers require.

let ctx = null;
let master = null;

export function initAudio() {
  if (ctx) {
    if (ctx.state === 'suspended') ctx.resume();
    return;
  }
  const AC = window.AudioContext || window.webkitAudioContext;
  if (!AC) return;
  ctx = new AC();
  master = ctx.createGain();
  master.gain.value = 0.5;
  master.connect(ctx.destination);
}

// One shaped tone. `slideTo` bends the pitch across the tone's life.
function tone(freq, dur, { type = 'square', gain = 0.16, slideTo = null, delay = 0 } = {}) {
  if (!ctx) return;
  const t0 = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const amp = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t0);
  if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, t0 + dur);
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + 0.012);
  amp.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
  osc.connect(amp).connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.05);
}

// A short filtered-noise tap, for footsteps.
function tap(dur = 0.05, gain = 0.05) {
  if (!ctx) return;
  const t0 = ctx.currentTime;
  const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
  const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.value = 420;
  const amp = ctx.createGain();
  amp.gain.value = gain;
  src.connect(filter).connect(amp).connect(master);
  src.start(t0);
}

export function sfxStep() {
  tap();
}

export function sfxPickup() {
  tone(880, 0.09, { type: 'sine', gain: 0.14 });
  tone(1318, 0.14, { type: 'sine', gain: 0.12, delay: 0.06 });
}

export function sfxCrackTick() {
  tone(1560, 0.04, { type: 'square', gain: 0.05 });
}

export function sfxSpotted() {
  tone(392, 0.16, { type: 'sawtooth', gain: 0.13 });
  tone(587, 0.22, { type: 'sawtooth', gain: 0.13, delay: 0.1 });
}

// The alarm going off for good: a falling two-tone sting.
export function sfxCaught() {
  tone(660, 0.5, { type: 'sawtooth', gain: 0.18, slideTo: 196 });
  tone(660, 0.5, { type: 'square', gain: 0.08, slideTo: 196, delay: 0.05 });
}

// A little major arpeggio when the vault pops or the thief gets away.
export function sfxSuccess() {
  const notes = [523, 659, 784, 1046];
  notes.forEach((freq, i) => tone(freq, 0.22, { type: 'triangle', gain: 0.16, delay: i * 0.09 }));
}

export function sfxClick() {
  tone(1200, 0.05, { type: 'square', gain: 0.06 });
}
