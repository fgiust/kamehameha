export type JapaneseCounter = {
  counter: string;
  en: [string, string];
  it: [string, string];
  readings: Array<string | string[]>;
  extraReadings?: Record<string, string | string[]>;
};

const counters: JapaneseCounter[] = [
  {
    counter: '匹[ひき]',
    en: ['animal', 'animals'],
    it: ['animale', 'animali'],
    readings: ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', ['ななひき', 'しちひき'], ['はちひき', 'はっぴき'], 'きゅうひき', ['じゅっぴき', 'じっぴき']],
  },
  {
    counter: '冊[さつ]',
    en: ['book', 'books'],
    it: ['libro', 'libri'],
    readings: ['いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', ['ななさつ', 'しちさつ'], ['はちさつ', 'はっさつ'], 'きゅうさつ', ['じゅっさつ', 'じっさつ']],
  },
  {
    counter: '羽[わ]',
    en: ['bird', 'birds'],
    it: ['uccello', 'uccelli'],
    readings: ['いちわ', 'にわ', ['さんわ', 'さんば'], ['よんわ', 'よんば', 'よわ'], 'ごわ', ['ろくわ', 'ろっぱ'], ['ななわ', 'しちわ'], ['はちわ', 'はっぱ'], 'きゅうわ', ['じゅうわ', 'じゅっぱ', 'じっぱ']],
  },
  {
    counter: '枚[まい]',
    en: ['flat object', 'flat objects'],
    it: ['oggetto piatto', 'oggetti piatti'],
    readings: ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', ['ななまい', 'しちまい'], 'はちまい', 'きゅうまい', 'じゅうまい'],
  },
  {
    counter: '頭[とう]',
    en: ['large animal', 'large animals'],
    it: ['animale grande', 'animali grandi'],
    readings: ['いっとう', 'にとう', 'さんとう', 'よんとう', 'ごとう', 'ろくとう', ['ななとう', 'しちとう'], ['はちとう', 'はっとう'], 'きゅうとう', ['じゅっとう', 'じっとう']],
  },
  {
    counter: '本[ほん]',
    en: ['long object', 'long objects'],
    it: ['oggetto lungo', 'oggetti lunghi'],
    readings: ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', ['ななほん', 'しちほん'], ['はちほん', 'はっぽん'], 'きゅうほん', ['じゅっぽん', 'じっぽん']],
  },
  {
    counter: '台[だい]',
    en: ['machine', 'machines'],
    it: ['macchina', 'macchine'],
    readings: ['いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', ['ななだい', 'しちだい'], 'はちだい', 'きゅうだい', 'じゅうだい'],
  },
  {
    counter: '人[にん]',
    en: ['person', 'people'],
    it: ['persona', 'persone'],
    readings: ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', ['しちにん', 'ななにん'], 'はちにん', ['くにん', 'きゅうにん'], 'じゅうにん'],
  },
  {
    counter: '個[こ]',
    en: ['small object', 'small objects'],
    it: ['oggetto piccolo', 'oggetti piccoli'],
    readings: ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', ['ななこ', 'しちこ'], ['はちこ', 'はっこ'], 'きゅうこ', ['じゅっこ', 'じっこ']],
  },
  {
    counter: 'つ',
    en: ['thing', 'things'],
    it: ['cosa', 'cose'],
    readings: ['ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'],
  },
  {
    counter: '回[かい]',
    en: ['time', 'times'],
    it: ['volta', 'volte'],
    readings: ['いっかい', 'にかい', 'さんかい', 'よんかい', 'ごかい', 'ろっかい', ['ななかい', 'しちかい'], ['はちかい', 'はっかい'], 'きゅうかい', ['じゅっかい', 'じっかい']],
  },
  {
    counter: '歳[さい]',
    en: ['year old', 'years old'],
    it: ['anno di età', 'anni di età'],
    readings: ['いっさい', 'にさい', 'さんさい', 'よんさい', 'ごさい', 'ろくさい', 'ななさい', 'はっさい', 'きゅうさい', 'じゅっさい'],
    extraReadings: { '20': 'はたち' },
  },
];

export default counters;
