import type { RubyUnit } from './types';

/** Strip ruby annotations from text: 漢[かん]字[じ] → 漢字 (for display) */
export function stripRuby(text: string): string {
  return text.replace(/\[([^\]]*)\]/g, '');
}

/** Convert ruby bracket notation to plain kana reading */
export function toKana(text: string): string {
  return text
    .replace(/([^[]+)\[([^]]*)\]/g, (_m, surface: string, reading: string) =>
      reading && reading.length > 0 ? reading : surface,
    )
    .replace(/\[([^]]*)\]/g, '$1');
}

function splitChars(input: string): string[] {
  return Array.from(input);
}

function isKanji(ch: string) {
  return /[\u4e00-\u9faf\u3400-\u4dbf々]/.test(ch);
}

/** ASCII / fullwidth digits that prefix counters (e.g. 1年, １週間, 5000円). */
function isNumberChar(ch: string) {
  return /[0-9０-９]/.test(ch);
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

    let kStart = buffer.length;
    while (kStart > 0 && isKanji(buffer[kStart - 1]!)) {
      kStart--;
    }
    while (kStart > 0 && isNumberChar(buffer[kStart - 1]!)) {
      kStart--;
    }

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

    const unit = units[unitIndex]!;
    if (unit.kind === 'plain') {
      const ok = user.startsWith(unit.surface, pos) && dfs(unitIndex + 1, pos + unit.surface.length);
      memo.set(key, ok);
      return ok;
    }

    const canMatchSurface =
      unit.surface.length > 0 && user.startsWith(unit.surface, pos) && dfs(unitIndex + 1, pos + unit.surface.length);
    if (canMatchSurface) {
      memo.set(key, true);
      return true;
    }

    const reading = unit.reading;
    const canMatchReading =
      reading.length > 0 && user.startsWith(reading, pos) && dfs(unitIndex + 1, pos + reading.length);
    memo.set(key, canMatchReading);
    return canMatchReading;
  };

  return dfs(0, 0);
}

/** How many user chars align with the start of a ruby segment (unit-by-unit, left to right). */
export function greedyConsumeRubyPrefix(userRest: string, segmentWithRuby: string): number {
  const units = parseRubyUnits(segmentWithRuby);
  let pos = 0;

  for (const unit of units) {
    if (unit.kind === 'plain') {
      if (!userRest.startsWith(unit.surface, pos)) return pos;
      pos += unit.surface.length;
      continue;
    }

    if (unit.surface.length > 0 && userRest.startsWith(unit.surface, pos)) {
      pos += unit.surface.length;
      continue;
    }

    if (unit.reading.length > 0 && userRest.startsWith(unit.reading, pos)) {
      pos += unit.reading.length;
      continue;
    }

    return pos;
  }

  return pos;
}
