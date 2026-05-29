import type { DiffOptions } from 'tenshindiff';

/** Diff options for Genki-style sentence translate exercises. */
export const SENTENCE_DIFF_OPTIONS: DiffOptions = {
  ignoreTrailingPunctuation: true,
  commasAsOptional: true,
};
