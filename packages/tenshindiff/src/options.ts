/** Grading / diff options applied when expanding answer templates. All flags default to false. */
export type DiffOptions = {
  /**
   * Treat a trailing 。 as optional even when not written in the template.
   * Equivalent to appending `{|。}` before parsing alternatives.
   */
  ignoreTrailingPunctuation?: boolean;
  /**
   * Treat each literal 、 in the template as optional.
   * Equivalent to wrapping every 、 as `{、|}` before parsing alternatives.
   */
  commasAsOptional?: boolean;
};

export const DEFAULT_DIFF_OPTIONS: DiffOptions = {};

function hasTrailingOptionalPeriod(template: string): boolean {
  const trimmed = template.trimEnd();
  return trimmed.endsWith('{|。}') || trimmed.endsWith('{。|}');
}

/** Wrap each literal comma outside `{…}` groups as `{、|}`. Existing `{、|}` groups are preserved. */
export function applyCommasAsOptional(template: string): string {
  let out = '';
  for (let i = 0; i < template.length; i++) {
    const ch = template[i]!;
    if (ch === '{') {
      const close = template.indexOf('}', i);
      if (close === -1) {
        out += ch;
        continue;
      }
      out += template.slice(i, close + 1);
      i = close;
      continue;
    }
    if (ch === '、') {
      out += '{、|}';
      continue;
    }
    out += ch;
  }
  return out;
}

/** Append `{|。}` when the template has no trailing optional period group. */
export function applyIgnoreTrailingPunctuation(template: string): string {
  if (hasTrailingOptionalPeriod(template)) return template;
  return `${template}{|。}`;
}

/** Apply diff options to a raw answer template string. */
export function applyTemplateDiffOptions(template: string, options: DiffOptions = DEFAULT_DIFF_OPTIONS): string {
  let result = template;
  if (options.commasAsOptional) {
    result = applyCommasAsOptional(result);
  }
  if (options.ignoreTrailingPunctuation) {
    result = applyIgnoreTrailingPunctuation(result);
  }
  return result;
}
