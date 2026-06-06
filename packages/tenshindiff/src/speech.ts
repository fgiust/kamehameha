import type { DiffUnitOp } from './types';

export type SpeechTextMode = 'kanji' | 'kana';

/** Plain speech string from diff ops: all unit ops (green/yellow/white), no extra (red). */
export function speechTextFromDiffOps(ops: DiffUnitOp[], mode: SpeechTextMode): string {
  let out = '';
  for (const op of ops) {
    if (op.kind === 'extra') continue;
    const { unit } = op;
    if (mode === 'kanji') {
      out += unit.surface;
      continue;
    }
    out += unit.kind === 'ruby' ? (unit.reading || unit.surface) : unit.surface;
  }
  return out;
}
