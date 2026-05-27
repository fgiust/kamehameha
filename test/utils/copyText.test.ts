// @vitest-environment happy-dom
import { describe, expect, it } from 'vitest';
import type { DiffUnitOp } from 'tenshindiff';
import { formatDiffPlainText } from 'tenshindiff';
import {
  plainCopyFromDomRange,
  plainCopyFromRubyHtml,
  plainCopyFromRubyNotation,
  resolveCopyPlainText,
} from '../../src/utils/copyText';

function selectRange(startNode: Node, startOffset: number, endNode: Node, endOffset: number) {
  const range = document.createRange();
  range.setStart(startNode, startOffset);
  range.setEnd(endNode, endOffset);
  const selection = window.getSelection()!;
  selection.removeAllRanges();
  selection.addRange(range);
}

describe('copyText', () => {
  it('strips bracket furigana for plain copy', () => {
    expect(plainCopyFromRubyNotation('私[わたし]は図[と]書[しょ]館[かん]')).toBe('私は図書館');
  });

  it('strips HTML ruby for plain copy', () => {
    expect(plainCopyFromRubyHtml('伊<rt>い</rt>藤<rt>とう</rt>')).toBe('伊藤');
  });

  it('formats diff ops with bracket readings and underscored mistakes', () => {
    const ops: DiffUnitOp[] = [
      { kind: 'unit', unit: { kind: 'plain', surface: 'た', reading: 'た' }, status: 'correct_kanji' },
      { kind: 'extra', text: 'あ' },
      { kind: 'unit', unit: { kind: 'ruby', surface: 'アニメ', reading: 'あにめ' }, status: 'missing' },
    ];
    expect(formatDiffPlainText(ops)).toBe('た_あ_アニメ[あにめ]');
  });

  it('copies full plain text when the whole container is selected', () => {
    const container = document.createElement('span');
    container.innerHTML = '<ruby>私<rt>わたし</rt></ruby>は';
    const full = '私は';
    selectRange(container, 0, container, container.childNodes.length);
    expect(resolveCopyPlainText(container, full)).toBe(full);
  });

  it('copies only selected surface text for partial ruby selection', () => {
    const container = document.createElement('span');
    const ruby = document.createElement('ruby');
    ruby.append('私は', Object.assign(document.createElement('rt'), { textContent: 'わたしは' }));
    container.append(ruby, '図書館');
    const kanji = ruby.firstChild as Text;
    selectRange(kanji, 0, kanji, 1);
    expect(resolveCopyPlainText(container, '私は図書館')).toBe('私');
  });

  it('formats a fully selected diff ruby with reading brackets', () => {
    const container = document.createElement('span');
    container.className = 'diff-display';
    const ruby = document.createElement('ruby');
    ruby.append('アニメ', Object.assign(document.createElement('rt'), { textContent: 'あにめ' }));
    container.append(ruby);
    selectRange(ruby, 0, ruby, ruby.childNodes.length);
    expect(resolveCopyPlainText(container, 'アニメ[あにめ]', 'diff')).toBe('アニメ[あにめ]');
  });

  it('copies partial diff deleted text with underscores', () => {
    const container = document.createElement('span');
    container.className = 'diff-display';
    const deleted = document.createElement('span');
    deleted.className = 'diff-char diff-deleted';
    deleted.textContent = 'あい';
    container.append(deleted);
    const text = deleted.firstChild as Text;
    selectRange(text, 0, text, 1);
    expect(plainCopyFromDomRange(container, window.getSelection()!.getRangeAt(0), 'diff')).toBe('_あ_');
  });

  it('copies only the selected diff-char portion', () => {
    const container = document.createElement('span');
    container.className = 'diff-display';
    const plain = document.createElement('span');
    plain.className = 'diff-char diff-correct';
    plain.textContent = 'たべ';
    container.append(plain);
    const text = plain.firstChild as Text;
    selectRange(text, 1, text, 2);
    expect(resolveCopyPlainText(container, 'たべ', 'diff')).toBe('べ');
  });
});
