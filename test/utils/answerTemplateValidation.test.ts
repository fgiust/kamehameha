import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  hasAnswerTemplateIssues,
  validateAnswerTemplate,
} from 'tenshindiff/validate';
import { parseTranslateSessionTxt } from '../../src/lessons/parseTranslateSessionTxt';

const dataDir = join(import.meta.dirname, '../../src/data');

describe('answerTemplateValidation', () => {
  describe('validateAnswerTemplate', () => {
    it('accepts valid templates with braces and furigana', () => {
      expect(validateAnswerTemplate('私[わたし]は図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます')).toEqual([]);
      expect(validateAnswerTemplate('{は|}{、|}ビザを取[と]ります')).toEqual([]);
      expect(validateAnswerTemplate('アメリカに行[い]く時[とき]{は|}{、|}ビザを取[と]ります')).toEqual([]);
    });

    it('reports unclosed braces and brackets', () => {
      const brace = validateAnswerTemplate('私[わたし]は{本[ほん]');
      expect(brace.some(i => i.code === 'unclosed-brace')).toBe(true);

      const bracket = validateAnswerTemplate('私[わたし');
      expect(bracket.some(i => i.code === 'unclosed-bracket')).toBe(true);
    });

    it('reports nested braces and brackets', () => {
      expect(validateAnswerTemplate('{a{|b}}').some(i => i.code === 'nested-brace')).toBe(true);
      expect(validateAnswerTemplate('図[と[しょ]]').some(i => i.code === 'nested-bracket')).toBe(true);
    });

    it('reports brace inside bracket', () => {
      expect(validateAnswerTemplate('x[{a|b}]').some(i => i.code === 'brace-inside-bracket')).toBe(true);
    });

    it('reports single-alternative brace groups', () => {
      expect(validateAnswerTemplate('{本[ほん]}を読[よ]みます').some(i => i.code === 'single-alternative')).toBe(true);
    });

    it('reports missing furigana on kanji', () => {
      const issues = validateAnswerTemplate('図書館で読みます');
      expect(issues.some(i => i.code === 'missing-furigana')).toBe(true);
    });

    it('validates each brace alternative for furigana', () => {
      const issues = validateAnswerTemplate('{図書館|本[ほん]}');
      expect(issues.some(i => i.code === 'missing-furigana' && i.message.includes('図書館'))).toBe(true);
      expect(issues.some(i => i.code === 'missing-furigana' && i.message.includes('本'))).toBe(false);
    });

    it('reports invalid ruby on kana-only surfaces', () => {
      const issues = validateAnswerTemplate('{これ[は]|}何[なん]ですか');
      expect(issues.some(i => i.code === 'invalid-ruby')).toBe(true);
    });
  });

  describe('lesson data files', () => {
    it('has valid answer templates in genki and sentence txt files', () => {
      const files = readdirSync(dataDir)
        .filter(name => /^genki-\d+-\d+\.txt$/.test(name) || /^sentence-.*\.txt$/.test(name))
        .sort();

      const violations: string[] = [];
      for (const name of files) {
        const text = readFileSync(join(dataDir, name), 'utf8');
        const session = parseTranslateSessionTxt({ id: 'test', text, sourceName: name });
        for (let i = 0; i < session.sentenceData.length; i++) {
          const answer = session.sentenceData[i]!.answer;
          const issues = validateAnswerTemplate(answer);
          for (const issue of issues) {
            violations.push(`${name} exercise ${i + 1}: [${issue.code}] ${issue.message}`);
          }
        }
      }

      expect(violations).toEqual([]);
    });
  });

  describe('hasAnswerTemplateIssues', () => {
    it('returns true when issues exist', () => {
      expect(hasAnswerTemplateIssues('図書館')).toBe(true);
      expect(hasAnswerTemplateIssues('図[と]書[しょ]館[かん]')).toBe(false);
    });
  });
});
