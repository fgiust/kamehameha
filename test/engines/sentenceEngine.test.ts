import { describe, it, expect } from 'vitest';
import {
  diffSentenceAnswer,
  generateAnswers,
  parseAnswerTemplate,
  parseRubyUnits,
  pickBestDiff,
  primarySurfaceFromTemplate,
  stripRuby,
} from '../../src/engines/sentenceEngine';

describe('sentenceEngine', () => {
  describe('primarySurfaceFromTemplate', () => {
    it('picks first alternatives and strips ruby readings', () => {
      const template = '{私[わたし]は|}図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます';
      expect(primarySurfaceFromTemplate(template)).toBe('私は図書館で本を読みます');
    });
  });

  describe('pickBestDiff', () => {
    it('uses the alternative that matches exactly', () => {
      const alternatives = generateAnswers(parseAnswerTemplate('{です|だ}'));
      const { bestAnswer } = pickBestDiff('だ', alternatives);
      expect(stripRuby(bestAnswer)).toBe('だ');
    });

    it('picks the first-configured alternative on partial input when match count ties', () => {
      const template = '{武[たけ]志[し]さんは|}先生[せんせい]{です|だ}';
      const alternatives = generateAnswers(parseAnswerTemplate(template));
      const { bestAnswer } = pickBestDiff('たけしさん', alternatives);
      expect(stripRuby(bestAnswer)).toBe('武志さんは先生です');
    });

    it('uses the first-configured alternative when there is no alignment', () => {
      const alternatives = generateAnswers(parseAnswerTemplate('{です|だ}'));
      expect(stripRuby(pickBestDiff('', alternatives).bestAnswer)).toBe('です');
      expect(stripRuby(pickBestDiff('まったく違う', alternatives).bestAnswer)).toBe('です');
    });

    it('uses the first ending option when the user omits です|だ (好き)', () => {
      const alternatives = generateAnswers(parseAnswerTemplate('好[す]き{です|だ}'));
      const { bestAnswer } = pickBestDiff('好き', alternatives);
      expect(stripRuby(bestAnswer)).toBe('好きです');
    });

    it('prefers the empty optional prefix when the answer aligns without it', () => {
      const template =
        '{私[わたし]は|}たくさん勉強[べんきょう]したし、アニメをたくさん見[み]たし、日本語[にほんご]が上手[じょうず]になりました';
      const alternatives = generateAnswers(parseAnswerTemplate(template));
      const user = 'たくさん勉強したし、あにめをたくさん見たし、日本語が上手になりました';
      const { bestAnswer, ops } = pickBestDiff(user, alternatives);

      expect(stripRuby(bestAnswer)).toBe(
        'たくさん勉強したし、アニメをたくさん見たし、日本語が上手になりました',
      );
      expect(ops.some(op => op.kind === 'unit' && op.unit.surface === '私' && op.status === 'missing')).toBe(
        false,
      );
    });

    it('still diffs against the chosen alternative', () => {
      const template = '{武[たけ]志[し]さんは|}先生[せんせい]{です|だ}';
      const alternatives = generateAnswers(parseAnswerTemplate(template));
      const { ops } = pickBestDiff('たけしさん', alternatives);

      expect(ops).toEqual([
        { kind: 'unit', unit: { kind: 'ruby', surface: '武', reading: 'たけ' }, status: 'correct_kana' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '志', reading: 'し' }, status: 'correct_kana' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'さ', reading: 'さ' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'ん', reading: 'ん' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'は', reading: 'は' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '先生', reading: 'せんせい' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'で', reading: 'で' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'す', reading: 'す' }, status: 'missing' },
      ]);
    });

    it('uses the first ending when the user stops before です|だ (genki-style sentence)', () => {
      const template =
        '彼[かの]女[じょ]は綺[き]麗[れい]だし、{賢[かしこ]い|頭[あたま]がいい}し、大[だい]好[す]き{です|だ}{|。}';
      const alternatives = generateAnswers(parseAnswerTemplate(template));
      const user = '彼女は綺麗だし、賢いし、大好き';
      const { bestAnswer } = pickBestDiff(user, alternatives);
      expect(stripRuby(bestAnswer)).toBe('彼女は綺麗だし、賢いし、大好きです');
    });

    it('prefers the primary optional segment on partial overlap (私の vs あなたの)', () => {
      const template = 'それは{あなたの|}新聞[しんぶん]ですか';
      const alternatives = generateAnswers(parseAnswerTemplate(template));
      const user = 'それは私の新聞ですか';
      const primaryOps = diffSentenceAnswer(user, alternatives[0]!);
      const { bestAnswer, ops } = pickBestDiff(user, alternatives);

      expect(stripRuby(bestAnswer)).toBe('それはあなたの新聞ですか');
      expect(ops).toEqual(primaryOps);
    });

    it('uses the primary optional segment when optional input has no overlap (さ vs あなたの)', () => {
      const template = 'それは{あなたの|}新聞[しんぶん]ですか';
      const alternatives = generateAnswers(parseAnswerTemplate(template));
      const user = 'それはさ新聞ですか';
      const { bestAnswer, ops } = pickBestDiff(user, alternatives);

      expect(stripRuby(bestAnswer)).toBe('それはあなたの新聞ですか');
      expect(ops.some(op => op.kind === 'extra' && op.text === 'さ')).toBe(true);
      expect(ops.some(op => op.kind === 'unit' && op.unit.surface === 'あ' && op.status === 'missing')).toBe(true);
      expect(ops.some(op => op.kind === 'unit' && op.unit.surface === 'の' && op.status === 'missing')).toBe(true);
    });
  });

  describe('diffSentenceAnswer', () => {
    it('should handle correct kanji matching perfectly', () => {
      // User typed "佐藤さん和先生です", correct is "佐[さ]藤[とう]さんは先[せん]生[せい]です"
      const correct = '佐[さ]藤[とう]さんは先[せん]生[せい]です';
      const user = '佐藤さん和先生です';
      const ops = diffSentenceAnswer(user, correct);

      // Expected output:
      // 佐[さ] (kanji) - green
      // 藤[とう] (kanji) - green
      // さ (kanji) - green
      // ん (kanji) - green
      // 和 (extra) - red
      // は (missing) - white
      // 先[せん] (kanji) - green
      // 生[せい] (kanji) - green
      // で (kanji) - green
      // す (kanji) - green
      expect(ops).toEqual([
        { kind: 'unit', unit: { kind: 'ruby', surface: '佐', reading: 'さ' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '藤', reading: 'とう' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'さ', reading: 'さ' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'ん', reading: 'ん' }, status: 'correct_kanji' },
        { kind: 'extra', text: '和' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'は', reading: 'は' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '先', reading: 'せん' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '生', reading: 'せい' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'で', reading: 'で' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'す', reading: 'す' }, status: 'correct_kanji' },
      ]);
    });

    it('should handle correct kana matching with yellow kanji', () => {
      // Correct is "伊[い]藤[とう]", user typed "いとう"
      const correct = '伊[い]藤[とう]';
      const user = 'いとう';
      const ops = diffSentenceAnswer(user, correct);

      expect(ops).toEqual([
        { kind: 'unit', unit: { kind: 'ruby', surface: '伊', reading: 'い' }, status: 'correct_kana' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '藤', reading: 'とう' }, status: 'correct_kana' },
      ]);
    });

    it('should handle partial reading (extra and missing)', () => {
      // User typed "いと", correct is "伊[い]藤[とう]"
      const correct = '伊[い]藤[とう]';
      const user = 'いと';
      const ops = diffSentenceAnswer(user, correct);

      expect(ops).toEqual([
        { kind: 'unit', unit: { kind: 'ruby', surface: '伊', reading: 'い' }, status: 'correct_kana' },
        { kind: 'extra', text: 'と' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '藤', reading: 'とう' }, status: 'missing' },
      ]);
    });

    it('should align passive かま with かまれました (first ま, not second)', () => {
      const correct = '私[わたし]は犬[いぬ]に噛[か]まれました';
      const user = '私は犬にかま';
      const ops = diffSentenceAnswer(user, correct);

      expect(ops).toEqual([
        { kind: 'unit', unit: { kind: 'ruby', surface: '私', reading: 'わたし' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'は', reading: 'は' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '犬', reading: 'いぬ' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'に', reading: 'に' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'ruby', surface: '噛', reading: 'か' }, status: 'correct_kana' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'ま', reading: 'ま' }, status: 'correct_kanji' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'れ', reading: 'れ' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'ま', reading: 'ま' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'し', reading: 'し' }, status: 'missing' },
        { kind: 'unit', unit: { kind: 'plain', surface: 'た', reading: 'た' }, status: 'missing' },
      ]);
    });

    it('should keep ruby tags unaltered even with messy input', () => {
      const correct = '私[わたし]の名[な]前[まえ]は田[た]中[なか]さんは日[に]本[ほん]人[じん]です';
      const user = '私の名前は田田中きんはに日本人です';
      const ops = diffSentenceAnswer(user, correct);

      // Verify that no unit was split or altered.
      const correctUnits = [
        { kind: 'ruby', surface: '私', reading: 'わたし' },
        { kind: 'plain', surface: 'の', reading: 'の' },
        { kind: 'ruby', surface: '名', reading: 'な' },
        { kind: 'ruby', surface: '前', reading: 'まえ' },
        { kind: 'plain', surface: 'は', reading: 'は' },
        { kind: 'ruby', surface: '田', reading: 'た' },
        { kind: 'ruby', surface: '中', reading: 'なか' },
        { kind: 'plain', surface: 'さ', reading: 'さ' },
        { kind: 'plain', surface: 'ん', reading: 'ん' },
        { kind: 'plain', surface: 'は', reading: 'は' },
        { kind: 'ruby', surface: '日', reading: 'に' },
        { kind: 'ruby', surface: '本', reading: 'ほん' },
        { kind: 'ruby', surface: '人', reading: 'じん' },
        { kind: 'plain', surface: 'で', reading: 'で' },
        { kind: 'plain', surface: 'す', reading: 'す' },
      ];

      const returnedUnits = ops.filter(o => o.kind === 'unit').map(o => (o.kind === 'unit' ? o.unit : null));
      expect(returnedUnits).toEqual(correctUnits);
    });
  });

  describe('parseRubyUnits', () => {
    it('groups furigana over digit + kanji counters', () => {
      expect(parseRubyUnits('１年[いちねん]')).toEqual([
        { kind: 'ruby', surface: '１年', reading: 'いちねん' },
      ]);
      expect(parseRubyUnits('1年[いちねん]')).toEqual([
        { kind: 'ruby', surface: '1年', reading: 'いちねん' },
      ]);
      expect(parseRubyUnits('１週間[いっしゅうかん]')).toEqual([
        { kind: 'ruby', surface: '１週間', reading: 'いっしゅうかん' },
      ]);
      expect(parseRubyUnits('5000円[えん]')).toEqual([
        { kind: 'ruby', surface: '5000円', reading: 'えん' },
      ]);
    });

    it('still attaches furigana only to trailing kanji when no leading digits', () => {
      expect(parseRubyUnits('私[わたし]は')).toEqual([
        { kind: 'ruby', surface: '私', reading: 'わたし' },
        { kind: 'plain', surface: 'は', reading: 'は' },
      ]);
    });
  });
});
