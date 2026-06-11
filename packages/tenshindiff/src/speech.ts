import { parseRubyUnits } from './ruby';
import type { DiffUnitOp, RubyUnit } from './types';

export type SpeechTextMode = 'kanji' | 'kana';

function speechTextFromRubyUnits(units: RubyUnit[], mode: SpeechTextMode): string {
  let out = '';
  for (const unit of units) {
    if (mode === 'kanji') {
      out += unit.surface;
      continue;
    }
    out += unit.kind === 'ruby' ? (unit.reading || unit.surface) : unit.surface;
  }
  return out;
}

/** Plain speech string from bracket-ruby notation (same rules as diff-based speech). */
export function speechTextFromRubyNotation(text: string, mode: SpeechTextMode): string {
  return speechTextFromRubyUnits(parseRubyUnits(text), mode);
}

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
