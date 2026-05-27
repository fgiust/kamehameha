import { describe, expect, it } from 'vitest';
import { hasAnswerTemplateIssues, validateAnswerTemplate } from '../src/validate';

describe('validateAnswerTemplate', () => {
  it('accepts valid templates with braces and furigana', () => {
    expect(validateAnswerTemplate('私[わたし]は図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます')).toEqual([]);
    expect(validateAnswerTemplate('{は|}{、|}ビザを取[と]ります')).toEqual([]);
  });

  it('reports unclosed braces and brackets', () => {
    expect(validateAnswerTemplate('私[わたし]は{本[ほん]').some(i => i.code === 'unclosed-brace')).toBe(true);
    expect(validateAnswerTemplate('私[わたし').some(i => i.code === 'unclosed-bracket')).toBe(true);
  });

  it('reports nested braces and brackets', () => {
    expect(validateAnswerTemplate('{a{|b}}').some(i => i.code === 'nested-brace')).toBe(true);
    expect(validateAnswerTemplate('図[と[しょ]]').some(i => i.code === 'nested-bracket')).toBe(true);
  });

  it('reports missing furigana on kanji', () => {
    expect(validateAnswerTemplate('図書館で読みます').some(i => i.code === 'missing-furigana')).toBe(true);
  });

  it('reports invalid ruby on kana-only surfaces', () => {
    expect(validateAnswerTemplate('{これ[は]|}何[なん]ですか').some(i => i.code === 'invalid-ruby')).toBe(true);
  });
});

describe('hasAnswerTemplateIssues', () => {
  it('returns true when issues exist', () => {
    expect(hasAnswerTemplateIssues('図書館')).toBe(true);
    expect(hasAnswerTemplateIssues('図[と]書[しょ]館[かん]')).toBe(false);
  });
});
