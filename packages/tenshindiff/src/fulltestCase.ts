import type { DiffUnitOp } from './types';

export function shownOutputFromOps(ops: DiffUnitOp[]): string {
  return ops
    .map(op => {
      if (op.kind === 'extra') return op.text;
      if (op.unit.kind === 'plain') return op.unit.surface;
      return `${op.unit.surface}[${op.unit.reading}]`;
    })
    .join('');
}

/**
 * Per-character markers aligned with shown output (including `[` `]`).
 * ・ match · ー removed/wrong · ＋ added · ＝ kanji wrong, furigana ok (yellow).
 */
export function validationRowFromOps(ops: DiffUnitOp[], isCorrect: boolean): string {
  const chunks = ops.map(op => {
    if (op.kind === 'extra') {
      return 'ー'.repeat(Array.from(op.text).length);
    }

    const marker = op.status === 'correct_kanji' ? '・' : op.status === 'correct_kana' ? '＝' : '＋';
    const surface = marker.repeat(Array.from(op.unit.surface).length);
    if (op.unit.kind === 'plain') return surface;

    const readingMarker = op.status === 'missing' ? '＋' : '・';
    const reading = readingMarker.repeat(Array.from(op.unit.reading).length);
    return `${surface}[${reading}]`;
  });

  return `${chunks.join('')}${isCorrect ? '✅' : '❌'}`;
}

export function buildFulltestCaseText(
  template: string,
  user: string,
  ops: DiffUnitOp[],
  isCorrect: boolean,
): string {
  return ['#', template, user, shownOutputFromOps(ops), validationRowFromOps(ops, isCorrect)].join('\n');
}
