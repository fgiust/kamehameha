const ASCII_DIGIT_RE = /^[0-9]+$/;
const FULLWIDTH_DIGIT_RE = /^[０-９]+$/;
const KANJI_DIGIT_RE = /^[零一二三四五六七八九十百千万〇]+$/;

const KANJI_DIGIT_VALUES: Record<string, number> = {
  零: 0,
  〇: 0,
  一: 1,
  二: 2,
  三: 3,
  四: 4,
  五: 5,
  六: 6,
  七: 7,
  八: 8,
  九: 9,
};

const KANJI_ONES = ['零', '一', '二', '三', '四', '五', '六', '七', '八', '九'] as const;

export function isNumberChar(ch: string): boolean {
  return /[0-9０-９零一二三四五六七八九十百千万〇]/.test(ch);
}

type NumberKind = 'ascii' | 'fullwidth' | 'kanji';

function numberKindOf(ch: string): NumberKind | null {
  if (/[0-9]/.test(ch)) return 'ascii';
  if (/[０-９]/.test(ch)) return 'fullwidth';
  if (/[零一二三四五六七八九十百千万〇]/.test(ch)) return 'kanji';
  return null;
}

function matchesKind(ch: string, kind: NumberKind): boolean {
  return numberKindOf(ch) === kind;
}

/** Longest number run at `start` using one notation (ascii, fullwidth, or kanji). */
export function readNumberSpanAt(text: string, start: number): { raw: string; end: number } | null {
  const kind = numberKindOf(text[start] ?? '');
  if (!kind) return null;

  let end = start + 1;
  while (end < text.length && matchesKind(text[end]!, kind)) {
    end++;
  }

  return { raw: text.slice(start, end), end };
}

export function parseNumberSpan(raw: string): number | null {
  if (ASCII_DIGIT_RE.test(raw)) {
    const n = Number.parseInt(raw, 10);
    return Number.isFinite(n) ? n : null;
  }

  if (FULLWIDTH_DIGIT_RE.test(raw)) {
    const ascii = raw.replace(/[０-９]/g, ch => String.fromCharCode(ch.charCodeAt(0) - 0xff10 + 0x30));
    const n = Number.parseInt(ascii, 10);
    return Number.isFinite(n) ? n : null;
  }

  if (KANJI_DIGIT_RE.test(raw)) {
    return parseKanjiNumber(raw);
  }

  return null;
}

export function parseKanjiNumber(raw: string): number | null {
  if (!raw) return null;

  let total = 0;
  let current = 0;

  for (const ch of raw) {
    if (ch in KANJI_DIGIT_VALUES) {
      current += KANJI_DIGIT_VALUES[ch]!;
      continue;
    }

    if (ch === '十') {
      current = (current || 1) * 10;
      continue;
    }
    if (ch === '百') {
      current = (current || 1) * 100;
      continue;
    }
    if (ch === '千') {
      current = (current || 1) * 1000;
      continue;
    }
    if (ch === '万') {
      total += (current || 1) * 10000;
      current = 0;
      continue;
    }

    return null;
  }

  return total + current;
}

export function formatAsciiNumber(value: number): string {
  return String(value);
}

export function formatFullwidthNumber(value: number): string {
  return String(value).replace(/[0-9]/g, d => String.fromCharCode(d.charCodeAt(0) + 0xff10 - 0x30));
}

export function formatKanjiNumber(value: number): string {
  if (value === 0) return '零';
  if (value < 0 || !Number.isFinite(value)) return '';

  if (value >= 10000) {
    const man = Math.floor(value / 10000);
    const rest = value % 10000;
    return formatKanjiNumber(man) + '万' + (rest > 0 ? formatKanjiNumber(rest) : '');
  }

  let result = '';
  let rem = value;

  const thousands = Math.floor(rem / 1000);
  if (thousands > 0) {
    result += (thousands === 1 ? '' : KANJI_ONES[thousands]) + '千';
    rem %= 1000;
  }

  const hundreds = Math.floor(rem / 100);
  if (hundreds > 0) {
    result += (hundreds === 1 ? '' : KANJI_ONES[hundreds]) + '百';
    rem %= 100;
  }

  const tens = Math.floor(rem / 10);
  if (tens > 0) {
    result += (tens === 1 ? '' : KANJI_ONES[tens]) + '十';
    rem %= 10;
  }

  if (rem > 0) {
    result += KANJI_ONES[rem];
  }

  return result;
}

/** Three surface forms for the same integer (deduped, non-empty). */
export function numberSurfaceAlternatives(value: number): string[] {
  const alts = [formatKanjiNumber(value), formatAsciiNumber(value), formatFullwidthNumber(value)].filter(
    s => s.length > 0,
  );
  return [...new Set(alts)];
}

/** Extra surface forms for a part that starts with a number (e.g. 3回 → 三回, ３回). */
export function expandNumberPrefixVariants(part: string): string[] {
  const span = readNumberSpanAt(part, 0);
  if (!span || span.end === 0) return [];

  const value = parseNumberSpan(span.raw);
  if (value === null) return [];

  const suffix = part.slice(span.end);
  return numberSurfaceAlternatives(value)
    .filter(alt => alt !== span.raw)
    .map(alt => alt + suffix);
}

/** Add missing kanji / ascii / fullwidth number forms to each `{a|b}` option. */
export function expandAlternativeGroupNumbers(content: string): string[] {
  const out = new Set<string>();

  for (const part of content.split('|')) {
    out.add(part);
    for (const variant of expandNumberPrefixVariants(part)) {
      out.add(variant);
    }
  }

  return [...out];
}

function alignSurfaceAt(
  user: string,
  userPos: number,
  surface: string,
  allowNumericalAlternatives: boolean,
): number | null {
  if (user.startsWith(surface, userPos)) return surface.length;
  if (!allowNumericalAlternatives || surface.length === 0) return null;

  let si = 0;
  let up = userPos;

  while (si < surface.length) {
    if (user[up] === surface[si]) {
      si++;
      up++;
      continue;
    }

    const uSpan = readNumberSpanAt(user, up);
    const sSpan = readNumberSpanAt(surface, si);
    if (uSpan && sSpan) {
      const uv = parseNumberSpan(uSpan.raw);
      const sv = parseNumberSpan(sSpan.raw);
      if (uv !== null && uv === sv) {
        up += uSpan.raw.length;
        si += sSpan.raw.length;
        continue;
      }
    }

    return null;
  }

  return up - userPos;
}

/** Compare surfaces char-by-char, treating equivalent number notations as equal. */
export function surfacesAlignAt(
  user: string,
  userPos: number,
  surface: string,
  allowNumericalAlternatives: boolean,
): boolean {
  return alignSurfaceAt(user, userPos, surface, allowNumericalAlternatives) !== null;
}

/** How many user chars match a template surface at `userPos` (for diff cursor advance). */
export function matchingUserPrefixLength(
  user: string,
  userPos: number,
  surface: string,
  allowNumericalAlternatives: boolean,
): number | null {
  return alignSurfaceAt(user, userPos, surface, allowNumericalAlternatives);
}

/**
 * When a number is only the prefix of a ruby surface (e.g. 三十 in 三十分[…]),
 * wrap the whole surface+reading as `{三十分[…]|30分[…]|…}` instead of splitting.
 */
function tryWrapRubySurfaceNumber(
  template: string,
  start: number,
): { wrapped: string; end: number } | null {
  const bracket = template.indexOf('[', start);
  if (bracket === -1 || bracket === start) return null;

  const surface = template.slice(start, bracket);
  const span = readNumberSpanAt(surface, 0);
  if (!span || span.end >= surface.length) return null;

  const variants = expandNumberPrefixVariants(surface);
  if (variants.length === 0) return null;

  const close = template.indexOf(']', bracket);
  if (close === -1) return null;

  const reading = template.slice(bracket, close + 1);
  const alts = [...new Set([surface, ...variants])].map(s => s + reading);
  return { wrapped: `{${alts.join('|')}}`, end: close };
}

/** Wrap bare number runs outside `{…}` as `{kanji|ascii|fullwidth}`. */
export function applyNumericalAlternatives(template: string): string {
  let out = '';

  for (let i = 0; i < template.length; i++) {
    const ch = template[i]!;

    if (ch === '{') {
      const close = template.indexOf('}', i);
      if (close === -1) {
        out += ch;
        continue;
      }
      const content = template.slice(i + 1, close);
      const expanded = expandAlternativeGroupNumbers(content);
      out += `{${expanded.join('|')}}`;
      i = close;
      continue;
    }

    const rubyWrap = tryWrapRubySurfaceNumber(template, i);
    if (rubyWrap) {
      out += rubyWrap.wrapped;
      i = rubyWrap.end;
      continue;
    }

    const span = readNumberSpanAt(template, i);
    if (!span) {
      out += ch;
      continue;
    }

    const value = parseNumberSpan(span.raw);
    const alts = value === null ? null : numberSurfaceAlternatives(value);

    if (!alts || alts.length <= 1) {
      out += span.raw;
      i = span.end - 1;
      continue;
    }

    out += `{${alts.join('|')}}`;
    i = span.end - 1;
  }

  return out;
}
