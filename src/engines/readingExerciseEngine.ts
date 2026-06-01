import { toHiragana } from 'wanakana';
import type { ProgressSegmentState } from '../hooks/useSessionProgress';

export function toHiraganaIME(raw: string) {
  const trailingSingleN = /([^n])n$/i.test(raw) || /^n$/i.test(raw);
  let s = raw.replace(/nn(?=[aiueoy])/gi, "n'n");
  if (/nn$/i.test(s)) s = s.slice(0, -1);
  const out = toHiragana(s);
  if (trailingSingleN && out.endsWith('ん')) return out.slice(0, -1) + 'n';
  return out;
}

export function finalizeIME(input: string) {
  if (input.endsWith('n')) return input.slice(0, -1) + 'ん';
  return input;
}

export function didConvertFromLatin(raw: string) {
  return /[A-Za-z]/.test(raw);
}

function hasJapaneseChars(text: string) {
  return /[\u3040-\u30ff\u3400-\u9fff]/.test(text);
}

function hasLatinLetters(text: string) {
  return /[A-Za-z]/.test(text);
}

function isLatinImeChar(ch: string) {
  return /[A-Za-z'-]/.test(ch);
}

export type JapaneseImeInputResult = {
  value: string;
  caret: number | null;
  didConvert: boolean;
};

/** Romaji→hiragana only on the edited latin segment; leaves katakana/kanji unchanged. */
export function applyJapaneseImeInputChange(
  prev: string,
  raw: string,
  caret: number | null,
): JapaneseImeInputResult {
  let prefixLen = 0;
  const minLen = Math.min(prev.length, raw.length);
  while (prefixLen < minLen && prev[prefixLen] === raw[prefixLen]) prefixLen++;

  let suffixLen = 0;
  while (
    suffixLen < prev.length - prefixLen &&
    suffixLen < raw.length - prefixLen &&
    prev[prev.length - 1 - suffixLen] === raw[raw.length - 1 - suffixLen]
  ) {
    suffixLen++;
  }

  let convertStart = prefixLen;
  while (
    convertStart > 0 &&
    isLatinImeChar(raw[convertStart - 1] ?? '') &&
    !hasJapaneseChars(raw[convertStart - 1] ?? '')
  ) {
    convertStart--;
  }

  const convertEnd = raw.length - suffixLen;
  const segment = raw.slice(convertStart, convertEnd);

  if (hasLatinLetters(segment) && !hasJapaneseChars(segment)) {
    const convertedSegment = toHiraganaIME(segment);
    const value = raw.slice(0, convertStart) + convertedSegment + raw.slice(convertEnd);
    let newCaret = caret;
    if (caret !== null) {
      const caretSegment = raw.slice(convertStart, caret);
      newCaret = convertStart + toHiraganaIME(caretSegment).length;
    }
    return { value, caret: newCaret, didConvert: true };
  }

  return { value: raw, caret, didConvert: false };
}

export class ReadingExercisePicker {
  private remainingIdx: number[] = [];
  private lastIdx: number | null = null;
  private phase: 0 | 2 | null = null;

  reset() {
    this.remainingIdx = [];
    this.lastIdx = null;
    this.phase = null;
  }

  restore(state: { remainingIdx: number[]; phase: 0 | 2 | null; lastIdx: number | null }) {
    this.remainingIdx = [...state.remainingIdx];
    this.phase = state.phase;
    this.lastIdx = state.lastIdx;
  }

  getState() {
    return {
      remainingIdx: [...this.remainingIdx],
      phase: this.phase,
      lastIdx: this.lastIdx,
    };
  }

  pickNextIndex(totalItems: number, getProgressState: (key: string) => ProgressSegmentState): number | null {
    const max = Math.max(0, Math.floor(totalItems));
    if (max === 0) return null;

    const unanswered: number[] = [];
    const incorrect: number[] = [];
    for (let i = 0; i < max; i++) {
      const s = getProgressState(String(i));
      if (s === 0) unanswered.push(i);
      else if (s === 2) incorrect.push(i);
    }

    const nextPhase: 0 | 2 | null = unanswered.length > 0 ? 0 : (incorrect.length > 0 ? 2 : null);
    if (nextPhase === null) return null;

    if (this.phase !== nextPhase || this.remainingIdx.length === 0) {
      this.remainingIdx = (nextPhase === 0 ? unanswered : incorrect).slice();
      this.phase = nextPhase;
    }

    const pool = this.remainingIdx;
    let pickIndex = Math.floor(Math.random() * pool.length);
    const last = this.lastIdx;
    if (last !== null && pool.length > 1 && pool[pickIndex] === last) {
      pickIndex = (pickIndex + 1) % pool.length;
    }

    const nextIdx = pool.splice(pickIndex, 1)[0]!;
    this.lastIdx = nextIdx;
    return nextIdx;
  }
}
