import { describe, expect, it } from 'vitest';
import { buildFulltestCaseText, validationRowFromOps } from '../../src/utils/fulltestCase';
import { pickBestDiffFromTemplate, generateAnswersFromTemplate } from 'tenshindiff';
import { SENTENCE_DIFF_OPTIONS } from '../../src/utils/sentenceDiffOptions';

describe('buildFulltestCaseText', () => {
  it('preserves template alternatives on line 2', () => {
    const template = '{|私[わたし]は}{喫茶店[きっさてん]|カフェ}で昼ご飯[ひるごはん]を食[た]べます';
    const user = '私は喫茶店で昼ご飯を食べます';
    const alternatives = generateAnswersFromTemplate(template, SENTENCE_DIFF_OPTIONS);
    const { ops } = pickBestDiffFromTemplate(user, template, SENTENCE_DIFF_OPTIONS);
    const isCorrect = alternatives.some(a => a === user);

    const text = buildFulltestCaseText(template, user, ops, isCorrect);
    const lines = text.split('\n');

    expect(lines).toHaveLength(5);
    expect(lines[0]).toBe('#');
    expect(lines[1]).toBe(template);
    expect(lines[2]).toBe(user);
    expect(lines[4]).toBe(validationRowFromOps(ops, isCorrect));
  });
});
