import { describe, expect, it } from 'vitest';
import genki01_2Text from '../data/genki-01-2.txt?raw';
import { parseTranslateSessionTxt } from './parseTranslateSessionTxt';
import { genkiTxtLessons } from './genkiTxtLessons';

describe('parseTranslateSessionTxt', () => {
  it('parses genki-01-2.txt into a bilingual TranslateSessionData', () => {
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
    const lesson = genkiTxtLessons.find(l => l.id === 'genki1-2');
    expect(lesson).toBeTruthy();
    expect(lesson?.title).toBe('Question');
    expect(lesson?.titleItalian).toBe('Domande');
    expect(lesson?.sentenceData).toHaveLength(10);
    expect(lesson?.sentenceData[0].italian).toBe('Sei uno studente?');
  });
});
