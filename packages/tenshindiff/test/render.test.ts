import { describe, expect, it } from 'vitest';
import { diffSentenceAnswer } from '../src/diff';
import { renderDiffHtml } from '../src/render';

describe('renderDiffHtml', () => {
  it('escapes HTML in surfaces and readings', () => {
    const ops = diffSentenceAnswer('a<b', 'a<b');
    const html = renderDiffHtml(ops, { wrap: false });
    expect(html).toContain('&lt;');
    expect(html).not.toMatch(/<b>/);
  });

  it('marks extra chars as diff-deleted', () => {
    const ops = diffSentenceAnswer('xyz', 'x[えっくす]');
    const html = renderDiffHtml(ops, { wrap: false });
    expect(html).toContain('diff-deleted');
    expect(html).toContain('y');
  });

  it('wraps in diff-display by default', () => {
    const ops = diffSentenceAnswer('私', '私[わたし]');
    const html = renderDiffHtml(ops);
    expect(html).toMatch(/^<span class="diff-display/);
  });

  it('renders correct_kana with diff-kanji-kana', () => {
    const ops = diffSentenceAnswer('いとう', '伊[い]藤[とう]');
    const html = renderDiffHtml(ops, { wrap: false });
    expect(html).toContain('diff-kanji-kana');
    expect(html).toContain('<ruby');
    expect(html).toContain('<rt');
  });
});
