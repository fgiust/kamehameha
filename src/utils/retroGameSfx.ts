/** Lightweight Web Audio chiptune blips for the transitive drop mini-game. */

type Tone = {
  freq: number;
  dur: number;
  type?: OscillatorType;
  vol?: number;
  slide?: number;
};

let ctx: AudioContext | null = null;

function getCtx(): AudioContext | null {
  try {
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    if (!ctx) ctx = new Ctor();
    if (ctx.state === 'suspended') void ctx.resume();
    return ctx;
  } catch {
    return null;
  }
}

function playTone(tone: Tone, when = 0) {
  const audio = getCtx();
  if (!audio) return;
  const t0 = audio.currentTime + when;
  const osc = audio.createOscillator();
  const gain = audio.createGain();
  osc.type = tone.type ?? 'square';
  osc.frequency.setValueAtTime(tone.freq, t0);
  if (tone.slide) {
    osc.frequency.linearRampToValueAtTime(tone.freq + tone.slide, t0 + tone.dur);
  }
  const vol = tone.vol ?? 0.06;
  gain.gain.setValueAtTime(0, t0);
  gain.gain.linearRampToValueAtTime(vol, t0 + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, t0 + tone.dur);
  osc.connect(gain);
  gain.connect(audio.destination);
  osc.start(t0);
  osc.stop(t0 + tone.dur + 0.02);
}

export function playMoveSfx() {
  playTone({ freq: 420, dur: 0.05, type: 'square', vol: 0.035 });
}

export function playCorrectSfx() {
  playTone({ freq: 523, dur: 0.08, type: 'square', vol: 0.055 });
  playTone({ freq: 784, dur: 0.12, type: 'square', vol: 0.05 }, 0.07);
  playTone({ freq: 1046, dur: 0.14, type: 'square', vol: 0.04 }, 0.14);
}

export function playWrongSfx() {
  playTone({ freq: 180, dur: 0.18, type: 'sawtooth', vol: 0.07, slide: -60 });
  playTone({ freq: 120, dur: 0.22, type: 'square', vol: 0.05 }, 0.08);
}

export function playDropSfx() {
  playTone({ freq: 260, dur: 0.06, type: 'triangle', vol: 0.04, slide: -80 });
}

export function playGameOverSfx() {
  playTone({ freq: 392, dur: 0.12, type: 'square', vol: 0.06, slide: -40 });
  playTone({ freq: 294, dur: 0.14, type: 'square', vol: 0.055, slide: -40 }, 0.12);
  playTone({ freq: 196, dur: 0.28, type: 'sawtooth', vol: 0.06, slide: -50 }, 0.26);
}

export function playStartSfx() {
  playTone({ freq: 440, dur: 0.08, type: 'square', vol: 0.05 });
  playTone({ freq: 554, dur: 0.08, type: 'square', vol: 0.05 }, 0.08);
  playTone({ freq: 659, dur: 0.14, type: 'square', vol: 0.055 }, 0.16);
}
