export type JapaneseCounter = {
  counter: string;
  meaning: [string, string];
  readings: Array<string | string[]>;
  extraReadings?: Record<string, string | string[]>;
};

const counters: JapaneseCounter[] = [
  {
    counter: '匹[ひき]',
    meaning: ['animal', 'animals'],
    readings: ['いっぴき', 'にひき', 'さんびき', 'よんひき', 'ごひき', 'ろっぴき', ['ななひき', 'しちひき'], ['はちひき', 'はっぴき'], 'きゅうひき', ['じゅっぴき', 'じっぴき']],
  },
  {
    counter: '冊[さつ]',
    meaning: ['book', 'books'],
    readings: ['いっさつ', 'にさつ', 'さんさつ', 'よんさつ', 'ごさつ', 'ろくさつ', ['ななさつ', 'しちさつ'], ['はちさつ', 'はっさつ'], 'きゅうさつ', ['じゅっさつ', 'じっさつ']],
  },
  {
    counter: '羽[わ]',
    meaning: ['bird', 'birds'],
    readings: ['いちわ', 'にわ', ['さんわ', 'さんば'], ['よんわ', 'よんば', 'よわ'], 'ごわ', ['ろくわ', 'ろっぱ'], ['ななわ', 'しちわ'], ['はちわ', 'はっぱ'], 'きゅうわ', ['じゅうわ', 'じゅっぱ', 'じっぱ']],
  },
  {
    counter: '枚[まい]',
    meaning: ['flat object', 'flat objects'],
    readings: ['いちまい', 'にまい', 'さんまい', 'よんまい', 'ごまい', 'ろくまい', ['ななまい', 'しちまい'], 'はちまい', 'きゅうまい', 'じゅうまい'],
  },
  {
    counter: '頭[とう]',
    meaning: ['large animal', 'large animals'],
    readings: ['いっとう', 'にとう', 'さんとう', 'よんとう', 'ごとう', 'ろくとう', ['ななとう', 'しちとう'], ['はちとう', 'はっとう'], 'きゅうとう', ['じゅっとう', 'じっとう']],
  },
  {
    counter: '本[ほん]',
    meaning: ['long object', 'long objects'],
    readings: ['いっぽん', 'にほん', 'さんぼん', 'よんほん', 'ごほん', 'ろっぽん', ['ななほん', 'しちほん'], ['はちほん', 'はっぽん'], 'きゅうほん', ['じゅっぽん', 'じっぽん']],
  },
  {
    counter: '台[だい]',
    meaning: ['machine', 'machines'],
    readings: ['いちだい', 'にだい', 'さんだい', 'よんだい', 'ごだい', 'ろくだい', ['ななだい', 'しちだい'], 'はちだい', 'きゅうだい', 'じゅうだい'],
  },
  {
    counter: '人[にん]',
    meaning: ['person', 'people'],
    readings: ['ひとり', 'ふたり', 'さんにん', 'よにん', 'ごにん', 'ろくにん', ['しちにん', 'ななにん'], 'はちにん', ['くにん', 'きゅうにん'], 'じゅうにん'],
  },
  {
    counter: '個[こ]',
    meaning: ['small object', 'small objects'],
    readings: ['いっこ', 'にこ', 'さんこ', 'よんこ', 'ごこ', 'ろっこ', ['ななこ', 'しちこ'], ['はちこ', 'はっこ'], 'きゅうこ', ['じゅっこ', 'じっこ']],
  },
  {
    counter: 'つ',
    meaning: ['thing', 'things'],
    readings: ['ひとつ', 'ふたつ', 'みっつ', 'よっつ', 'いつつ', 'むっつ', 'ななつ', 'やっつ', 'ここのつ', 'とお'],
  },
  {
    counter: '回[かい]',
    meaning: ['time', 'times'],
    readings: ['いっかい', 'にかい', 'さんかい', 'よんかい', 'ごかい', 'ろっかい', ['ななかい', 'しちかい'], ['はちかい', 'はっかい'], 'きゅうかい', ['じゅっかい', 'じっかい']],
  },
  {
    counter: '歳[さい]',
    meaning: ['year old', 'years old'],
    readings: ['いっさい', 'にさい', 'さんさい', 'よんさい', 'ごさい', 'ろくさい', 'ななさい', 'はっさい', 'きゅうさい', 'じゅっさい'],
    extraReadings: { '20': 'はたち' },
  },
];

export default counters;
