import { describe, expect, it } from 'vitest';
import { buildKanjiAnswerTemplate, getConjugationPromptDisplay, getReverseQAResponse, matchesConjugationAnswer, matchesReverseQAAnswer } from '../../src/utils/conjugationAnswer';
import { politeform } from '../../src/engines/verbConjugation';

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

  it('builds polite-form kanji prompt display for reverse QA', () => {
    const dict = '行[い]く';
    const kana = 'いきます';

    expect(buildKanjiAnswerTemplate(dict, kana)).toBe('行[い]きます');
    expect(getConjugationPromptDisplay(dict, kana, false, false)).toEqual({
      plainText: kana,
      displayText: kana,
      mode: 'kana',
    });
    expect(getConjugationPromptDisplay(dict, kana, true, false)).toEqual({
      plainText: '行きます',
      displayText: '行きます',
      mode: 'kanji',
    });
    expect(getConjugationPromptDisplay(dict, kana, true, true)).toEqual({
      plainText: '行きます',
      displayText: '行[い]きます',
      mode: 'ruby',
    });
  });

  it('maps polite reverse QA prompts to short dictionary or short negative answers', () => {
    const dict = '行[い]く';

    const positive = getReverseQAResponse(politeform, dict, 'u', {}, true, false);
    expect(positive.kanaAnswers).toEqual(['いく']);
    expect(positive.display.plainText).toBe('行く');
    expect(matchesReverseQAAnswer('いく', dict, positive.kanaAnswers)).toBe(true);
    expect(matchesReverseQAAnswer('行く', dict, positive.kanaAnswers)).toBe(true);

    const negative = getReverseQAResponse(politeform, dict, 'u', { neg: true }, true, false);
    expect(negative.kanaAnswers).toEqual(['いかない']);
    expect(negative.display.plainText).toBe('行かない');
    expect(matchesReverseQAAnswer('いかない', dict, negative.kanaAnswers)).toBe(true);
    expect(matchesReverseQAAnswer('行かない', dict, negative.kanaAnswers)).toBe(true);
    expect(matchesReverseQAAnswer('いく', dict, negative.kanaAnswers)).toBe(false);
  });
});
