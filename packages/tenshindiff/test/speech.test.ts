import { describe, it, expect } from 'vitest';
import type { DiffUnitOp } from '../src/types';
import { speechTextFromDiffOps, speechTextFromRubyNotation } from '../src/speech';

describe('speechTextFromDiffOps', () => {
  it('excludes extra (red) chars and includes missing (white) units', () => {
    const ops: DiffUnitOp[] = [
      { kind: 'unit', unit: { kind: 'plain', surface: 'た', reading: 'た' }, status: 'correct_kanji' },
      { kind: 'extra', text: 'あ' },
      { kind: 'unit', unit: { kind: 'ruby', surface: 'アニメ', reading: 'あにめ' }, status: 'missing' },
    ];
    expect(speechTextFromDiffOps(ops, 'kanji')).toBe('たアニメ');
    expect(speechTextFromDiffOps(ops, 'kana')).toBe('たあにめ');
  });

  it('includes correct_kana (yellow) ruby as kanji surface or kana reading', () => {
    const ops: DiffUnitOp[] = [
      { kind: 'unit', unit: { kind: 'ruby', surface: '武', reading: 'たけ' }, status: 'correct_kana' },
      { kind: 'unit', unit: { kind: 'ruby', surface: '志', reading: 'し' }, status: 'correct_kana' },
      { kind: 'unit', unit: { kind: 'plain', surface: 'さ', reading: 'さ' }, status: 'correct_kanji' },
      { kind: 'unit', unit: { kind: 'plain', surface: 'ん', reading: 'ん' }, status: 'correct_kanji' },
      { kind: 'unit', unit: { kind: 'plain', surface: 'は', reading: 'は' }, status: 'missing' },
      { kind: 'unit', unit: { kind: 'ruby', surface: '先生', reading: 'せんせい' }, status: 'missing' },
    ];
    expect(speechTextFromDiffOps(ops, 'kanji')).toBe('武志さんは先生');
    expect(speechTextFromDiffOps(ops, 'kana')).toBe('たけしさんはせんせい');
  });

  it('returns empty string when all ops are extra', () => {
    const ops: DiffUnitOp[] = [{ kind: 'extra', text: 'wrong' }];
    expect(speechTextFromDiffOps(ops, 'kanji')).toBe('');
  });
});

describe('speechTextFromRubyNotation', () => {
  it('keeps okurigana before a ruby kanji in kana mode', () => {
    const text = '雨[あめ]が降[ふ]っている間[あいだ]に飴[あめ]を食[た]べた';
    expect(speechTextFromRubyNotation(text, 'kanji')).toBe('雨が降っている間に飴を食べた');
    expect(speechTextFromRubyNotation(text, 'kana')).toBe('あめがふっているあいだにあめをたべた');
  });

  it('keeps okurigana after a ruby kanji in kana mode', () => {
    const text = '橋[はし]の端[はし]で箸[はし]を使[つか]いました';
    expect(speechTextFromRubyNotation(text, 'kana')).toBe('はしのはしではしをつかいました');
  });
});
