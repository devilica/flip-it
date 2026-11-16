/**
 * Synthesizes the original FLIP IT! sound effects and looping music bed.
 * Node built-ins only. Run with: node scripts/generate-audio.js
 */
const fs = require('fs');
const path = require('path');

const OUT = path.join(__dirname, '..', 'src', 'assets', 'audio');
const SR = 44100;
const TWO_PI = Math.PI * 2;

const midi = (note) => 440 * 2 ** ((note - 69) / 12);
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

function attackDecay(t, attack, decay) {
  if (t < 0) return 0;
  if (t < attack) return t / attack;
  return Math.exp(-(t - attack) / decay);
}

/** One-pole low-pass. `state` is a one-element array holding the previous output. */
function lowpass(sample, cutoff, state) {
  const a = 1 - Math.exp((-TWO_PI * cutoff) / SR);
  state[0] += a * (sample - state[0]);
  return state[0];
}

/** Advances its own phase, so a changing frequency becomes a real pitch glide. */
function oscillator() {
  let phase = 0;
  return (freq, wave = 'sine') => {
    phase += (TWO_PI * freq) / SR;
    if (wave === 'triangle') {
      const x = ((phase / TWO_PI) % 1 + 1) % 1;
      return x < 0.5 ? 4 * x - 1 : 3 - 4 * x;
    }
    return Math.sin(phase);
  };
}

/**
 * Renders a mono buffer. `voice` receives time in seconds and returns a sample.
 * The result is normalized to `peak` (linear, 1 = full scale).
 */
function render(duration, voice, peak = 0.71) {
  const n = Math.max(1, Math.floor(SR * duration));
  const samples = new Float32Array(n);
  let max = 0;
  for (let i = 0; i < n; i += 1) {
    const value = voice(i / SR);
    samples[i] = value;
    const abs = Math.abs(value);
    if (abs > max) max = abs;
  }
  const gain = max > 0 ? peak / max : 0;
  for (let i = 0; i < n; i += 1) samples[i] *= gain;
  return samples;
}

function fadeEdges(samples, seconds) {
  const n = Math.min(Math.floor(SR * seconds), Math.floor(samples.length / 2));
  for (let i = 0; i < n; i += 1) {
    const g = i / n;
    samples[i] *= g;
    samples[samples.length - 1 - i] *= g;
  }
  return samples;
}

function writeWav(file, channels) {
  const frames = channels[0].length;
  const data = Buffer.alloc(frames * channels.length * 2);
  for (let i = 0; i < frames; i += 1) {
    for (let c = 0; c < channels.length; c += 1) {
      const s = clamp(channels[c][i], -1, 1);
      data.writeInt16LE(Math.round(s * 32767), (i * channels.length + c) * 2);
    }
  }
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + data.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20);
  header.writeUInt16LE(channels.length, 22);
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * channels.length * 2, 28);
  header.writeUInt16LE(channels.length * 2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(data.length, 40);
  fs.writeFileSync(file, Buffer.concat([header, data]));
}

function noiseBurst(t, duration) {
  if (t < 0 || t > duration) return 0;
  const env = 1 - t / duration;
  return (Math.random() * 2 - 1) * env * env;
}

/** A soft plucked note: sine body, quiet triangle edge, short noise tick, low-passed. */
function freshPluck(options = {}) {
  const state = [0];
  const sine = oscillator();
  const triangle = oscillator();
  return (t, freq, extra = {}) => {
    if (t < 0) return 0;
    const { attack = 0.008, decay = 0.18, glide = null, tick = 0.12, cutoff = 2400 } = { ...options, ...extra };
    const f = glide ? glide(t) : freq;
    const body = sine(f) * 0.82 + triangle(f) * 0.18;
    const sample = body * attackDecay(t, attack, decay) + noiseBurst(t, 0.01) * tick;
    return lowpass(sample, cutoff, state);
  };
}

function bell(t, freq, decay) {
  if (t < 0) return 0;
  const e = attackDecay(t, 0.004, decay);
  return (
    Math.sin(TWO_PI * freq * t) * 0.7 +
    Math.sin(TWO_PI * freq * 2.01 * t) * 0.22 +
    Math.sin(TWO_PI * freq * 3.0 * t) * 0.08
  ) * e;
}

const effects = {
  tap: () => {
    const voice = freshPluck({ tick: 0.55, cutoff: 3200, decay: 0.045 });
    return render(0.09, (t) => voice(t, 860, { glide: () => 860 - t * 2800 }));
  },
  button: () => {
    const voice = freshPluck({ tick: 0.2, cutoff: 1400, decay: 0.05, attack: 0.01 });
    return render(0.08, (t) => voice(t, 466));
  },
  undo: () => {
    const a = freshPluck({ decay: 0.09, cutoff: 1800 });
    const b = freshPluck({ decay: 0.12, cutoff: 1600 });
    return render(0.3, (t) => a(t, 587) * 0.9 + b(t - 0.12, 392));
  },
  hint: () => {
    return render(0.42, (t) => bell(t, 659.25, 0.16) + bell(t - 0.14, 987.77, 0.2) * 0.9);
  },
  star: () => {
    return render(0.32, (t) => bell(t, 1318.5, 0.22) * (1 + 0.15 * Math.sin(TWO_PI * 9 * t)));
  },
  win: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    return render(0.9, (t) => notes.reduce((sum, freq, i) => sum + bell(t - i * 0.13, freq, 0.32), 0));
  },
  fail: () => {
    const state = [0];
    const sine = oscillator();
    const triangle = oscillator();
    return render(0.6, (t) => {
      const freq = 349 - t * 180;
      const body = triangle(freq) * 0.7 + sine(freq) * 0.3;
      return lowpass(body * attackDecay(t, 0.02, 0.28), 900, state);
    }, 0.45);
  },
};

/** 16-second loop at 60 BPM: one beat per second, so the phrase is exactly 16 beats. */
function music() {
  const beats = 16;
  const duration = beats;
  const melody = [
    [0, 64, 2],
    [2, 67, 2],
    [4, 69, 2],
    [6, 67, 1],
    [7, 64, 1],
    [8, 62, 2],
    [10, 64, 2],
    [12, 60, 4],
  ];
  const plucks = melody.map(() => freshPluck({ decay: 0.55, cutoff: 1600, tick: 0.04, attack: 0.012 }));
  const padNotes = [48, 55, 64];
  const detune = [4, -4];

  const n = SR * duration;
  const left = new Float32Array(n);
  const right = new Float32Array(n);

  for (let i = 0; i < n; i += 1) {
    const t = i / SR;
    const tremolo = 0.92 + 0.08 * Math.sin(TWO_PI * 0.125 * t);
    let padL = 0;
    let padR = 0;
    for (const note of padNotes) {
      const f = midi(note);
      padL += Math.sin(TWO_PI * f * 2 ** (detune[0] / 1200) * t);
      padR += Math.sin(TWO_PI * f * 2 ** (detune[1] / 1200) * t);
    }
    padL = (padL / padNotes.length) * 0.16 * tremolo;
    padR = (padR / padNotes.length) * 0.16 * tremolo;

    let lead = 0;
    melody.forEach(([start, note, length], index) => {
      const local = t - start;
      if (local < 0 || local > length + 0.4) return;
      lead += plucks[index](local, midi(note), { decay: 0.25 + length * 0.18 }) * 0.34;
    });

    const bassBeat = Math.floor(t / 4) * 4;
    const bass = Math.sin(TWO_PI * midi(36) * (t - bassBeat)) * attackDecay(t - bassBeat, 0.01, 0.7) * 0.22;

    left[i] = padL + lead + bass;
    right[i] = padR + lead + bass;
  }

  let max = 0;
  for (let i = 0; i < n; i += 1) max = Math.max(max, Math.abs(left[i]), Math.abs(right[i]));
  const gain = max > 0 ? 0.4 / max : 0;
  for (let i = 0; i < n; i += 1) {
    left[i] *= gain;
    right[i] *= gain;
  }
  fadeEdges(left, 0.05);
  fadeEdges(right, 0.05);
  return [left, right];
}

fs.mkdirSync(OUT, { recursive: true });
for (const [name, make] of Object.entries(effects)) {
  writeWav(path.join(OUT, `${name}.wav`), [make()]);
}
writeWav(path.join(OUT, 'music.wav'), music());
console.log('Audio written to', OUT);
