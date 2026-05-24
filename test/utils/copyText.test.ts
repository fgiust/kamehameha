import { describe, expect, it } from 'vitest';
import type { DiffUnitOp } from '../../src/engines/sentenceEngine';
import {
  plainCopyFromDiffOps,
  plainCopyFromRubyHtml,
  plainCopyFromRubyNotation,
} from '../../src/utils/copyText';

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
    expect(plainCopyFromDiffOps(ops)).toBe('た__あ__アニメ[あにめ]');
  });
});
