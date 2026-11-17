// OYEN DASH — procedural sound effects with WebAudio. No audio files:
// every sound is a small oscillator/noise recipe, so the game stays fully
// offline and self-contained. One clear job: make noise, nothing else.
let audioContext = null;
let muted = false;

export function isMuted() {
  return muted;
}

export function toggleMute() {
  muted = !muted;
  return muted;
}

function context() {
  if (typeof window === 'undefined') return null;
  if (!audioContext) {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      audioContext = new AC();
    } catch {
      return null;
    }
  }
  if (audioContext.state === 'suspended') {
    audioContext.resume().catch(() => {});
  }
  return audioContext;
}

// Prime the context from a real user gesture so later sounds are allowed.
export function unlockAudio() {
  context();
}

function tone({ frequency, endFrequency, duration, type, volume, delay = 0 }) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + delay;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (endFrequency !== undefined) {
      oscillator.frequency.exponentialRampToValueAtTime(Math.max(1, endFrequency), start + duration);
    }
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  } catch {
    // Sound is garnish: a failed blip must never break the game.
  }
}

function noiseBurst({ duration, volume, lowpass = 1200, delay = 0 }) {
  if (muted) return;
  const ctx = context();
  if (!ctx) return;
  try {
    const start = ctx.currentTime + delay;
    const length = Math.max(1, Math.floor(ctx.sampleRate * duration));
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i += 1) {
      data[i] = (Math.random() * 2 - 1) * (1 - i / length);
    }
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = lowpass;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    source.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);
    source.start(start);
  } catch {
    // Sound is garnish: a failed burst must never break the game.
  }
}

export const sfx = {
  jump() {
    tone({ frequency: 320, endFrequency: 660, duration: 0.16, type: 'sine', volume: 0.16 });
  },
  doubleJump() {
    tone({ frequency: 420, endFrequency: 880, duration: 0.16, type: 'sine', volume: 0.16 });
    tone({ frequency: 640, endFrequency: 1180, duration: 0.14, type: 'triangle', volume: 0.08, delay: 0.05 });
  },
  fish(combo = 1) {
    const base = 720 + Math.min(combo, 8) * 60;
    tone({ frequency: base, endFrequency: base * 1.5, duration: 0.12, type: 'triangle', volume: 0.18 });
    tone({ frequency: base * 2, duration: 0.1, type: 'sine', volume: 0.08, delay: 0.05 });
  },
  hit() {
    noiseBurst({ duration: 0.22, volume: 0.28, lowpass: 900 });
    tone({ frequency: 180, endFrequency: 60, duration: 0.25, type: 'sawtooth', volume: 0.14 });
  },
  gameOver() {
    tone({ frequency: 392, duration: 0.22, type: 'triangle', volume: 0.16 });
    tone({ frequency: 311, duration: 0.22, type: 'triangle', volume: 0.16, delay: 0.2 });
    tone({ frequency: 233, duration: 0.42, type: 'triangle', volume: 0.16, delay: 0.4 });
  },
  click() {
    tone({ frequency: 880, duration: 0.06, type: 'sine', volume: 0.1 });
  },
  milestone() {
    tone({ frequency: 523, duration: 0.1, type: 'triangle', volume: 0.12 });
    tone({ frequency: 659, duration: 0.1, type: 'triangle', volume: 0.12, delay: 0.09 });
    tone({ frequency: 784, duration: 0.16, type: 'triangle', volume: 0.12, delay: 0.18 });
  },
};
