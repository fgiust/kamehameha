import { describe, expect, it } from 'vitest';
import { buildKanjiAnswerTemplate, matchesConjugationAnswer } from '../../src/utils/conjugationAnswer';

describe('conjugationAnswer', () => {
  it('accepts kana and kanji te-form answers', () => {
    const dict = '並[なら]ぶ';
    const kana = 'ならんで';

    expect(buildKanjiAnswerTemplate(dict, kana)).toBe('並[なら]んで');
    expect(matchesConjugationAnswer('ならんで', dict, [kana])).toBe(true);
    expect(matchesConjugationAnswer('並んで', dict, [kana])).toBe(true);
    expect(matchesConjugationAnswer('並ん', dict, [kana])).toBe(false);
  });

  it('accepts ichidan te-form in kanji', () => {
    const dict = '食[た]べる';
    const kana = 'たべて';

    expect(matchesConjugationAnswer('食べて', dict, [kana])).toBe(true);
    expect(matchesConjugationAnswer('たべて', dict, [kana])).toBe(true);
  });

  it('accepts godan 行く te-form exception in kanji', () => {
    const dict = '行[い]く';
    const kana = 'いって';

    expect(matchesConjugationAnswer('行って', dict, [kana])).toBe(true);
    expect(matchesConjugationAnswer('いって', dict, [kana])).toBe(true);
  });

  it('accepts any listed kana alternative', () => {
    const dict = '並[なら]ぶ';
    expect(matchesConjugationAnswer('ならないで', dict, ['ならなくて', 'ならないで'])).toBe(true);
  });
});
