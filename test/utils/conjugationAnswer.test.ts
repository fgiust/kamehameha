import { describe, expect, it } from 'vitest';
import { buildKanjiAnswerTemplate, getConjugationPromptDisplay, getReverseQAPromptDisplay, getReverseQAResponse, matchesConjugationAnswer, matchesReverseQAAnswer } from '../../src/utils/conjugationAnswer';
import { politeform } from '../../src/engines/verbConjugation';
import { getConjugationFormHint } from '../../src/utils/utils';

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

    const positive = getReverseQAResponse(politeform, dict, 'u', {});
    expect(positive.kanaAnswers).toEqual(['いく']);
    expect(positive.display.plainText).toBe('いく');
    expect(positive.display.mode).toBe('kana');
    expect(matchesReverseQAAnswer('いく', dict, positive.kanaAnswers)).toBe(true);
    expect(matchesReverseQAAnswer('行く', dict, positive.kanaAnswers)).toBe(true);

    const negative = getReverseQAResponse(politeform, dict, 'u', { neg: true });
    expect(negative.kanaAnswers).toEqual(['いかない']);
    expect(negative.display.plainText).toBe('いかない');
    expect(negative.display.mode).toBe('kana');
    expect(matchesReverseQAAnswer('いかない', dict, negative.kanaAnswers)).toBe(true);
    expect(matchesReverseQAAnswer('行かない', dict, negative.kanaAnswers)).toBe(true);
    expect(matchesReverseQAAnswer('いく', dict, negative.kanaAnswers)).toBe(false);
  });

  it('keeps polite reverse QA prompts on the positive polite form when neg is selected', () => {
    const dict = '行[い]く';
    const withNeg = getReverseQAPromptDisplay(politeform, dict, 'u', { neg: true }, false, false);
    const withoutNeg = getReverseQAPromptDisplay(politeform, dict, 'u', {}, false, false);

    expect(withNeg.plainText).toBe('いきます');
    expect(withoutNeg.plainText).toBe('いきます');
  });

  it('describes reverse polite QA targets as plain or negative plain forms', () => {
    expect(getConjugationFormHint(politeform, {}, { reverseQA: true })).toBe('plain form');
    expect(getConjugationFormHint(politeform, { neg: true }, { reverseQA: true })).toBe('negative plain form');
  });
});
