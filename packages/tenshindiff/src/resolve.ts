import { diffSentenceAnswer } from './diff';
import { applyTemplateDiffOptions, type DiffOptions, DEFAULT_DIFF_OPTIONS } from './options';
import { parseAnswerTemplate } from './template';
import type { RubyMatchOptions } from './ruby';
import { greedyConsumeRubyPrefix, parseRubyUnits, stripRuby } from './ruby';
import type { DiffUnitOp, RubyUnit } from './types';

function rubyUnitSegment(unit: RubyUnit): string {
  if (unit.kind === 'plain') return unit.surface;
  return `${unit.surface}[${unit.reading}]`;
}

/** User chars consumed for one ruby/plain unit inside a fixed template part. */
function consumeFixedRubyUnit(
  rest: string,
  unit: RubyUnit,
  rubyOptions: RubyMatchOptions,
): number {
  const segment = rubyUnitSegment(unit);
  const greedy = greedyConsumeRubyPrefix(rest, segment, rubyOptions);
  const segmentLen = stripRuby(segment).length;

  if (greedy === segmentLen) return greedy;

  if (unit.kind === 'plain') {
    if (greedy > 0) return diffFixedSegmentUserConsumed(rest, segment, rubyOptions);
    return 0;
  }

  const surface = unit.surface;
  const surfaceLen = surface.length;
  let best = 0;

  for (let len = 1; len <= rest.length; len++) {
    const prefix = rest.slice(0, len);
    const surfaceGreedy = greedyConsumeRubyPrefix(prefix, surface, rubyOptions);
    if (surfaceGreedy === surfaceLen) {
      best = len;
      break;
    }
    if (len > surfaceGreedy + 1) break;
    best = len;
  }

  return best;
}

function remainingUnitsArePlain(units: RubyUnit[], from: number): boolean {
  return units.slice(from).every(u => u.kind === 'plain');
}

function segmentFromUnits(units: RubyUnit[], from: number): string {
  return units.slice(from).map(rubyUnitSegment).join('');
}

/** Walk a fixed template part unit-by-unit so a typo in one ruby word does not swallow the next. */
function consumeFixedPartUserChars(
  user: string,
  cursor: number,
  part: string,
  rubyOptions: RubyMatchOptions,
): number {
  const units = parseRubyUnits(part);
  let consumed = 0;

  for (let i = 0; i < units.length; i++) {
    const unit = units[i]!;
    const rest = user.slice(cursor + consumed);
    let step = 0;

    if (unit.kind === 'plain' && unit.surface.length === 1) {
      step = consumeFixedRubyUnit(rest, unit, rubyOptions);
    } else if (unit.kind === 'plain') {
      step = diffFixedSegmentUserConsumed(rest, rubyUnitSegment(unit), rubyOptions);
    } else {
      step = consumeFixedRubyUnit(rest, unit, rubyOptions);
    }

    if (step === 0 && unit.kind === 'plain' && unit.surface.length === 1) {
      const pos = rest.indexOf(unit.surface);
      if (pos >= 0) step = pos + unit.surface.length;
    }

    if (step === 0) {
      const bulk = diffFixedSegmentUserConsumed(rest, segmentFromUnits(units, i), rubyOptions);
      if (bulk > 0) {
        consumed += bulk;
        break;
      }
    }

    if (step === 0 && remainingUnitsArePlain(units, i)) {
      step = diffFixedSegmentUserConsumed(rest, segmentFromUnits(units, i), rubyOptions);
      consumed += step;
      break;
    }

    consumed += step;
    if (step === 0) break;
  }

  return consumed;
}

/** Chars consumed for a chosen {alt|…} segment (stops at first template-only missing). */
function diffPartialUserConsumed(rest: string, segment: string, rubyOptions: RubyMatchOptions = {}): number {
  const ops = diffSentenceAnswer(rest, segment, rubyOptions);
  let consumed = 0;

  for (const op of ops) {
    if (op.kind === 'unit' && op.status === 'missing') break;
    if (op.kind === 'unit' && op.status === 'correct_kanji') consumed += op.unit.surface.length;
    else if (op.kind === 'unit' && op.status === 'correct_kana') consumed += op.unit.reading.length;
    else if (op.kind === 'extra') consumed += op.text.length;
  }

  return consumed;
}

function remainingTemplateSurfaceLen(ops: DiffUnitOp[], fromIndex: number): number {
  let len = 0;
  for (let j = fromIndex; j < ops.length; j++) {
    const op = ops[j]!;
    if (op.kind === 'unit') len += op.unit.surface.length;
  }
  return len;
}

/**
 * Chars consumed for a fixed template segment: walk all template units (including
 * missing). User "extra" ops before the first template unit, or after the last, do not
 * advance the cursor (those belong to other segments). Sandwiched extras (typos) do,
 * unless they are longer than the template still to come (then the user has moved on).
 */
function diffFixedSegmentUserConsumed(rest: string, segment: string, rubyOptions: RubyMatchOptions = {}): number {
  const ops = diffSentenceAnswer(rest, segment, rubyOptions);
  const unitIndices: number[] = [];
  for (let i = 0; i < ops.length; i++) {
    if (ops[i]!.kind === 'unit') unitIndices.push(i);
  }
  if (unitIndices.length === 0) return 0;

  const firstUnit = unitIndices[0]!;
  const lastUnit = unitIndices[unitIndices.length - 1]!;
  let consumed = 0;

  for (let i = 0; i < ops.length; i++) {
    const op = ops[i]!;
    if (op.kind === 'extra') {
      if (i < firstUnit) {
        const firstOp = ops[firstUnit]!;
        // Short typo before the first template unit (e.g. ま for で, お before は), not leading junk (e.g. カフェ).
        if (firstOp.kind === 'unit' && op.text.length <= 1) {
          consumed += op.text.length;
        }
        continue;
      }
      if (i > lastUnit) break;
      const remaining = remainingTemplateSurfaceLen(ops, i + 1);
      if (op.text.length > remaining) break;
      consumed += op.text.length;
      continue;
    }
    if (op.kind === 'unit' && op.status === 'correct_kanji') consumed += op.unit.surface.length;
    else if (op.kind === 'unit' && op.status === 'correct_kana') consumed += op.unit.reading.length;
  }

  return consumed;
}

type SegmentScore = {
  exact: boolean;
  matched: number;
  coverage: number;
};

/**
 * Matched surface/reading length from diff ops. Leading user extras before the first
 * correct unit score 0 (avoids spurious hits like は inside ごはん when the user typed カフェ).
 * Trailing extras after a partial hit are ignored.
 */
function segmentAlignmentScore(rest: string, segment: string, rubyOptions: RubyMatchOptions = {}): number {
  const ops = diffSentenceAnswer(rest, segment, rubyOptions);
  let matched = 0;
  let seenCorrect = false;

  for (const op of ops) {
    if (op.kind === 'extra') {
      if (!seenCorrect) return 0;
      continue;
    }
    if (op.kind === 'unit' && op.status === 'missing') {
      if (seenCorrect) break;
      continue;
    }
    if (op.kind === 'unit' && (op.status === 'correct_kanji' || op.status === 'correct_kana')) {
      seenCorrect = true;
      matched +=
        op.status === 'correct_kanji' ? op.unit.surface.length : op.unit.reading.length;
    }
  }

  return matched;
}

/** Prefix alignment score for one template segment against user input at cursor. */
export function scoreSegmentAt(
  user: string,
  cursor: number,
  segment: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): SegmentScore {
  if (segment === '') {
    return { exact: false, matched: 0, coverage: 0 };
  }

  const rubyOpts = { allowNumericalAlternatives: options.allowNumericalAlternatives };
  const rest = user.slice(cursor);
  const greedy = greedyConsumeRubyPrefix(rest, segment, rubyOpts);
  const segmentLen = stripRuby(segment).length;

  if (greedy === segmentLen) {
    return { exact: true, matched: greedy, coverage: 1 };
  }

  // Diff alignment (e.g. user するの vs template をするの: を missing, 3 chars still match).
  const aligned = segmentAlignmentScore(rest, segment, rubyOpts);
  const matched = Math.max(greedy, aligned);
  return { exact: false, matched, coverage: segmentLen > 0 ? matched / segmentLen : 0 };
}

/** Pick one alternative from a {a|b} group (first configured wins ties). */
export function pickSegmentAlternative(
  user: string,
  cursor: number,
  alternatives: string[],
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): string {
  if (alternatives.length === 0) return '';
  if (alternatives.length === 1) return alternatives[0]!;

  const scored = alternatives.map((alt, index) => ({
    alt,
    index,
    ...scoreSegmentAt(user, cursor, alt, options),
  }));

  const exact = scored.filter(s => s.exact);
  if (exact.length > 0) {
    const rest = user.slice(cursor);
    const literal = exact.find(s => rest.startsWith(stripRuby(s.alt)));
    if (literal) return literal.alt;
    return exact.reduce((best, s) => (s.index < best.index ? s : best)).alt;
  }

  const maxMatched = scored.reduce((max, s) => Math.max(max, s.matched), 0);
  if (maxMatched > 0) {
    const tied = scored.filter(s => s.matched === maxMatched);
    const maxCoverage = tied.reduce((max, s) => Math.max(max, s.coverage), 0);
    const covered = tied.filter(s => s.coverage === maxCoverage);
    const rest = user.slice(cursor);
    const literal = covered.find(s => rest.startsWith(stripRuby(s.alt)));
    if (literal) return literal.alt;
    return covered.reduce((best, s) => (s.index < best.index ? s : best)).alt;
  }

  // Optional empty alt: prefer "" unless the user literally typed a non-empty option (e.g. optional 、).
  const hasEmpty = alternatives.some(alt => alt === '');
  if (hasEmpty) {
    const rest = user.slice(cursor);
    const literalNonEmpty = alternatives.find(alt => alt !== '' && rest.startsWith(stripRuby(alt)));
    if (literalNonEmpty) return literalNonEmpty;
    return '';
  }

  return alternatives[0]!;
}

/** User input chars consumed when diffing one segment from cursor. */
export function userCharsConsumedForSegment(
  user: string,
  cursor: number,
  segment: string,
  options: { fixed?: boolean; diff?: DiffOptions } = {},
): number {
  if (segment === '') return 0;

  const rubyOpts = { allowNumericalAlternatives: options.diff?.allowNumericalAlternatives };
  const rest = user.slice(cursor);
  const greedy = greedyConsumeRubyPrefix(rest, segment, rubyOpts);
  const segmentLen = stripRuby(segment).length;

  if (greedy === segmentLen) return greedy;

  if (options.fixed) {
    const byUnit = consumeFixedPartUserChars(user, cursor, segment, rubyOpts);
    // No shared prefix (e.g. fixed 時々 while user typed カフェ…): do not skip ahead.
    if (greedy === 0) return byUnit;
    return byUnit;
  }

  // Chosen {alt}: partial kanji (e.g. 三分 vs 三十分) must not swallow the next word (ぐらい).
  if (greedy < segmentLen) {
    const byUnit = consumeFixedPartUserChars(user, cursor, segment, rubyOpts);
    if (byUnit > 0) return byUnit;
  }

  if (greedy === 0) return 0;
  return diffPartialUserConsumed(rest, segment, rubyOpts);
}

/** Resolve a template into the best concrete answer for diff display. */
export function resolveAnswerFromParts(
  user: string,
  parts: (string | string[])[],
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): string {
  let cursor = 0;
  const resolved: string[] = [];

  for (const part of parts) {
    if (typeof part === 'string') {
      resolved.push(part);
      cursor += userCharsConsumedForSegment(user, cursor, part, { fixed: true, diff: options });
      continue;
    }

    const chosen = pickSegmentAlternative(user, cursor, part, options);
    resolved.push(chosen);
    cursor += userCharsConsumedForSegment(user, cursor, chosen, { fixed: false, diff: options });
  }

  return resolved.join('');
}

export function resolveAnswerFromTemplate(
  user: string,
  template: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): string {
  const prepared = applyTemplateDiffOptions(template, options);
  return resolveAnswerFromParts(user, parseAnswerTemplate(prepared), options);
}

export function pickBestDiffFromTemplate(
  user: string,
  template: string,
  options: DiffOptions = DEFAULT_DIFF_OPTIONS,
): { bestAnswer: string; ops: DiffUnitOp[] } {
  const bestAnswer = resolveAnswerFromTemplate(user, template, options);
  return {
    bestAnswer,
    ops: diffSentenceAnswer(user, bestAnswer, {
      allowNumericalAlternatives: options.allowNumericalAlternatives,
    }),
  };
}
