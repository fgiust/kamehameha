import type { DiffUnitOp } from './types';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderDiffInner(ops: DiffUnitOp[]): string {
  let html = '';
  for (const op of ops) {
    if (op.kind === 'extra') {
      html += `<span class="diff-char diff-deleted">${escapeHtml(op.text)}</span>`;
      continue;
    }

    const { unit, status } = op;

    if (unit.kind === 'plain') {
      const cls = status === 'missing' ? 'diff-missing' : 'diff-correct';
      html += `<span class="diff-char ${cls}">${escapeHtml(unit.surface)}</span>`;
      continue;
    }

    const kanjiClass =
      status === 'correct_kanji'
        ? 'diff-correct'
        : status === 'correct_kana'
          ? 'diff-kanji-kana'
          : 'diff-missing';
    const rtClass = status === 'missing' ? 'diff-missing' : 'diff-correct';
    html += `<ruby class="${kanjiClass}">${escapeHtml(unit.surface)}<rt class="${rtClass}">${escapeHtml(unit.reading)}</rt></ruby>`;
  }
  return html;
}

export type RenderDiffHtmlOptions = {
  /** Wrap in &lt;span class="diff-display …"&gt; (default true) */
  wrap?: boolean;
  className?: string;
};

/** HTML markup equivalent to DiffDisplay (no React). */
export function renderDiffHtml(ops: DiffUnitOp[], options: RenderDiffHtmlOptions = {}): string {
  const { wrap = true, className = '' } = options;
  const inner = renderDiffInner(ops);
  if (!wrap) return inner;
  const classes = ['diff-display', className].filter(Boolean).join(' ');
  return `<span class="${classes}">${inner}</span>`;
}
