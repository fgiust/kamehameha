import { diffSentenceAnswer } from './diff';
import { applyTemplateDiffOptions, type DiffOptions, DEFAULT_DIFF_OPTIONS } from './options';
import { parseAnswerTemplate } from './template';
import { greedyConsumeRubyPrefix, stripRuby } from './ruby';
import type { DiffUnitOp } from './types';

function diffPartialUserConsumed(rest: string, segment: string): number {
  const ops = diffSentenceAnswer(rest, segment);
  let consumed = 0;

  for (const op of ops) {
    if (op.kind === 'unit' && op.status === 'missing') break;
    if (op.kind === 'unit' && op.status === 'correct_kanji') consumed += op.unit.surface.length;
    else if (op.kind === 'unit' && op.status === 'correct_kana') consumed += op.unit.reading.length;
    else if (op.kind === 'extra') consumed += op.text.length;
  }

  return consumed;
}

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
  const greedy = greedyConsumeRubyPrefix(rest, segment);
  const segmentLen = stripRuby(segment).length;

  if (greedy === segmentLen) {
    return { exact: true, matched: greedy };
  }

  // Segment choice uses greedy alignment only (ignore diff "extras" before missing).
  return { exact: false, matched: greedy };
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

  // Optional empty alt: no alignment at cursor → prefer "" over first non-empty option.
  const hasEmpty = alternatives.some(alt => alt === '');
  if (hasEmpty) return '';

  return alternatives[0]!;
}

/** User input chars consumed when diffing one segment from cursor. */
export function userCharsConsumedForSegment(user: string, cursor: number, segment: string): number {
  if (segment === '') return 0;

  const rest = user.slice(cursor);
  const greedy = greedyConsumeRubyPrefix(rest, segment);
  if (greedy === stripRuby(segment).length) return greedy;

  return diffPartialUserConsumed(rest, segment);
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
