import type { DiffUnitOp } from '../engines/sentenceEngine';
import { stripRuby } from '../engines/sentenceEngine';
import { stripRubyTags } from './utils';

/** Plain text for copy: bracket ruby notation → kanji/kana surface only. */
export function plainCopyFromRubyNotation(text: string): string {
  return stripRuby(text);
}

/** Plain text for copy: HTML or bracket ruby → surface only (no furigana). */
export function plainCopyFromRubyHtml(text: string): string {
  return stripRubyTags(text);
}

/**
 * Plain text for copy from a sentence diff: ruby as surface[reading], user mistakes as __text__.
 */
export function plainCopyFromDiffOps(ops: DiffUnitOp[]): string {
  let out = '';
  for (const op of ops) {
    if (op.kind === 'extra') {
      out += `_${op.text}_`;
      continue;
    }
    const { unit } = op;
    if (unit.kind === 'plain') {
      out += unit.surface;
    } else {
      out += `${unit.surface}[${unit.reading}]`;
    }
  }
  return out;
}

export function setClipboardPlainText(event: React.ClipboardEvent, text: string): void {
  event.preventDefault();
  event.clipboardData.setData('text/plain', text);
}
