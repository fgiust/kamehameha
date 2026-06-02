import { describe, expect, it } from 'vitest';
import { generateAnswersFromTemplate } from '../src/answers';
import { gradeAnswer } from '../src/grade';
import {
  applyNumericalAlternatives,
  formatAsciiNumber,
  formatFullwidthNumber,
  formatKanjiNumber,
  parseNumberSpan,
} from '../src/numerals';
import { applyTemplateDiffOptions } from '../src/options';
import { pickBestDiffFromTemplate } from '../src/resolve';
import { matchesByRubyUnits } from '../src/ruby';

describe('numerals', () => {
  it('parses and formats kanji, ascii, and fullwidth numbers', () => {
    expect(parseNumberSpan('3')).toBe(3);
    expect(parseNumberSpan('３')).toBe(3);
    expect(parseNumberSpan('三')).toBe(3);
    expect(parseNumberSpan('十二')).toBe(12);
    expect(parseNumberSpan('5000')).toBe(5000);
    expect(parseNumberSpan('五千')).toBe(5000);

    expect(formatKanjiNumber(12)).toBe('十二');
    expect(formatAsciiNumber(12)).toBe('12');
    expect(formatFullwidthNumber(12)).toBe('１２');
    expect(formatKanjiNumber(5000)).toBe('五千');
  });

  it('wraps bare numbers outside brace groups', () => {
    expect(applyNumericalAlternatives('一週間[いっしゅうかん]')).toBe('{一|1|１}週間[いっしゅうかん]');
    expect(applyNumericalAlternatives('{3つ|三つ}[みっつ]')).toBe(
      '{3つ|三つ|３つ}[みっつ]',
    );
    expect(applyNumericalAlternatives('その{五千円|5000円}[ごせんえん]')).toBe(
      'その{五千円|5000円|５０００円}[ごせんえん]',
    );
  });
});

describe('allowNumericalAlternatives', () => {
  const template = '一週間[いっしゅうかん]に{3回[さんかい]|三回[さんかい]}行[い]きます';

  it('accepts ascii and fullwidth numbers when the template uses kanji', () => {
    const without = generateAnswersFromTemplate(template);
    expect(matchesByRubyUnits('1週間に3回行きます', without)).toBe(false);

    const withFlag = generateAnswersFromTemplate(template, { allowNumericalAlternatives: true });
    const rubyOpts = { allowNumericalAlternatives: true as const };
    expect(withFlag.some(a => matchesByRubyUnits('1週間に3回行きます', a, rubyOpts))).toBe(true);
    expect(withFlag.some(a => matchesByRubyUnits('１週間に３回行きます', a, rubyOpts))).toBe(true);
  });

  it('picks the matching number form in diff resolution', () => {
    const user = '1週間に三回行きました';
    const { bestAnswer } = pickBestDiffFromTemplate(user, template, { allowNumericalAlternatives: true });
    expect(bestAnswer).toContain('1週間');
    expect(bestAnswer).toContain('三回');
    expect(bestAnswer).not.toContain('喫茶店');
  });

  it('grades 5000円 when the template only has kanji', () => {
    const yenTemplate = 'その鞄[かばん]は五千円[ごせんえん]でした';
    const { isCorrect } = gradeAnswer('その鞄は5000円でした', yenTemplate, {
      allowNumericalAlternatives: true,
    });
    expect(isCorrect).toBe(true);
  });

  it('leaves templates unchanged when the flag is off', () => {
    expect(applyTemplateDiffOptions('三つ[みっつ]', {})).toBe('三つ[みっつ]');
  });
});
