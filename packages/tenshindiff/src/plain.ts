import type { DiffUnitOp } from './types';

/** Plain text from diff ops: ruby as surface[reading], user mistakes as _text_. */
export function formatDiffPlainText(ops: DiffUnitOp[]): string {
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
