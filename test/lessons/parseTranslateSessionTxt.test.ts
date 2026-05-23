import { describe, expect, it } from 'vitest';
import genki01_2Text from '../fixtures/data/genki-01-2.txt?raw';
import { parseTranslateSessionTxt } from '../../src/lessons/parseTranslateSessionTxt';
import { genkiTxtLessons } from '../../src/lessons/genkiTxtLessons';

describe('parseTranslateSessionTxt', () => {
  it('parses genki-01-2 fixture into a bilingual TranslateSessionData', () => {
    const session = parseTranslateSessionTxt({ id: 'genki1-2', text: genki01_2Text, sourceName: 'genki-01-2.txt' });

    expect(session.id).toBe('genki1-2');
    expect(session.title).toBe('Question');
    expect(session.titleItalian).toBe('Domande');
    expect(session.sentenceData).toHaveLength(10);
    expect(session.sentenceData[0]).toMatchObject({
      english: 'Are you a student?',
      italian: 'Sei uno studente?',
    });
  });

  it('ignores blocks that contain commented lines and validates block length', () => {
    const input = [
      'Title EN',
      'Title IT',
      '',
      '# Commented exercise',
      'Should be ignored',
      'Should be ignored',
      '',
      'A',
      'B',
      'C',
      '',
    ].join('\n');

    const session = parseTranslateSessionTxt({ id: 'x', text: input });
    expect(session.sentenceData).toHaveLength(1);

    const invalid = ['Title EN', 'Title IT', '', 'Only one line'].join('\n');
    expect(() => parseTranslateSessionTxt({ id: 'y', text: invalid })).toThrow(/exactly 3 lines/i);
  });

  it('auto-detects Genki txt lessons via virtual module', () => {
    expect(genkiTxtLessons.length).toBeGreaterThan(0);

    for (const lesson of genkiTxtLessons) {
      expect(lesson.id).toMatch(/^genki\d+-\d+$/);
      expect(lesson.title.length).toBeGreaterThan(0);
      expect(lesson.titleItalian.length).toBeGreaterThan(0);
      expect(lesson.sentenceData.length).toBeGreaterThan(0);
      for (const sentence of lesson.sentenceData) {
        expect(sentence.english.length).toBeGreaterThan(0);
        expect(sentence.italian.length).toBeGreaterThan(0);
      }
    }

    const ids = genkiTxtLessons.map(l => l.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
