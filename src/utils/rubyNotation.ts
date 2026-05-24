export type InvalidRubyReason = 'surface-without-kanji' | 'kana-before-bracket';

export type InvalidRubyNotation = {
  surface: string;
  reading: string;
  reason: InvalidRubyReason;
  index: number;
};

const KANJI_RE = /[\u4e00-\u9faf\u3400-\u4dbf々]/;
const KANA_RE = /[\u3040-\u309f\u30a0-\u30ff]/;
const RUBY_NOTATION_RE = /([^\[\]{}|]+)\[([^\]]*)\]/g;

export function isKanjiChar(ch: string): boolean {
  return KANJI_RE.test(ch);
}

export function isKanaChar(ch: string): boolean {
  return KANA_RE.test(ch);
}

/** Finds `[reading]` segments that are not attached to kanji (invalid data notation). */
export function findInvalidRubyNotations(text: string): InvalidRubyNotation[] {
  const issues: InvalidRubyNotation[] = [];
  let match: RegExpExecArray | null;

  RUBY_NOTATION_RE.lastIndex = 0;
  while ((match = RUBY_NOTATION_RE.exec(text)) !== null) {
    const surface = match[1]!;
    const reading = match[2]!;
    const chars = [...surface];
    const hasKanji = chars.some(isKanjiChar);
    const lastChar = chars[chars.length - 1] ?? '';

    if (!hasKanji) {
      issues.push({ surface, reading, reason: 'surface-without-kanji', index: match.index });
    } else if (isKanaChar(lastChar)) {
      issues.push({ surface, reading, reason: 'kana-before-bracket', index: match.index });
    }
  }

  return issues;
}

export function formatInvalidRubyNotation(issue: InvalidRubyNotation): string {
  return `${issue.surface}[${issue.reading}] (${issue.reason})`;
}
