import { describe, expect, it } from 'vitest';
import { diffSentenceAnswer } from '../src/diff';
import { validationRowFromOps } from '../src/fulltestCase';

describe('validationRowFromOps', () => {
  it('uses ー for user extra text and ＋ for template-only segments', () => {
    const user = 'カフェで';
    const answer = '時々[ときどき]カフェで';
    const ops = diffSentenceAnswer(user, answer);
    const row = validationRowFromOps(ops, false);

    expect(row.startsWith('＋＋[＋＋＋＋]')).toBe(true);
    expect(row.includes('ー')).toBe(false);
  });

  it('uses ＝ for correct-kana kanji units', () => {
    const user = 'たけし';
    const answer = '武[たけ]志[し]';
    const ops = diffSentenceAnswer(user, answer);
    const row = validationRowFromOps(ops, false);

    expect(row).toBe('＝[・・]＝[・]❌');
  });
});
