import { describe, expect, it } from 'vitest';
import { generateAnswersFromTemplate } from '../src/answers';
import { diffSentenceAnswer, pickBestDiff } from '../src/diff';
import { gradeAnswer } from '../src/grade';
import {
  applyCommasAsOptional,
  applyIgnoreTrailingPunctuation,
  applyTemplateDiffOptions,
} from '../src/options';
import { matchesByRubyUnits } from '../src/ruby';

describe('DiffOptions', () => {
  describe('applyCommasAsOptional', () => {
    it('wraps literal commas outside brace groups', () => {
      expect(applyCommasAsOptional('A、B')).toBe('A{、|}B');
      expect(applyCommasAsOptional('し{、|}美[お]味[い]しい')).toBe('し{、|}美[お]味[い]しい');
    });
  });

  describe('applyIgnoreTrailingPunctuation', () => {
    it('appends {|。} when missing', () => {
      expect(applyIgnoreTrailingPunctuation('好[す]きです')).toBe('好[す]きです{|。}');
    });

    it('does not duplicate existing optional period', () => {
      expect(applyIgnoreTrailingPunctuation('好[す]き{です|だ}{|。}')).toBe('好[す]き{です|だ}{|。}');
    });
  });

  describe('ignoreTrailingPunctuation', () => {
    const template = '彼[かの]女[じょ]は綺[き]麗[れい]だし、大[だい]好[す]き{です|だ}';
    const user = '彼女は綺麗だし、大好きです。';

    it('accepts a trailing period not written in the template', () => {
      const without = generateAnswersFromTemplate(template);
      expect(matchesByRubyUnits(user, without)).toBe(false);

      const withFlag = generateAnswersFromTemplate(template, { ignoreTrailingPunctuation: true });
      expect(withFlag.some(a => matchesByRubyUnits(user, a))).toBe(true);
    });

    it('marks the trailing period as correct in the diff', () => {
      const { ops, isCorrect } = gradeAnswer(user, template, { ignoreTrailingPunctuation: true });
      expect(isCorrect).toBe(true);
      expect(ops.at(-1)).toEqual({
        kind: 'unit',
        unit: { kind: 'plain', surface: '。', reading: '。' },
        status: 'correct_kanji',
      });
    });
  });

  describe('commasAsOptional', () => {
    const template = '今日[きょう]は寒[さむ]いし、出[で]かけたくない';

    it('accepts answers with commas omitted', () => {
      const user = '今日は寒いし出かけたくない';
      const without = generateAnswersFromTemplate(template);
      expect(matchesByRubyUnits(user, without)).toBe(false);

      const withFlag = generateAnswersFromTemplate(template, { commasAsOptional: true });
      expect(withFlag.some(a => matchesByRubyUnits(user, a))).toBe(true);
    });

    it('still accepts answers that include commas', () => {
      const user = '今日は寒いし、出かけたくない';
      const withFlag = generateAnswersFromTemplate(template, { commasAsOptional: true });
      expect(withFlag.some(a => matchesByRubyUnits(user, a))).toBe(true);
      const { ops } = pickBestDiff(user, withFlag);
      const commaOp = ops.find(op => op.kind === 'unit' && op.unit.surface === '、');
      expect(commaOp?.kind === 'unit' && commaOp.status).toBe('correct_kanji');
    });
  });

  describe('combined options', () => {
    it('matches genki-style answer with optional comma and period', () => {
      const template = '彼[かの]女[じょ]は綺[き]麗[れい]だし、大[だい]好[す]き{です|だ}';
      const user = '彼女は綺麗だし大好きです。';
      const prepared = applyTemplateDiffOptions(template, {
        ignoreTrailingPunctuation: true,
        commasAsOptional: true,
      });
      expect(prepared).toContain('{、|}');
      expect(prepared.endsWith('{|。}')).toBe(true);

      const { isCorrect } = gradeAnswer(user, template, {
        ignoreTrailingPunctuation: true,
        commasAsOptional: true,
      });
      expect(isCorrect).toBe(true);
    });
  });

  describe('defaults', () => {
    it('leaves templates unchanged when no flags are set', () => {
      expect(applyTemplateDiffOptions('A、Bです')).toBe('A、Bです');
      const user = 'A、Bです。';
      expect(matchesByRubyUnits(user, 'A、Bです')).toBe(false);
      expect(diffSentenceAnswer(user, 'A、Bです').some(op => op.kind === 'extra')).toBe(true);
    });
  });
});
