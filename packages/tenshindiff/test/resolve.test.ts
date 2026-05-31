import { describe, expect, it } from 'vitest';
import { stripRuby } from '../src/ruby';
import { pickBestDiffFromTemplate, resolveAnswerFromTemplate } from '../src/resolve';

describe('resolveAnswerFromTemplate', () => {
  const template = '{|私[わたし]は}{喫茶店[きっさてん]|カフェ}で昼ご飯[ひるごはん]を食[た]べます';

  it('skips empty optional prefix and picks partial kana match for カフェ', () => {
    const user = 'カフィで昼ご飯を食べます';
    const answer = resolveAnswerFromTemplate(user, template);

    expect(stripRuby(answer)).toBe('カフェで昼ご飯を食べます');
    expect(answer).not.toContain('私');
    expect(answer).not.toContain('喫茶店');
  });

  it('matches the fulltests expected diff output', () => {
    const user = 'カフィで昼ご飯を食べます';
    const { ops } = pickBestDiffFromTemplate(user, template);

    const shown = ops
      .map(op => {
        if (op.kind === 'extra') return op.text;
        if (op.unit.kind === 'plain') return op.unit.surface;
        return `${op.unit.surface}[${op.unit.reading}]`;
      })
      .join('');

    expect(shown).toBe('カフィェで昼ご飯[ひるごはん]を食[た]べます');
  });
});
