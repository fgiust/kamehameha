import { describe, expect, it } from 'vitest';
import { applyJapaneseImeInputChange } from '../../src/engines/readingExerciseEngine';

describe('applyJapaneseImeInputChange', () => {
  it('leaves katakana unchanged when deleting elsewhere', () => {
    const prev = 'ラーメンを食べます';
    const raw = 'ラーメンを食べま';
    const { value, didConvert } = applyJapaneseImeInputChange(prev, raw, raw.length);
    expect(value).toBe('ラーメンを食べま');
    expect(didConvert).toBe(false);
  });

  it('converts only a typed latin segment', () => {
    const prev = 'ラーメン';
    const raw = 'ラーメンra';
    const { value, didConvert } = applyJapaneseImeInputChange(prev, raw, raw.length);
    expect(value).toBe('ラーメンら');
    expect(didConvert).toBe(true);
  });
});
