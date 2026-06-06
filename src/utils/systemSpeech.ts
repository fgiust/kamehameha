import { pickBestSpeechVoice } from './speechVoicePick';

const SPEECH_RATE = 0.9;

let speakGeneration = 0;
let gestureCleanup: (() => void) | null = null;

function getSpeechSynthesis(): SpeechSynthesis | null {
  if (typeof window === 'undefined') return null;
  if (!('speechSynthesis' in window)) return null;
  return window.speechSynthesis;
}

if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  window.speechSynthesis.getVoices();
}

function pickVoice(lang: string): SpeechSynthesisVoice | null {
  const synth = getSpeechSynthesis();
  if (!synth) return null;

  const voices = synth.getVoices();
  if (voices.length === 0) return null;

  return pickBestSpeechVoice(voices, lang) as SpeechSynthesisVoice | null;
}

function clearGestureFallback(): void {
  gestureCleanup?.();
  gestureCleanup = null;
}

function waitForVoices(timeoutMs = 1500): Promise<void> {
  const synth = getSpeechSynthesis();
  if (!synth) return Promise.resolve();

  synth.getVoices();
  if (synth.getVoices().length > 0) return Promise.resolve();

  return new Promise(resolve => {
    const finish = () => {
      synth.removeEventListener('voiceschanged', onVoices);
      window.clearTimeout(timer);
      resolve();
    };
    const onVoices = () => {
      if (synth.getVoices().length > 0) finish();
    };
    const timer = window.setTimeout(finish, timeoutMs);
    synth.addEventListener('voiceschanged', onVoices);
  });
}

function runSpeak(text: string, lang: string, generation: number): Promise<boolean> {
  return new Promise(resolve => {
    const synth = getSpeechSynthesis();
    if (!synth || generation !== speakGeneration) {
      resolve(false);
      return;
    }

    synth.resume();
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = SPEECH_RATE;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;

    let resolved = false;
    const done = (ok: boolean) => {
      if (resolved) return;
      resolved = true;
      resolve(ok);
    };

    utterance.onstart = () => done(true);
    utterance.onerror = () => done(false);
    synth.speak(utterance);

    window.setTimeout(() => {
      if (resolved) return;
      done(synth.speaking || synth.pending);
    }, 200);
  });
}

async function speakOnce(text: string, lang: string, generation: number): Promise<boolean> {
  await waitForVoices();
  if (generation !== speakGeneration) return false;
  return runSpeak(text, lang, generation);
}

function armGestureFallback(
  text: string,
  lang: string,
  generation: number,
  onComplete?: () => void,
): void {
  clearGestureFallback();

  const flush = () => {
    clearGestureFallback();
    if (generation !== speakGeneration) return;
    void speakOnce(text, lang, generation).then(ok => {
      if (ok) onComplete?.();
    });
  };

  const onPointer = () => flush();
  const onKey = () => flush();
  document.addEventListener('pointerdown', onPointer, { capture: true });
  document.addEventListener('keydown', onKey, { capture: true });
  gestureCleanup = () => {
    document.removeEventListener('pointerdown', onPointer, { capture: true });
    document.removeEventListener('keydown', onKey, { capture: true });
  };
}

export function cancelSpeech(): void {
  speakGeneration += 1;
  clearGestureFallback();
  getSpeechSynthesis()?.cancel();
}

export function speakText(text: string, lang: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (!getSpeechSynthesis()) return;

  clearGestureFallback();
  const generation = ++speakGeneration;
  void speakOnce(trimmed, lang, generation);
}

/** Try once (with one delayed retry); if blocked, speak on first user pointer/key. */
export function speakTextWithGestureFallback(
  text: string,
  lang: string,
  onComplete?: () => void,
): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (!getSpeechSynthesis()) return;

  clearGestureFallback();
  const generation = ++speakGeneration;

  void (async () => {
    if (await speakOnce(trimmed, lang, generation)) {
      onComplete?.();
      return;
    }
    if (generation !== speakGeneration) return;

    await new Promise<void>(resolve => window.setTimeout(resolve, 120));
    if (generation !== speakGeneration) return;

    if (await speakOnce(trimmed, lang, generation)) {
      onComplete?.();
      return;
    }
    if (generation !== speakGeneration) return;

    armGestureFallback(trimmed, lang, generation, onComplete);
  })();
}
