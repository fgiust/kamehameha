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

export class ReadingExercisePicker {
  private remainingIdx: number[] = [];
  private lastIdx: number | null = null;
  private phase: 0 | 2 | null = null;

  reset() {
    this.remainingIdx = [];
    this.lastIdx = null;
    this.phase = null;
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
