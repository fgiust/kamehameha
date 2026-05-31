import { diffSentenceAnswer } from './diff';
import { applyTemplateDiffOptions, type DiffOptions, DEFAULT_DIFF_OPTIONS } from './options';
import { parseAnswerTemplate } from './template';
import { stripRuby } from './ruby';
import type { DiffUnitOp } from './types';

type SegmentScore = {
  exact: boolean;
  matched: number;
};

/** Prefix alignment score for one template segment against user input at cursor. */
export function scoreSegmentAt(user: string, cursor: number, segment: string): SegmentScore {
  if (segment === '') {
    return { exact: false, matched: 0 };
  }

  const rest = user.slice(cursor);
  const ops = diffSentenceAnswer(rest, segment);
  const hasExtra = ops.some(op => op.kind === 'extra');
  const hasMissing = ops.some(op => op.kind === 'unit' && op.status === 'missing');

  if (!hasExtra && !hasMissing) {
    return { exact: true, matched: stripRuby(segment).length };
  }

  let matched = 0;
  for (const op of ops) {
    if (op.kind === 'extra') break;
    if (op.kind === 'unit') {
      if (op.status === 'correct_kanji' || op.status === 'correct_kana') {
        matched += op.unit.surface.length;
      } else {
        break;
      }
    }
  }

  return { exact: false, matched };
}

/** Pick one alternative from a {a|b} group (first configured wins ties). */
export function pickSegmentAlternative(user: string, cursor: number, alternatives: string[]): string {
  if (alternatives.length === 0) return '';
  if (alternatives.length === 1) return alternatives[0]!;

  const scored = alternatives.map((alt, index) => ({
    alt,
    index,
    ...scoreSegmentAt(user, cursor, alt),
  }));

  const exact = scored.filter(s => s.exact);
  if (exact.length > 0) {
    return exact.reduce((best, s) => (s.index < best.index ? s : best)).alt;
  }

  const maxMatched = scored.reduce((max, s) => Math.max(max, s.matched), 0);
  if (maxMatched > 0) {
    const tied = scored.filter(s => s.matched === maxMatched);
    return tied.reduce((best, s) => (s.index < best.index ? s : best)).alt;
  }

  return alternatives[0]!;
}

/** User input chars consumed when diffing one segment from cursor. */
export function userCharsConsumedForSegment(user: string, cursor: number, segment: string): number {
  if (segment === '') return 0;

  const ops = diffSentenceAnswer(user.slice(cursor), segment);
  let lastUnitIndex = -1;
  for (let i = 0; i < ops.length; i++) {
    if (ops[i]!.kind === 'unit') lastUnitIndex = i;
  }

  let consumed = 0;
  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    if (op.kind === 'extra') {
      // Trailing extras after the last expected unit belong to the next template segment.
      if (i > lastUnitIndex) continue;
      consumed += op.text.length;
    } else if (op.kind === 'unit') {
      if (op.status === 'correct_kanji') consumed += op.unit.surface.length;
      else if (op.status === 'correct_kana') consumed += op.unit.reading.length;
    }
  }

  return consumed;
}

/** Resolve a template into the best concrete answer for diff display. */
export function resolveAnswerFromParts(user: string, parts: (string | string[])[]): string {
  let cursor = 0;
  const resolved: string[] = [];

  for (const part of parts) {
    if (typeof part === 'string') {
      resolved.push(part);
      cursor += userCharsConsumedForSegment(user, cursor, part);
      continue;
    }

    const chosen = pickSegmentAlternative(user, cursor, part);
    resolved.push(chosen);
    cursor += userCharsConsumedForSegment(user, cursor, chosen);
  }

  return resolved.join('');
}

export function resolveAnswerFromTemplate(
  user: string,
  template: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): string {
  const prepared = applyTemplateDiffOptions(template, options);
  return resolveAnswerFromParts(user, parseAnswerTemplate(prepared));
}

export function pickBestDiffFromTemplate(
  user: string,
  template: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): { bestAnswer: string; ops: DiffUnitOp[] } {
  const bestAnswer = resolveAnswerFromTemplate(user, template, options);
  return { bestAnswer, ops: diffSentenceAnswer(user, bestAnswer) };
}
