import { describe, expect, it } from 'vitest';
import { findInvalidRubyNotations } from '../src/validate';

describe('findInvalidRubyNotations', () => {
  it('accepts furigana on kanji', () => {
    expect(findInvalidRubyNotations('私[わたし]は図[と]書[しょ]館[かん]')).toEqual([]);
    expect(findInvalidRubyNotations('お姉[ねえ]さん')).toEqual([]);
  });

  it('rejects furigana on kana-only surfaces', () => {
    const issues = findInvalidRubyNotations('{これ[は]|}何[なん]ですか');
    expect(issues).toHaveLength(1);
    expect(issues[0]).toMatchObject({
      surface: 'これ',
      reading: 'は',
      reason: 'surface-without-kanji',
    });
  });

  it('accepts number + counter ruby', () => {
    expect(findInvalidRubyNotations('{3つ[みっつ]|三つ[みっつ]}')).toEqual([]);
  });
});
