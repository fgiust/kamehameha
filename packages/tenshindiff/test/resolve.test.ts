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

describe('empty optional segment', () => {
  const template =
    '{私[わたし]は|}中国人[ちゅうごくじん]{じゃないです|じゃありません|ではありません}';

  it('skips 私[わたし]は when the answer starts without it', () => {
    const user = '中国人じゃないです';
    const answer = resolveAnswerFromTemplate(user, template);
    expect(answer).toBe('中国人[ちゅうごくじん]じゃないです');
    const { ops } = pickBestDiffFromTemplate(user, template);
    expect(ops.every(op => !(op.kind === 'unit' && op.unit.surface === '私'))).toBe(true);
  });

  it('uses 私[わたし]は when the user partially matches that prefix', () => {
    const user = '私中国人じゃないです';
    const answer = resolveAnswerFromTemplate(user, template);
    expect(answer.startsWith('私[わたし]は')).toBe(true);
    const { ops } = pickBestDiffFromTemplate(user, template);
    expect(
      ops.some(op => op.kind === 'unit' && op.unit.surface === 'は' && op.status === 'missing'),
    ).toBe(true);
  });
});

describe('fixed segment before alternative', () => {
  const template =
    '{私[わたし]は|}時々[ときどき]{喫茶店[きっさてん]|カフェ}で{朝[あさ]ご飯[はん]|朝食[ちょうしょく]}を食[た]べます';

  it('picks exact カフェ after skipping empty 私 and missing 時々', () => {
    const user = 'カフェで朝ごはんを食べます';
    const answer = resolveAnswerFromTemplate(user, template);

    expect(answer).toBe('時々[ときどき]カフェで朝[あさ]ご飯[はん]を食[た]べます');
    expect(answer).not.toContain('喫茶店');

    const { ops } = pickBestDiffFromTemplate(user, template);
    const shown = ops
      .map(op => {
        if (op.kind === 'extra') return op.text;
        if (op.unit.kind === 'plain') return op.unit.surface;
        return `${op.unit.surface}[${op.unit.reading}]`;
      })
      .join('');
    expect(shown).toBe('時々[ときどき]カフェで朝[あさ]ご飯[はん]を食[た]べます');
    expect(ops.some(op => op.kind === 'extra' && op.text === 'カフェ')).toBe(false);
  });
});

describe('fixed segment with internal typo', () => {
  const template =
    'カルロスさんも{喫茶店[きっさてん]|カフェ}{に|へ}行[い]きました';

  it('still picks カフェ after カルス typo in the fixed prefix', () => {
    const user = 'カルスさんもカフェに行きました';
    const answer = resolveAnswerFromTemplate(user, template);

    expect(answer).toBe('カルロスさんもカフェに行[い]きました');
    expect(answer).not.toContain('喫茶店');

    const { ops } = pickBestDiffFromTemplate(user, template);
    expect(ops.some(op => op.kind === 'extra' && op.text.includes('カフェ'))).toBe(false);
    const shown = ops
      .map(op => {
        if (op.kind === 'extra') return op.text;
        if (op.unit.kind === 'plain') return op.unit.surface;
        return `${op.unit.surface}[${op.unit.reading}]`;
      })
      .join('');
    expect(shown).toBe('カルロスさんもカフェに行[い]きました');
  });
});

describe('single wrong character in fixed segment', () => {
  const template =
    'ウッディさんは{喫茶店[きっさてん]|カフェ}でスーさんを一時間半[いちじかんはん]待[ま]ちました';
  const options = { allowNumericalAlternatives: true };

  it('does not duplicate 一時間半 after a に/を typo', () => {
    const user = 'ウッディさんはカフェでスーさんにを1時間半待ちました';
    const { ops, bestAnswer } = pickBestDiffFromTemplate(user, template, options);
    const shown = ops
      .map(op => {
        if (op.kind === 'extra') return op.text;
        if (op.unit.kind === 'plain') return op.unit.surface;
        return `${op.unit.surface}[${op.unit.reading}]`;
      })
      .join('');

    expect(shown).toBe('ウッディさんはカフェでスーさんにを1時間半[いちじかんはん]待[ま]ちました');
    expect(shown).not.toContain('一時間半一時間半');
    expect(bestAnswer).toContain('[いちじかんはん]');
    expect(ops.some(op => op.kind === 'extra' && op.text.includes('一時間半'))).toBe(false);
  });

  it('does not mark ぐ as wrong when 三分 is the kanji error before ぐらい', () => {
    const template =
      'ゆいさんは毎日[まいにち]三十分[さんじゅっぷん]{くらい|ぐらい}日本語[にほんご]を勉強[べんきょう]します';
    const user = 'ゆいさんは毎日三分ぐらい日本語を勉強します';
    const options = { allowNumericalAlternatives: true as const };

    const { bestAnswer, ops } = pickBestDiffFromTemplate(user, template, options);
    const shown = ops
      .map(op => {
        if (op.kind === 'extra') return op.text;
        if (op.unit.kind === 'plain') return op.unit.surface;
        return `${op.unit.surface}[${op.unit.reading}]`;
      })
      .join('');

    expect(shown).toBe(
      'ゆいさんは毎日[まいにち]三分三十分[さんじゅっぷん]ぐらい日本語[にほんご]を勉強[べんきょう]します',
    );
    expect(shown).not.toContain('三分ぐ');
    expect(bestAnswer).toContain('ぐらい');
    expect(ops.some(op => op.kind === 'extra' && op.text.includes('ぐ'))).toBe(false);
  });
});

describe('optional 一緒に segment', () => {
  const template = '金曜日[きんようび]に{一緒[いっしょ]に|}ラーメンを食[た]べませんか';

  it('keeps 一緒に when typed and does not mark it as extra', () => {
    const user = '金曜日に一緒にラーメンを食べませんか';
    const answer = resolveAnswerFromTemplate(user, template);
    expect(answer).toBe('金曜日[きんようび]に一緒[いっしょ]にラーメンを食[た]べませんか');

    const { ops } = pickBestDiffFromTemplate(user, template);
    expect(ops.some(op => op.kind === 'extra')).toBe(false);
  });
});
