/** Fullwidth / IME variants → ASCII syntax used by answer templates. */
const TEMPLATE_SYNTAX_CHAR_MAP: Readonly<Record<string, string>> = {
  '｛': '{',
  '｝': '}',
  '［': '[',
  '］': ']',
  '｜': '|',
  '±': '|',
};

export function normalizeAnswerTemplateSyntax(text: string): string {
  let out = '';
  for (const ch of text) {
    out += TEMPLATE_SYNTAX_CHAR_MAP[ch] ?? ch;
  }
  return out;
}

export function applyAnswerTemplateSyntaxInputChange(
  raw: string,
  caret: number | null,
): { value: string; caret: number | null; didNormalize: boolean } {
  const value = normalizeAnswerTemplateSyntax(raw);
  if (value === raw) return { value, caret, didNormalize: false };
  if (caret === null) return { value, caret: null, didNormalize: true };

  let newCaret = 0;
  for (let i = 0; i < caret && i < raw.length; i++) {
    const ch = raw[i]!;
    newCaret += (TEMPLATE_SYNTAX_CHAR_MAP[ch] ?? ch).length;
  }
  return { value, caret: newCaret, didNormalize: true };
}
