import { TranslateSessionData } from '../types';

export const genki02Lessons: TranslateSessionData[] = [
  {
    id: 'genki2-1',
    title: 'これ それ あれ どれ',
    sentenceData: [
      { answer: 'これは{いくら|なん円[えん]}{ですか|か}', english: 'How much is this?' },
      { answer: 'それは{三[さん]百[びゃく]円[えん]|300円[えん]|３００円[えん]}{です|だ}', english: 'That is 300 yen.' },
      { answer: 'あれは私[わたし]の辞[じ]書[しょ]{です|だ}', english: 'That over there is my dictionary.' },
    ],
  },
  {
    id: 'genki2-2',
    title: 'この/その/あの/どの + Noun',
    sentenceData: [
      { answer: 'この時[と]計[けい]は{いくら|なん円[えん]}{ですか|か}', english: 'How much is this watch?' },
      { answer: 'あの本[ほん]は{三[さん]千[ぜん]円[えん]|3000円[えん]}{です|だ}', english: 'That book over there is 3000 yen.' },
      { answer: 'そのかさは{二[に]千[せん]円[えん]|2000円[えん]}{です|だ}', english: 'That umbrella is 2000 yen.' },
      { answer: 'どのかばんが三[さん]千[ぜん]円[えん]{ですか|か}', english: 'Which bag is 3000 yen?' },
      { answer: 'このペンは私[わたし]の{です|だ}', english: 'This pen is mine.' },
    ],
  },
  {
    id: 'genki2-3',
    title: 'ここ そこ あそこ どこ',
    sentenceData: [
      { answer: 'トイレはどこ{ですか|か}', english: 'Where is the restroom?' },
      { answer: 'トイレはあそこ{です|だ}', english: 'The restroom is over there.' },
      { answer: '図[と]書[しょ]館[かん]はここ{です|だ}', english: 'The library is here.' },
      { answer: '郵[ゆう]便[びん]局[きょく]はそこ{です|だ}', english: 'The post office is right there.' },
    ],
  },
  {
    id: 'genki2-4',
    title: 'だれの Noun',
    sentenceData: [
      { answer: 'これはだれのかばん{ですか|か}', english: 'Whose bag is this?' },
      { answer: 'それはだれの辞[じ]書[しょ]{ですか|か}', english: 'Whose dictionary is that?' },
      { answer: 'あれはだれの本[ほん]{ですか|か}', english: 'Whose book is that over there?' },
      { answer: 'これはだれの電[でん]話[わ]{ですか|か}', english: 'Whose telephone is this?' },
    ],
  },
  {
    id: 'genki2-5',
    title: 'Noun も',
    sentenceData: [
      { answer: '私[わたし]も留[りゅう]学[がく]生[せい]{です|だ}', english: 'I am an international student, too.' },
      { answer: '山[やま]田[だ]さんも学[がく]生[せい]{です|だ}', english: 'Yamada is a student, too.' },
      { answer: '田[た]中[なか]さんの専[せん]攻[こう]も日[に]本[ほん]語[ご]{です|だ}', english: 'Tanaka\'s major is Japanese, too.' },
      { answer: 'スーさんの専[せん]攻[こう]も日[に]本[ほん]語[ご]{です|だ}', english: 'Sue\'s major is Japanese, too.' },
    ],
  },
  {
    id: 'genki2-6',
    title: 'Noun じゃないです',
    sentenceData: [
      { answer: '田[た]中[なか]さんは日[に]本[ほん]人[じん]{じゃないです|じゃありません|ではないです|ではありません}', english: 'Tanaka is not Japanese.' },
      { answer: 'これは私[わたし]のペン{じゃないです|じゃありません|ではないです|ではありません}', english: 'This is not my pen.' },
      { answer: '{私[わたし]は|}先[せん]生[せい]{じゃないです|じゃありません|ではないです|ではありません}', english: 'I am not a teacher.' },
      { answer: 'あれは肉[にく]{じゃないです|じゃありません|ではないです|ではありません}', english: 'That is not meat.' },
    ],
  },
  {
    id: 'genki2-7',
    title: '～ね/～よ',
    sentenceData: [
      { answer: 'このかばんは{高[たか]い|たかい}ですね', english: 'This bag is expensive, isn\'t it?' },
      { answer: '日[に]本[ほん]語[ご]の先[せん]生[せい]は{日本人[にほんじん]|にほんじん}ですよ', english: 'The Japanese teacher is Japanese, you know.' },
      { answer: 'この本[ほん]は{三[さん]千[ぜん]円[えん]|3000円[えん]}ですよ', english: 'This book is 3000 yen, you know.' },
      { answer: 'あれはおいしいですね', english: 'That is delicious, isn\'t it?' },
    ],
  },
];
