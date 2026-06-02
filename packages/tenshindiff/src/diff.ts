import { matchingUserPrefixLength } from './numerals';
import { matchesByRubyUnits, parseRubyUnits, stripRuby, type RubyMatchOptions } from './ruby';
import type { DiffUnitOp } from './types';

export function diffSentenceAnswer(
  user: string,
  answerWithRuby: string,
  options: RubyMatchOptions = {},
): DiffUnitOp[] {
  const allowNumbers = options.allowNumericalAlternatives === true;
  const units = parseRubyUnits(answerWithRuby);

  const memo = new Map<string, { cost: number; ops: DiffUnitOp[] }>();

  function dfs(u: number, c: number): { cost: number; ops: DiffUnitOp[] } {
    if (u === units.length && c === user.length) return { cost: 0, ops: [] };
    const key = `${u},${c}`;
    if (memo.has(key)) return memo.get(key)!;

    let bestCost = Infinity;
    let bestOps: DiffUnitOp[] = [];

    if (c < user.length) {
      const res = dfs(u, c + 1);
      const cost = res.cost + 1;
      if (cost < bestCost) {
        bestCost = cost;
        if (res.ops.length > 0 && res.ops[0]!.kind === 'extra') {
          bestOps = [{ kind: 'extra', text: user[c]! + res.ops[0]!.text }, ...res.ops.slice(1)];
        } else {
          bestOps = [{ kind: 'extra', text: user[c]! }, ...res.ops];
        }
      }
    }

    if (u < units.length) {
      const unit = units[u]!;

      if (unit.surface) {
        const surfLen = matchingUserPrefixLength(user, c, unit.surface, allowNumbers);
        if (surfLen !== null) {
          const resSurf = dfs(u + 1, c + surfLen);
          const costSurf = resSurf.cost;
          if (costSurf < bestCost) {
            bestCost = costSurf;
            bestOps = [{ kind: 'unit', unit, status: 'correct_kanji' }, ...resSurf.ops];
          }
        }
      }

      if (unit.reading && user.startsWith(unit.reading, c)) {
        const resRead = dfs(u + 1, c + unit.reading.length);
        const costRead = resRead.cost + 0.01;
        if (costRead < bestCost) {
          bestCost = costRead;
          bestOps = [{ kind: 'unit', unit, status: 'correct_kana' }, ...resRead.ops];
        }
      }

      const resMissing = dfs(u + 1, c);
      const costMissing = resMissing.cost + 1;
      if (costMissing < bestCost) {
        bestCost = costMissing;
        bestOps = [{ kind: 'unit', unit, status: 'missing' }, ...resMissing.ops];
      }
    }

    memo.set(key, { cost: bestCost, ops: bestOps });
    return { cost: bestCost, ops: bestOps };
  }

  return dfs(0, 0).ops;
}

/** Sum of matched surface lengths in a diff (higher = better alignment). */
export function countMatchedChars(ops: DiffUnitOp[]): number {
  return ops.reduce((sum, op) => {
    if (op.kind === 'unit' && (op.status === 'correct_kanji' || op.status === 'correct_kana')) {
      return sum + op.unit.surface.length;
    }
    return sum;
  }, 0);
}

function optionalSegmentBetween(longer: string, shorter: string): string | null {
  const p = stripRuby(longer);
  const e = stripRuby(shorter);
  if (p.length <= e.length) return null;

  for (let start = 0; start < p.length; start++) {
    for (let end = start + 1; end <= p.length; end++) {
      if (p.slice(0, start) + p.slice(end) === e) {
        return p.slice(start, end);
      }
    }
  }
  return null;
}

function hasSubstitutiveOptionalFill(user: string, longer: string, shorter: string): boolean {
  const seg = optionalSegmentBetween(longer, shorter);
  if (!seg) return false;
  const segStart = stripRuby(longer).indexOf(seg);
  if (segStart < 0) return false;
  const segEnd = segStart + seg.length;

  const ops = diffSentenceAnswer(user, longer);
  let plainPos = 0;

  for (const op of ops) {
    if (op.kind === 'extra') {
      if (plainPos >= segStart && plainPos < segEnd) return true;
    } else if (op.kind === 'unit') {
      plainPos += op.unit.surface.length;
    }
  }
  return false;
}

function findShorterForSkippedOptional(
  alternatives: string[],
  user: string,
  tied: { answer: string; matched: number }[],
): string | null {
  for (const { answer: longer, matched: longerMatched } of tied) {
    for (const shorter of alternatives) {
      if (longer === shorter) continue;
      const seg = optionalSegmentBetween(longer, shorter);
      if (!seg) continue;
      if (hasSubstitutiveOptionalFill(user, longer, shorter)) continue;
      const shorterEntry = tied.find(t => t.answer === shorter);
      if (!shorterEntry) continue;
      if (shorterEntry.matched >= longerMatched) return shorter;
    }
  }
  return null;
}

function findPrimaryForFilledOptional(alternatives: string[], user: string): string | null {
  let best: string | null = null;
  let bestMatched = -1;
  let bestIndex = Infinity;

  for (const longer of alternatives) {
    const longerIndex = alternatives.indexOf(longer);
    for (const shorter of alternatives) {
      if (longer === shorter) continue;
      if (!optionalSegmentBetween(longer, shorter)) continue;
      if (!hasSubstitutiveOptionalFill(user, longer, shorter)) continue;
      const ops = diffSentenceAnswer(user, longer);
      const matched = countMatchedChars(ops);
      if (matched > bestMatched || (matched === bestMatched && longerIndex < bestIndex)) {
        bestMatched = matched;
        bestIndex = longerIndex;
        best = longer;
      }
    }
  }
  return best;
}

export function pickBestDiff(user: string, parsedAlternatives: string[]): { bestAnswer: string; ops: DiffUnitOp[] } {
  const alternatives = parsedAlternatives.filter(Boolean);
  if (alternatives.length === 0) return { bestAnswer: '', ops: [] };

  const exact = alternatives.find(answer => matchesByRubyUnits(user, answer));
  if (exact) {
    return { bestAnswer: exact, ops: diffSentenceAnswer(user, exact) };
  }

  const forcedPrimary = findPrimaryForFilledOptional(alternatives, user);
  if (forcedPrimary) {
    return { bestAnswer: forcedPrimary, ops: diffSentenceAnswer(user, forcedPrimary) };
  }

  const scored = alternatives.map((answer, index) => {
    const ops = diffSentenceAnswer(user, answer);
    return { answer, ops, matched: countMatchedChars(ops), index };
  });

  const maxMatched = scored.reduce((max, s) => Math.max(max, s.matched), 0);
  if (maxMatched === 0) {
    const answer = alternatives[0]!;
    return { bestAnswer: answer, ops: diffSentenceAnswer(user, answer) };
  }

  const tied = scored.filter(s => s.matched === maxMatched);
  const skippedShorter = findShorterForSkippedOptional(alternatives, user, tied);
  const candidates = skippedShorter ? tied.filter(s => s.answer === skippedShorter) : tied;

  let best = candidates[0]!;
  for (const candidate of candidates.slice(1)) {
    if (candidate.index < best.index) {
      best = candidate;
    }
  }

  return { bestAnswer: best.answer, ops: best.ops };
}
