import { describe, it, expect } from 'vitest';
import { getSentencePrompts } from '../../src/utils/bilingualPrompt';
import type { SentenceItem } from '../../src/types';

const item: SentenceItem = {
  english: 'Hello',
  italian: 'Ciao',
  answer: 'こんにちは',
};

describe('getSentencePrompts', () => {
  it('returns Italian primary and English alternate when UI is IT', () => {
    expect(getSentencePrompts(item, 'it')).toEqual({ primary: 'Ciao', alternate: 'Hello' });
  });

  it('returns English primary and Italian alternate when UI is EN', () => {
    expect(getSentencePrompts(item, 'en')).toEqual({ primary: 'Hello', alternate: 'Ciao' });
  });

  it('omits alternate when identical to primary', () => {
    const same: SentenceItem = { english: 'Hi', italian: 'Hi', answer: 'x' };
    expect(getSentencePrompts(same, 'en').alternate).toBe('');
  });
});
