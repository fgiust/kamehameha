/**
 * Sentence Exercise Engine
 *
 * Handles Genki-style sentence exercises where the user translates
 * English to Japanese. Parts can be strings or arrays of alternatives.
 * Generates all valid combinations and computes diff for feedback.
 */

import { SentenceItem } from '../types';

/** Strip ruby annotations from text: 漢[かん]字[じ] → 漢字 (for display) */
export function stripRuby(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, '');
}

/** Convert ruby bracket notation to plain kana reading */
export function toKana(text: string): string {
  return text
    .replace(/([^[]+)\[([^]]*)\]/g, (_m, surface: string, reading: string) => (reading && reading.length > 0 ? reading : surface))
    .replace(/\[([^]]*)\]/g, '$1');
}

/** Random name list used for #name placeholders */

/** Parse answer template with {option1|option2} syntax into internal array format */
export function parseAnswerTemplate(template: string): (string | string[])[] {
  const parts: (string | string[])[] = [];
  let buffer = '';
  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === '{') {
      if (buffer.length > 0) {
        parts.push(buffer);
        buffer = '';
      }
      const closeIdx = template.indexOf('}', i);
      if (closeIdx === -1) {
        buffer += ch;
      } else {
        const content = template.slice(i + 1, closeIdx);
        parts.push(content.split('|'));
        i = closeIdx;
      }
    } else {
      buffer += ch;
    }
  }
  if (buffer.length > 0) {
    parts.push(buffer);
  }
  return parts;
}

/** First-surface answer from a template (first {a|b} option, ruby readings stripped). */
export function primarySurfaceFromTemplate(template: string): string {
  const answers = generateAnswers(parseAnswerTemplate(template));
  return stripRuby(answers[0] ?? template);
}

/** Generate all valid answer combinations for a sentence */
export function generateAnswers(parts: (string | string[])[]): string[] {
  const resolvedParts = parts.map(p => {
    if (typeof p === 'string') return [p];
    return p;
  });

  // Generate all combinations (cartesian product)
  let combos: string[][] = [[]];
  for (const partAlts of resolvedParts) {
    const newCombos: string[][] = [];
    for (const combo of combos) {
      for (const alt of partAlts) {
        newCombos.push([...combo, alt]);
      }
    }
    combos = newCombos;
  }

  return combos.map(c => c.join(''));
}

/** Get the English prompt with name substituted */
export function getEnglishPrompt(item: SentenceItem): { english: string; name: string } {
  return {
    english: item.english,
    name: '',
  };
}

/** Generate answers with a specific name */
export function generateAnswersWithName(parts: (string | string[])[], name: string): string[] {
  const resolvedParts = parts.map(p => {
    if (typeof p === 'string') return [p.replace('#name', name)];
    return p.map(alt => alt.replace('#name', name));
  });

  let combos: string[][] = [[]];
  for (const partAlts of resolvedParts) {
    const newCombos: string[][] = [];
    for (const combo of combos) {
      for (const alt of partAlts) {
        newCombos.push([...combo, alt]);
      }
    }
    combos = newCombos;
  }

  return combos.map(c => c.join(''));
}

/** Compute character-level diff between user input and closest correct answer */
export function computeDiff(
  userAnswer: string,
  correctAnswers: string[]
): { bestAnswer: string; diff: { char: string; type: 'correct' | 'wrong' | 'missing' }[] } {
  // Find the closest answer by Levenshtein-like scoring
  let bestAnswer = correctAnswers[0];
  let bestScore = Infinity;

  for (const answer of correctAnswers) {
    let score = 0;
    const maxLen = Math.max(userAnswer.length, answer.length);
    for (let i = 0; i < maxLen; i++) {
      if (userAnswer[i] !== answer[i]) score++;
    }
    if (score < bestScore) {
      bestScore = score;
      bestAnswer = answer;
    }
  }

  // Build diff
  const diff: { char: string; type: 'correct' | 'wrong' | 'missing' }[] = [];
  const maxLen = Math.max(userAnswer.length, bestAnswer.length);
  for (let i = 0; i < maxLen; i++) {
    if (i < userAnswer.length && i < bestAnswer.length) {
      if (userAnswer[i] === bestAnswer[i]) {
        diff.push({ char: bestAnswer[i], type: 'correct' });
      } else {
        diff.push({ char: bestAnswer[i], type: 'wrong' });
      }
    } else if (i >= userAnswer.length) {
      diff.push({ char: bestAnswer[i], type: 'missing' });
    }
  }

  return { bestAnswer, diff };
}

/** Check if user's answer matches any valid answer */
export function checkAnswer(userAnswer: string, correctAnswers: string[]): boolean {
  const normalized = userAnswer.trim();
  return correctAnswers.some(a => a === normalized);
}

export type RubyUnit =
  | { kind: 'plain'; surface: string; reading: string }
  | { kind: 'ruby'; surface: string; reading: string };

function splitChars(input: string): string[] {
  return Array.from(input);
}

export function pickBestAnswerForDisplay(answers: string[]): string {
  let best = answers[0] ?? '';
  let bestScore = -1;
  for (const a of answers) {
    const score = (a.match(/\[[^\]]*\]/g) ?? []).length;
    if (score > bestScore) {
      best = a;
      bestScore = score;
    }
  }
  return best;
}

function isKanji(ch: string) {
  return /[\u4e00-\u9faf\u3400-\u4dbf々]/.test(ch);
}

export function parseRubyUnits(text: string): RubyUnit[] {
  const units: RubyUnit[] = [];
  let buffer = '';

  const flushPlainBuffer = () => {
    if (!buffer) return;
    for (const ch of splitChars(buffer)) {
      units.push({ kind: 'plain', surface: ch, reading: ch });
    }
    buffer = '';
  };

  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (ch !== '[') {
      buffer += ch;
      continue;
    }

    const close = text.indexOf(']', i + 1);
    if (close === -1) {
      buffer += ch;
      continue;
    }

    const readingRaw = text.slice(i + 1, close);
    const reading = readingRaw.length > 0 ? readingRaw : buffer;

    // Find the kanji sequence at the end of the buffer
    let kStart = buffer.length;
    while (kStart > 0 && isKanji(buffer[kStart - 1]!)) {
      kStart--;
    }
    
    // If no kanji found, just take the last character as the ruby base
    if (kStart === buffer.length && buffer.length > 0) {
      kStart = buffer.length - 1;
    }

    const plainPart = buffer.slice(0, kStart);
    const rubyBase = buffer.slice(kStart);

    if (plainPart) {
      for (const p of splitChars(plainPart)) {
        units.push({ kind: 'plain', surface: p, reading: p });
      }
    }

    if (rubyBase) {
      units.push({ kind: 'ruby', surface: rubyBase, reading });
    }

    buffer = '';
    i = close;
  }

  flushPlainBuffer();
  return units;
}

export function matchesByRubyUnits(user: string, answerWithRuby: string): boolean {
  const units = parseRubyUnits(answerWithRuby);
  const memo = new Map<string, boolean>();

  const dfs = (unitIndex: number, pos: number): boolean => {
    const key = `${unitIndex}|${pos}`;
    const existing = memo.get(key);
    if (existing !== undefined) return existing;

    if (unitIndex >= units.length) {
      const ok = pos === user.length;
      memo.set(key, ok);
      return ok;
    }

    const unit = units[unitIndex];
    if (unit.kind === 'plain') {
      const ok = user.startsWith(unit.surface, pos) && dfs(unitIndex + 1, pos + unit.surface.length);
      memo.set(key, ok);
      return ok;
    }

    const canMatchSurface = unit.surface.length > 0 && user.startsWith(unit.surface, pos) && dfs(unitIndex + 1, pos + unit.surface.length);
    if (canMatchSurface) {
      memo.set(key, true);
      return true;
    }

    const reading = unit.reading;
    const canMatchReading = reading.length > 0 && user.startsWith(reading, pos) && dfs(unitIndex + 1, pos + reading.length);
    memo.set(key, canMatchReading);
    return canMatchReading;
  };

  return dfs(0, 0);
}

export type DiffUnitOp =
  | { kind: 'extra'; text: string }
  | { kind: 'unit'; unit: RubyUnit; status: 'correct_kanji' | 'correct_kana' | 'missing' };

export function diffSentenceAnswer(user: string, answerWithRuby: string): DiffUnitOp[] {
  const units = parseRubyUnits(answerWithRuby);

  const memo = new Map<string, { cost: number; ops: DiffUnitOp[] }>();

  function dfs(u: number, c: number): { cost: number; ops: DiffUnitOp[] } {
    if (u === units.length && c === user.length) return { cost: 0, ops: [] };
    const key = `${u},${c}`;
    if (memo.has(key)) return memo.get(key)!;

    let bestCost = Infinity;
    let bestOps: DiffUnitOp[] = [];

    // 1. Extra user char
    if (c < user.length) {
      const res = dfs(u, c + 1);
      const cost = res.cost + 1;
      if (cost < bestCost) {
        bestCost = cost;
        if (res.ops.length > 0 && res.ops[0].kind === 'extra') {
          bestOps = [{ kind: 'extra', text: user[c] + res.ops[0].text }, ...res.ops.slice(1)];
        } else {
          bestOps = [{ kind: 'extra', text: user[c] }, ...res.ops];
        }
      }
    }

    if (u < units.length) {
      const unit = units[u];

      // 2. Match surface (before "missing" so equal-cost paths consume input left-to-right)
      if (unit.surface && user.startsWith(unit.surface, c)) {
        const resSurf = dfs(u + 1, c + unit.surface.length);
        const costSurf = resSurf.cost;
        if (costSurf < bestCost) {
          bestCost = costSurf;
          bestOps = [{ kind: 'unit', unit, status: 'correct_kanji' }, ...resSurf.ops];
        }
      }

      // 3. Match reading
      if (unit.reading && user.startsWith(unit.reading, c)) {
        const resRead = dfs(u + 1, c + unit.reading.length);
        // Add a tiny penalty to prefer kanji match over kana match if both are possible
        const costRead = resRead.cost + 0.01;
        if (costRead < bestCost) {
          bestCost = costRead;
          bestOps = [{ kind: 'unit', unit, status: 'correct_kana' }, ...resRead.ops];
        }
      }

      // 4. Skip unit (missing)
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

function isPartialRubyMatch(user: string, answerWithRuby: string, ops?: DiffUnitOp[]): boolean {
  if (!user.trim()) return false;
  if (matchesByRubyUnits(user, answerWithRuby)) return false;

  const diffOps = ops ?? diffSentenceAnswer(user, answerWithRuby);
  return diffOps.some(
    op => op.kind === 'unit' && (op.status === 'correct_kanji' || op.status === 'correct_kana'),
  );
}

/** Lower is better; used to pick among template alternatives for feedback. */
export function diffSentenceAnswerCost(ops: DiffUnitOp[]): number {
  return ops.reduce((sum, op) => {
    if (op.kind === 'extra') return sum + 1;
    if (op.kind === 'unit' && op.status === 'missing') return sum + 1;
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

function hasOptionalRegionExtras(user: string, longer: string, shorter: string): boolean {
  const seg = optionalSegmentBetween(longer, shorter);
  if (!seg) return false;
  const segStart = stripRuby(longer).indexOf(seg);
  if (segStart < 0) return false;

  const ops = diffSentenceAnswer(user, shorter);
  let shorterPlainPos = 0;

  for (const op of ops) {
    if (op.kind === 'extra') {
      return shorterPlainPos === segStart;
    }
    if (op.kind === 'unit') {
      shorterPlainPos += op.unit.surface.length;
    }
  }
  return false;
}

/**
 * When the user typed in a slot covered by `{primary|}` (empty second option),
 * diff against the shorter empty variant shows extras at that position — use primary.
 */
function findPrimaryForFilledOptional(alternatives: string[], user: string): string | null {
  let best: string | null = null;
  let bestCost = Infinity;
  let bestIndex = Infinity;

  for (const longer of alternatives) {
    const longerIndex = alternatives.indexOf(longer);
    for (const shorter of alternatives) {
      if (longer === shorter) continue;
      if (!optionalSegmentBetween(longer, shorter)) continue;
      if (!hasOptionalRegionExtras(user, longer, shorter)) continue;
      const ops = diffSentenceAnswer(user, longer);
      const cost = diffSentenceAnswerCost(ops);
      if (cost < bestCost || (cost === bestCost && longerIndex < bestIndex)) {
        bestCost = cost;
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
    return { answer, ops, cost: diffSentenceAnswerCost(ops), index };
  });

  const partialMatches = scored.filter(({ answer, ops }) => isPartialRubyMatch(user, answer, ops));
  const candidates = partialMatches.length > 0 ? partialMatches : scored;

  let best = candidates[0]!;
  for (const candidate of candidates.slice(1)) {
    if (
      candidate.cost < best.cost
      || (candidate.cost === best.cost && candidate.index < best.index)
    ) {
      best = candidate;
    }
  }

  return { bestAnswer: best.answer, ops: best.ops };
}

export type CharDiffOp =
  | { kind: 'equal'; char: string; expectedIndex: number }
  | { kind: 'insert'; char: string; expectedIndex: number }
  | { kind: 'delete'; char: string; expectedIndex: number };

export function diffByLCS(user: string, expected: string): CharDiffOp[] {
  const a = splitChars(user);
  const b = splitChars(expected);
  const m = a.length;
  const n = b.length;

  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = m - 1; i >= 0; i--) {
    for (let j = n - 1; j >= 0; j--) {
      dp[i][j] = a[i] === b[j] ? 1 + dp[i + 1][j + 1] : Math.max(dp[i + 1][j], dp[i][j + 1]);
    }
  }

  const ops: CharDiffOp[] = [];
  let i = 0;
  let j = 0;
  while (i < m && j < n) {
    if (a[i] === b[j]) {
      ops.push({ kind: 'equal', char: b[j], expectedIndex: j });
      i++;
      j++;
      continue;
    }
    if (dp[i + 1][j] >= dp[i][j + 1]) {
      ops.push({ kind: 'insert', char: a[i], expectedIndex: j });
      i++;
    } else {
      ops.push({ kind: 'delete', char: b[j], expectedIndex: j });
      j++;
    }
  }
  while (i < m) {
    ops.push({ kind: 'insert', char: a[i], expectedIndex: j });
    i++;
  }
  while (j < n) {
    ops.push({ kind: 'delete', char: b[j], expectedIndex: j });
    j++;
  }

  return ops;
}
