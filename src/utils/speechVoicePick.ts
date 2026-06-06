/** Minimal voice shape for ranking (matches SpeechSynthesisVoice fields we use). */
export type SpeechVoiceLike = {
  name: string;
  lang: string;
  localService?: boolean;
  default?: boolean;
};

/** macOS novelty / compact voices — poor quality for natural reading. */
const BLOCKED_NAME_RE =
  /\b(compact|eloquence|bad news|bubbles|cellos|deranged|good news|hysterical|junior|kathy|pipe organ|princess|ralph|trinoids|whisper|wobble|zarvox|flo|grandma|superstar|boing|bells)\b/i;

const PREFERRED_BY_PREFIX: Record<string, readonly string[]> = {
  en: ['Samantha', 'Alex', 'Daniel', 'Karen', 'Moira', 'Tessa', 'Microsoft Zira', 'Microsoft David'],
  it: ['Alice', 'Luca', 'Silvia'],
  ja: ['Kyoko', 'Otoya', 'Hattori'],
};

function scoreVoice(voice: SpeechVoiceLike, langPrefix: string): number {
  if (BLOCKED_NAME_RE.test(voice.name)) return -1000;

  let score = 0;
  if (voice.localService) score += 50;
  if (voice.default) score += 25;

  const preferred = PREFERRED_BY_PREFIX[langPrefix] ?? [];
  for (let i = 0; i < preferred.length; i++) {
    if (voice.name.includes(preferred[i]!)) {
      score += 120 - i;
      break;
    }
  }

  if (/^Google /i.test(voice.name) && voice.localService === false) score -= 30;

  return score;
}

/** Pick the best available voice for a BCP-47 lang tag (e.g. en-US, it-IT). */
export function pickBestSpeechVoice(voices: SpeechVoiceLike[], lang: string): SpeechVoiceLike | null {
  if (voices.length === 0) return null;

  const langLower = lang.toLowerCase();
  const prefix = langLower.split('-')[0] ?? langLower;

  let candidates = voices.filter(v => v.lang.toLowerCase() === langLower);
  if (candidates.length === 0) {
    candidates = voices.filter(v => v.lang.toLowerCase().startsWith(prefix));
  }
  if (candidates.length === 0) return voices[0] ?? null;

  const ranked = candidates
    .map(v => ({ v, score: scoreVoice(v, prefix) }))
    .filter(entry => entry.score > -1000)
    .sort((a, b) => b.score - a.score);

  return ranked[0]?.v ?? candidates[0] ?? null;
}
