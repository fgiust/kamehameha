import { isDebugModeEnabled } from './debugMode';
import { pickBestSpeechVoice } from './speechVoicePick';

const SPEECH_RATE = 0.9;
const SPEAK_START_TIMEOUT_MS = 300;
const SPEECH_LOG_PREFIX = '[kamehameha speech]';

type SpeakFailureReason =
  | 'unavailable'
  | 'utterance_error'
  | 'timeout'
  | 'ended_without_start'
  | 'canceled'
  | 'superseded';

type SpeakAttemptResult =
  | { ok: true }
  | { ok: false; reason: SpeakFailureReason; error?: string; voice?: string | null };

function isSilentFailure(reason: SpeakFailureReason): boolean {
  return reason === 'canceled' || reason === 'superseded';
}

function shouldLogSpeechFailures(): boolean {
  return import.meta.env.DEV || isDebugModeEnabled();
}

function previewSpeechText(text: string): string {
  if (text.length <= 80) return text;
  return `${text.slice(0, 80)}…`;
}

function logSpeakFailure(
  reason: SpeakFailureReason,
  details: {
    text: string;
    lang: string;
    generation: number;
    voice?: string | null;
    error?: string;
    speaking?: boolean;
    pending?: boolean;
    note?: string;
  },
): void {
  if (!shouldLogSpeechFailures()) return;
  console.warn(SPEECH_LOG_PREFIX, reason, {
    lang: details.lang,
    generation: details.generation,
    voice: details.voice ?? null,
    error: details.error,
    speaking: details.speaking,
    pending: details.pending,
    note: details.note,
    text: previewSpeechText(details.text),
    state: getSpeechSynthesisDebugState(),
  });
}

function isBenignUtteranceError(error: string): boolean {
  return error === 'canceled' || error === 'interrupted';
}

function pickFailureResult(
  first: SpeakAttemptResult,
  second?: SpeakAttemptResult,
): Extract<SpeakAttemptResult, { ok: false }> | null {
  for (const result of [first, second]) {
    if (!result || result.ok || isSilentFailure(result.reason)) continue;
    return result;
  }
  return null;
}

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

/** Reset Chrome's speech queue when it reports speaking without playing audio. */
export function recoverStuckSpeechSynthesis(synth: SpeechSynthesis = getSpeechSynthesis()!): void {
  if (!synth) return;
  try {
    synth.cancel();
    synth.pause();
    synth.resume();
  } catch {
    return;
  }
}

function prepareSpeechSynthesis(synth: SpeechSynthesis): void {
  if (synth.speaking || synth.pending) {
    recoverStuckSpeechSynthesis(synth);
    return;
  }
  try {
    if (synth.paused) synth.resume();
    synth.resume();
  } catch {
    return;
  }
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

function runSpeak(text: string, lang: string, generation: number): Promise<SpeakAttemptResult> {
  return new Promise(resolve => {
    const synth = getSpeechSynthesis();
    if (!synth) {
      resolve({ ok: false, reason: 'unavailable' });
      return;
    }
    if (generation !== speakGeneration) {
      resolve({ ok: false, reason: 'superseded' });
      return;
    }

    prepareSpeechSynthesis(synth);
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = SPEECH_RATE;
    const voice = pickVoice(lang);
    if (voice) utterance.voice = voice;
    const voiceName = voice?.name ?? null;

    let resolved = false;
    let didStart = false;
    let failure: SpeakAttemptResult = { ok: false, reason: 'timeout', voice: voiceName };

    const finish = (result: SpeakAttemptResult) => {
      if (resolved) return;
      resolved = true;
      resolve(result);
    };

    utterance.onstart = () => {
      didStart = true;
      finish({ ok: true });
    };
    utterance.onerror = (event) => {
      if (generation !== speakGeneration) return;
      const error = event.error || 'unknown';
      if (isBenignUtteranceError(error)) {
        finish({ ok: false, reason: 'canceled' });
        return;
      }
      failure = { ok: false, reason: 'utterance_error', error, voice: voiceName };
      finish(failure);
    };
    utterance.onend = () => {
      if (didStart || generation !== speakGeneration) return;
      failure = { ok: false, reason: 'ended_without_start', voice: voiceName };
      finish(failure);
    };

    synth.speak(utterance);

    window.setTimeout(() => {
      if (resolved || didStart || generation !== speakGeneration) return;
      if (synth.speaking || synth.pending) {
        recoverStuckSpeechSynthesis(synth);
      }
      failure = {
        ok: false,
        reason: 'timeout',
        voice: voiceName,
      };
      finish(failure);
    }, SPEAK_START_TIMEOUT_MS);
  });
}

async function speakOnce(text: string, lang: string, generation: number): Promise<SpeakAttemptResult> {
  await waitForVoices();
  if (generation !== speakGeneration) return { ok: false, reason: 'superseded' };
  return runSpeak(text, lang, generation);
}

function logFailedSpeakAttempt(
  result: SpeakAttemptResult,
  details: { text: string; lang: string; generation: number; note: string },
): void {
  if (result.ok || isSilentFailure(result.reason)) return;
  const synth = getSpeechSynthesis();
  logSpeakFailure(result.reason, {
    text: details.text,
    lang: details.lang,
    generation: details.generation,
    voice: result.voice,
    error: result.error,
    speaking: synth?.speaking,
    pending: synth?.pending,
    note: details.note,
  });
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
    void speakOnce(text, lang, generation).then(result => {
      if (result.ok) {
        onComplete?.();
        return;
      }
      logFailedSpeakAttempt(result, {
        text,
        lang,
        generation,
        note: 'gesture retry failed',
      });
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

export function getSpeechSynthesisDebugState() {
  const synth = getSpeechSynthesis();
  if (!synth) return { available: false as const };
  return {
    available: true as const,
    speaking: synth.speaking,
    pending: synth.pending,
    paused: synth.paused,
    voiceCount: synth.getVoices().length,
    speakGeneration,
    gestureArmed: gestureCleanup !== null,
  };
}

export function cancelSpeech(): void {
  speakGeneration += 1;
  clearGestureFallback();
  const synth = getSpeechSynthesis();
  if (!synth) return;
  recoverStuckSpeechSynthesis(synth);
}

export function speakText(text: string, lang: string): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (!getSpeechSynthesis()) {
    logSpeakFailure('unavailable', { text: trimmed, lang, generation: speakGeneration });
    return;
  }

  clearGestureFallback();
  const generation = ++speakGeneration;
  void (async () => {
    const first = await speakOnce(trimmed, lang, generation);
    if (first.ok) return;
    if (generation !== speakGeneration) return;

    recoverStuckSpeechSynthesis();
    const second = await speakOnce(trimmed, lang, generation);
    if (second.ok) return;
    if (generation !== speakGeneration) return;

    const failure = pickFailureResult(first, second);
    if (failure) {
      logFailedSpeakAttempt(failure, {
        text: trimmed,
        lang,
        generation,
        note: 'speak failed after retry',
      });
    }
  })();
}

/** Try once (with one delayed retry); if blocked, speak on first user pointer/key. */
export function speakTextWithGestureFallback(
  text: string,
  lang: string,
  onComplete?: () => void,
): void {
  const trimmed = text.trim();
  if (!trimmed) return;
  if (!getSpeechSynthesis()) {
    logSpeakFailure('unavailable', { text: trimmed, lang, generation: speakGeneration });
    return;
  }

  clearGestureFallback();
  const generation = ++speakGeneration;

  void (async () => {
    const first = await speakOnce(trimmed, lang, generation);
    if (first.ok) {
      onComplete?.();
      return;
    }
    if (generation !== speakGeneration) return;

    await new Promise<void>(resolve => window.setTimeout(resolve, 120));
    if (generation !== speakGeneration) return;

    recoverStuckSpeechSynthesis();
    const second = await speakOnce(trimmed, lang, generation);
    if (second.ok) {
      onComplete?.();
      return;
    }
    if (generation !== speakGeneration) return;

    armGestureFallback(trimmed, lang, generation, onComplete);
  })();
}

if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as unknown as { __nihongoSpeech?: Record<string, unknown> }).__nihongoSpeech = {
    getSpeechSynthesisDebugState,
    recoverStuckSpeechSynthesis,
    speakText,
  };
}
