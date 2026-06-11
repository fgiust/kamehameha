export type SpeechTestPhrase = {
  japanese: string;
  en: string;
  it: string;
};

/** Homophone-heavy phrases for comparing kanji vs kana TTS on the user's device. */
export const speechTestPhrases: SpeechTestPhrase[] = [
  {
    japanese: '*雨[あめ]*が降[ふ]っている間[あいだ]に*飴[あめ]*を食[た]べた',
    en: 'While it was raining, I ate candy.',
    it: 'Mentre pioveva, ho mangiato una caramella.',
  },
  {
    japanese: 'この*花[はな]は鼻[はな]*にいい匂[にお]いがします',
    en: 'This flower smells good to the nose.',
    it: 'Questo fiore ha un buon profumo per il naso.',
  },
  {
    japanese: '*神[かみ]*の*髪[かみ]*は*紙[かみ]*のように白[しろ]い',
    en: "God's hair is as white as paper.",
    it: 'I capelli di un dio sono bianchi come la carta.',
  },
  {
    japanese: '*橋[はし]*の*端[はし]*で*箸[はし]*を使[つか]いました',
    en: 'I used chopsticks at the edge of the bridge.',
    it: "Ho usato le bacchette all'estremità del ponte.",
  },
  {
    japanese: '店[みせ]で何[なに]か*買[か]*いましたか',
    en: 'Did you buy something at the store?',
    it: 'Hai comprato qualcosa al negozio?',
  },
];
