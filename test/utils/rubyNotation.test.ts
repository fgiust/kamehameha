import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  findInvalidRubyNotations,
  formatInvalidRubyNotation,
} from '../../src/utils/rubyNotation';

const dataDir = join(import.meta.dirname, '../../src/data');

function collectInvalidRubyInFile(relativePath: string, text: string): string[] {
  const messages: string[] = [];

  if (relativePath === 'genki_vocabulary.txt') {
    text.split(/\r?\n/).forEach((line, lineIdx) => {
      if (!line.trim() || !line.includes('\t')) return;
      const japanese = line.split('\t')[0]!;
      for (const issue of findInvalidRubyNotations(japanese)) {
        messages.push(`${relativePath}:${lineIdx + 1} ${formatInvalidRubyNotation(issue)}`);
      }
    });
    return messages;
  }

  text.split(/\r?\n/).forEach((line, lineIdx) => {
    if (!line.trim() || line.startsWith('#')) return;
    for (const issue of findInvalidRubyNotations(line)) {
      messages.push(`${relativePath}:${lineIdx + 1} ${formatInvalidRubyNotation(issue)}`);
    }
  });

  return messages;
}

describe('rubyNotation', () => {
  describe('findInvalidRubyNotations', () => {
    it('accepts furigana on kanji', () => {
      expect(findInvalidRubyNotations('私[わたし]は図[と]書[しょ]館[かん]')).toEqual([]);
      expect(findInvalidRubyNotations('お姉[ねえ]さん')).toEqual([]);
      expect(findInvalidRubyNotations('休[やす]み')).toEqual([]);
    });

    it('rejects furigana on kana-only surfaces', () => {
      const issues = findInvalidRubyNotations('{これ[は]|}何[なん]ですか');
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        surface: 'これ',
        reading: 'は',
        reason: 'surface-without-kanji',
      });
    });

    it('rejects furigana when okurigana precedes the bracket', () => {
      const issues = findInvalidRubyNotations('休み[やすみ]');
      expect(issues).toHaveLength(1);
      expect(issues[0]).toMatchObject({
        surface: '休み',
        reading: 'やすみ',
        reason: 'kana-before-bracket',
      });
    });

    it('ignores brace alternatives and English glosses in brackets', () => {
      expect(findInvalidRubyNotations('{です|だ}')).toEqual([]);
      expect(findInvalidRubyNotations('〜枚[まい]')).toEqual([]);
    });
  });

  describe('lesson data files', () => {
    it('has no invalid furigana in genki and sentence txt files', () => {
      const files = readdirSync(dataDir)
        .filter(name => /^genki-\d+-\d+\.txt$/.test(name) || /^sentence-.*\.txt$/.test(name))
        .sort();

      const violations = files.flatMap(name =>
        collectInvalidRubyInFile(name, readFileSync(join(dataDir, name), 'utf8')),
      );

      expect(violations).toEqual([]);
    });
  });

  describe('genki_vocabulary.txt', () => {
    it('has no invalid furigana in the Japanese column', () => {
      const violations = collectInvalidRubyInFile(
        'genki_vocabulary.txt',
        readFileSync(join(dataDir, 'genki_vocabulary.txt'), 'utf8'),
      );

      expect(violations).toEqual([]);
    });
  });
});
