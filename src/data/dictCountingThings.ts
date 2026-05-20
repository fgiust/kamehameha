export type CountingThingCounter =
  | 'hiki'
  | 'tou'
  | 'mune'
  | 'satsu'
  | 'mai'
  | 'dai'
  | 'nin'
  | 'hai'
  | 'hon'
  | 'kai'
  | 'floor'
  | 'day'
  | 'month'
  | 'week'
  | 'hour'
  | 'minute'
  | 'second'
  | 'ko';

export type CountingThing = {
  id: string;
  en: [string, string];
  it: [string, string];
  nounRuby: string;
  counter: CountingThingCounter;
};

const countingThings: CountingThing[] = [
  { id: 'cat', en: ['cat', 'cats'], it: ['gatto', 'gatti'], nounRuby: '猫[ねこ]', counter: 'hiki' },
  { id: 'train', en: ['train', 'trains'], it: ['treno', 'treni'], nounRuby: '電車[でんしゃ]', counter: 'dai' },
  { id: 'rabbit', en: ['rabbit', 'rabbits'], it: ['coniglio', 'conigli'], nounRuby: '兎[うさぎ]', counter: 'hiki' },
  { id: 'horse', en: ['horse', 'horses'], it: ['cavallo', 'cavalli'], nounRuby: '馬[うま]', counter: 'tou' },
  { id: 'cow', en: ['cow', 'cows'], it: ['mucca', 'mucche'], nounRuby: '牛[うし]', counter: 'tou' },
  { id: 'fish', en: ['fish', 'fish'], it: ['pesce', 'pesci'], nounRuby: '魚[さかな]', counter: 'hiki' },
  { id: 'building', en: ['building', 'buildings'], it: ['edificio', 'edifici'], nounRuby: 'ビル', counter: 'mune' },
  { id: 'piano', en: ['piano', 'pianos'], it: ['pianoforte', 'pianoforti'], nounRuby: 'ピアノ', counter: 'dai' },
  { id: 'banana', en: ['banana', 'bananas'], it: ['banana', 'banane'], nounRuby: 'バナナ', counter: 'hon' },
  { id: 'photo', en: ['photo', 'photos'], it: ['foto', 'foto'], nounRuby: '写真[しゃしん]', counter: 'mai' },
  { id: 'pencil', en: ['pencil', 'pencils'], it: ['matita', 'matite'], nounRuby: '鉛筆[えんぴつ]', counter: 'hon' },
  { id: 'whale', en: ['whale', 'whales'], it: ['balena', 'balene'], nounRuby: '鯨[くじら]', counter: 'tou' },
  { id: 'passport', en: ['passport', 'passports'], it: ['passaporto', 'passaporti'], nounRuby: 'パッスポート', counter: 'satsu' },
  { id: 'snake', en: ['snake', 'snakes'], it: ['serpente', 'serpenti'], nounRuby: '蛇[へび]', counter: 'hiki' },
  { id: 'squid', en: ['squid', 'squids'], it: ['calamaro', 'calamari'], nounRuby: 'イカ', counter: 'hiki' },
  { id: 'building2', en: ['building', 'buildings'], it: ['edificio', 'edifici'], nounRuby: '建物[たてもの]', counter: 'mune' },
  { id: 'bicycle', en: ['bicycle', 'bicycles'], it: ['bicicletta', 'biciclette'], nounRuby: '自転車[じてんしゃ]', counter: 'dai' },
  { id: 'car', en: ['car', 'cars'], it: ['auto', 'auto'], nounRuby: '車[くるま]', counter: 'dai' },
  { id: 'book', en: ['book', 'books'], it: ['libro', 'libri'], nounRuby: '本[ほん]', counter: 'satsu' },
  { id: 'sheet', en: ['sheet of paper', 'sheets of paper'], it: ['foglio di carta', 'fogli di carta'], nounRuby: '紙[かみ]', counter: 'mai' },
  { id: 'shirt', en: ['shirt', 'shirts'], it: ['camicia', 'camicie'], nounRuby: 'シャツ', counter: 'mai' },
  { id: 'credit-card', en: ['credit card', 'credit cards'], it: ['carta di credito', 'carte di credito'], nounRuby: 'クレジットカード', counter: 'mai' },
  { id: 'glass', en: ['glass', 'glasses'], it: ['bicchiere', 'bicchieri'], nounRuby: 'コップ', counter: 'hai' },
  { id: 'owl', en: ['owl', 'owls'], it: ['gufo', 'gufi'], nounRuby: '梟[ふくろう]', counter: 'hiki' },
  { id: 'chicken', en: ['chicken', 'chickens'], it: ['pollo', 'polli'], nounRuby: '鶏[にわとり]', counter: 'hiki' },
  { id: 'elephant', en: ['elephant', 'elephants'], it: ['elefante', 'elefanti'], nounRuby: '象[ぞう]', counter: 'tou' },
  { id: 'computer', en: ['computer', 'computers'], it: ['computer', 'computer'], nounRuby: 'コンピューター', counter: 'dai' },
  { id: 'chopsticks', en: ['chopstick', 'chopsticks'], it: ['bacchetta', 'bacchette'], nounRuby: '箸[はし]', counter: 'hon' },
  { id: 'sake-cup', en: ['cup of sake', 'cups of sake'], it: ['tazzina di sakè', 'tazzine di sakè'], nounRuby: '酒[さけ]', counter: 'hai' },
  { id: 'balls', en: ['ball', 'balls'], it: ['palla', 'palle'], nounRuby: 'ボール', counter: 'ko' },
];

export default countingThings;
