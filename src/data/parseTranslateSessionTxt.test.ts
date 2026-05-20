import { describe, expect, it } from 'vitest';
import genki01_2Text from './genki-01-2.txt?raw';
import { parseTranslateSessionTxt } from './parseTranslateSessionTxt';

describe('parseTranslateSessionTxt', () => {
  it('parses genki-01-2.txt into a bilingual TranslateSessionData', () => {
    const session = parseTranslateSessionTxt({ id: 'genki1-2', text: genki01_2Text, sourceName: 'genki-01-2.txt' });

    expect(session.id).toBe('genki1-2');
    expect(session.title).toBe('Question Sentences');
    expect(session.titleItalian).toBe('Fare domande');
    expect(session.sentenceData).toHaveLength(3);
    expect(session.sentenceData[0]).toMatchObject({
      english: 'Is Nakamura a student?',
      italian: 'Nakamura è uno studente?',
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
});
