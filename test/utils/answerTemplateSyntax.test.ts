import { describe, expect, it } from 'vitest';
import {
  applyAnswerTemplateSyntaxInputChange,
  normalizeAnswerTemplateSyntax,
} from '../../src/utils/answerTemplateSyntax';

describe('normalizeAnswerTemplateSyntax', () => {
  it('maps fullwidth template delimiters to ASCII', () => {
    expect(normalizeAnswerTemplateSyntax('｛私[わたし]は|｝')).toBe('{私[わたし]は|}');
    expect(normalizeAnswerTemplateSyntax('［わたし］')).toBe('[わたし]');
    expect(normalizeAnswerTemplateSyntax('喫茶店｜カフェ')).toBe('喫茶店|カフェ');
    expect(normalizeAnswerTemplateSyntax('A±B')).toBe('A|B');
  });

  it('leaves other characters unchanged', () => {
    expect(normalizeAnswerTemplateSyntax('時々[ときどき]')).toBe('時々[ときどき]');
  });
});

describe('applyAnswerTemplateSyntaxInputChange', () => {
  it('preserves caret when normalizing before the cursor', () => {
    const raw = '｛私';
    const { value, caret } = applyAnswerTemplateSyntaxInputChange(raw, raw.length);
    expect(value).toBe('{私');
    expect(caret).toBe(2);
  });
});
