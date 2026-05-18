import { SentenceItem } from '../types';
import { genki01Lessons } from './genki01';
import { genki02Lessons } from './genki02';
import { genki03Lessons } from './genki03';
import { genki04Lessons } from './genki04';
import { genki05Lessons } from './genki05';
import { genki06Lessons } from './genki06';
import { genki07Lessons } from './genki07';
import { genki08Lessons } from './genki08';
import { genki09Lessons } from './genki09';
import { genki10Lessons } from './genki10';
import { genki11Lessons } from './genki11';
import { genki12Lessons } from './genki12';
import { genki13Lessons } from './genki13';
import { genki14Lessons } from './genki14';
import { genki15Lessons } from './genki15';
import { genki16Lessons } from './genki16';
import { genki17Lessons } from './genki17';
import { genki18Lessons } from './genki18';
import { genki19Lessons } from './genki19';
import { genki20Lessons } from './genki20';
import { genki21Lessons } from './genki21';
import { genki22Lessons } from './genki22';
import { genki23Lessons } from './genki23';

export interface GenkiLesson {
  id: string;
  title: string;
  sentenceData: SentenceItem[];
}

export const genkiLessons: GenkiLesson[] = [
  ...genki01Lessons,
  ...genki02Lessons,
  ...genki03Lessons,
  ...genki04Lessons,
  ...genki05Lessons,
  ...genki06Lessons,
  ...genki07Lessons,
  ...genki08Lessons,
  ...genki09Lessons,
  ...genki10Lessons,
  ...genki11Lessons,
  ...genki12Lessons,
  ...genki13Lessons,
  ...genki14Lessons,
  ...genki15Lessons,
  ...genki16Lessons,
  ...genki17Lessons,
  ...genki18Lessons,
  ...genki19Lessons,
  ...genki20Lessons,
  ...genki21Lessons,
  ...genki22Lessons,
  ...genki23Lessons,
];

// Genki lesson index structure for navigation
export interface GenkiLessonLink {
  id: string;
  title: string;
  type: 'sentence' | 'conjugation' | 'external' | 'vocab' | 'kanji';
  path?: string;
  externalUrl?: string;
  beta?: boolean;
  patreon?: boolean;
}

export interface GenkiChapter {
  lesson: number;
  links: GenkiLessonLink[];
}

export const genkiIChapters: GenkiChapter[] = [
  {
    lesson: 1, links: [
      { id: 'genki1-1', title: 'XはYです', type: 'sentence', path: '/genki/genki1-1' },
      { id: 'genki1-2', title: 'Question Sentences', type: 'sentence', path: '/genki/genki1-2' },
      { id: 'genki1-3', title: 'Noun1 の Noun2', type: 'sentence', path: '/genki/genki1-3' },
      { id: 'genki1-numbers', title: 'Numbers Practice', type: 'external', path: '/numbers' },
      { id: 'genki1-time', title: 'Time Practice', type: 'external', path: '/time' },
    ],
  },
  {
    lesson: 2, links: [
      { id: 'genki2-1', title: 'これ それ あれ どれ', type: 'sentence', path: '/genki/genki2-1' },
      { id: 'genki2-2', title: 'この その あの どの + Noun', type: 'sentence', path: '/genki/genki2-2' },
      { id: 'genki2-3', title: 'ここ そこ あそこ どこ', type: 'sentence', path: '/genki/genki2-3' },
      { id: 'genki2-4', title: 'だれの Noun', type: 'sentence', path: '/genki/genki2-4' },
      { id: 'genki2-5', title: 'Noun も', type: 'sentence', path: '/genki/genki2-5' },
      { id: 'genki2-6', title: 'Noun じゃないです', type: 'sentence', path: '/genki/genki2-6' },
      { id: 'genki2-7', title: '～ね ◦ ～よ', type: 'sentence', path: '/genki/genki2-7' },
    ],
  },
  {
    lesson: 3, links: [
      { id: 'genki3-1', title: 'Verb Conjugation', type: 'conjugation', path: '/politeform' },
      { id: 'genki3-2', title: 'Verb Types and Present Tense', type: 'sentence', path: '/genki/genki3-2' },
      { id: 'genki3-3', title: 'Particles', type: 'sentence', path: '/genki/genki3-3' },
      { id: 'genki3-4', title: 'Time Reference', type: 'sentence', path: '/genki/genki3-4' },
      { id: 'genki3-5', title: '～ませんか', type: 'sentence', path: '/genki/genki3-5' },
      { id: 'genki3-7', title: 'Frequency Adverbs', type: 'sentence', path: '/genki/genki3-7' },
    ],
  },
  {
    lesson: 4, links: [
      { id: 'genki4-1', title: 'Xがあります ◦ います', type: 'sentence', path: '/genki/genki4-1' },
      { id: 'genki4-2', title: 'Describing Where Things Are', type: 'sentence', path: '/genki/genki4-2' },
      { id: 'genki4-3', title: 'Past Tense of です', type: 'sentence', path: '/genki/genki4-3' },
      { id: 'genki4-4', title: 'Past Tense of Verbs', type: 'conjugation', path: '/pastform' },
      { id: 'genki4-5', title: 'も', type: 'sentence', path: '/genki/genki4-5' },
      { id: 'genki4-6', title: '一時間', type: 'sentence', path: '/genki/genki4-6' },
      { id: 'genki4-7', title: 'たくさん', type: 'sentence', path: '/genki/genki4-7' },
      { id: 'genki4-8', title: 'と', type: 'sentence', path: '/genki/genki4-8' },
    ],
  },
  {
    lesson: 5, links: [
      { id: 'genki5-1', title: 'Adjectives', type: 'sentence', path: '/genki/genki5-1' },
      { id: 'genki5-2', title: '好き ◦ きらい(な)', type: 'sentence', path: '/genki/genki5-2' },
      { id: 'genki5-3', title: '～ましょう ◦ ～ましょうか', type: 'sentence', path: '/genki/genki5-3' },
      { id: 'genki5-4', title: 'Counting', type: 'external', path: '/counters' },
    ],
  },
  {
    lesson: 6, links: [
      { id: 'genki6-1', title: 'Te-form', type: 'conjugation', path: '/teform' },
      { id: 'genki6-2', title: '～てください', type: 'sentence', path: '/genki/genki6-2' },
      { id: 'genki6-3', title: '～てもいいです', type: 'sentence', path: '/genki/genki6-3' },
      { id: 'genki6-4', title: '～てはいけません', type: 'sentence', path: '/genki/genki6-4' },
      { id: 'genki6-5', title: 'Describing Two Activities', type: 'sentence', path: '/genki/genki6-5' },
      { id: 'genki6-6', title: '～から', type: 'sentence', path: '/genki/genki6-6' },
      { id: 'genki6-7', title: '～ましょうか', type: 'sentence', path: '/genki/genki6-7' },
    ],
  },
  {
    lesson: 7, links: [
      { id: 'genki7-1', title: '～ている', type: 'sentence', path: '/genki/genki7-1' },
      { id: 'genki7-2', title: 'メアリーさんは髪が長いです', type: 'sentence', path: '/genki/genki7-2' },
      { id: 'genki7-3', title: 'Te-forms for Joining Sentences', type: 'sentence', path: '/genki/genki7-3' },
      { id: 'genki7-4', title: 'Verb Stem + に行', type: 'sentence', path: '/genki/genki7-4' },
      { id: 'genki7-5', title: 'Counting People', type: 'external', path: '/counters-people' },
    ],
  },
  {
    lesson: 8, links: [
      { id: 'genki8-1', title: 'Short Forms', type: 'conjugation', path: '/politeform?reverse=true' },
      { id: 'genki8-3', title: '～と思います ◦ ～と言ってました', type: 'sentence', path: '/genki/genki8-3' },
      { id: 'genki8-4', title: '～ないでください', type: 'sentence', path: '/genki/genki8-4' },
      { id: 'genki8-5', title: 'Verb のが好きです', type: 'sentence', path: '/genki/genki8-5' },
      { id: 'genki8-6', title: 'が', type: 'sentence', path: '/genki/genki8-6' },
      { id: 'genki8-7', title: '何か and 何も', type: 'sentence', path: '/genki/genki8-7' },
    ],
  },
  {
    lesson: 9, links: [
      { id: 'genki9-1v', title: 'Past Tense Short Forms (Verbs)', type: 'conjugation', path: '/pastform' },
      { id: 'genki9-1a', title: 'Past Tense Short Forms (Adjectives)', type: 'conjugation', path: '/adj-pastform' },
      { id: 'genki9-2', title: 'Qualifying Nouns with Verb and Adjectives', type: 'sentence', path: '/genki/genki9-2' },
      { id: 'genki9-3', title: 'まだ～ていません', type: 'sentence', path: '/genki/genki9-3' },
      { id: 'genki9-4', title: '～から', type: 'sentence', path: '/genki/genki9-4' },
    ],
  },
  {
    lesson: 10, links: [
      { id: 'genki10-1', title: 'Comparison Between Two Items', type: 'sentence', path: '/genki/genki10-1' },
      { id: 'genki10-2', title: 'Comparison Among Three or More Items', type: 'sentence', path: '/genki/genki10-2' },
      { id: 'genki10-3', title: 'Adjectives/Noun + の', type: 'sentence', path: '/genki/genki10-3' },
      { id: 'genki10-4', title: '～つもりだ', type: 'sentence', path: '/genki/genki10-4' },
      { id: 'genki10-5', title: 'Adjective + なる', type: 'conjugation', path: '/adj-naruform' },
      { id: 'genki10-6', title: 'どこかに ◦ どこにも', type: 'sentence', path: '/genki/genki10-6' },
      { id: 'genki10-7', title: 'で', type: 'sentence', path: '/genki/genki10-7' },
    ],
  },
  {
    lesson: 11, links: [
      { id: 'genki11-1', title: '～たい', type: 'sentence', path: '/genki/genki11-1' },
      { id: 'genki11-2', title: '～たり～たりする', type: 'sentence', path: '/genki/genki11-2' },
      { id: 'genki11-3', title: '～ことがある', type: 'sentence', path: '/genki/genki11-3' },
      { id: 'genki11-4', title: 'NounA や NounB', type: 'sentence', path: '/genki/genki11-4' },
    ],
  },
  {
    lesson: 12, links: [
      { id: 'genki12-1', title: '～んです', type: 'sentence', path: '/genki/genki12-1' },
      { id: 'genki12-2', title: '～すぎる', type: 'sentence', path: '/genki/genki12-2' },
      { id: 'genki12-3', title: '～ほうがいいです', type: 'sentence', path: '/genki/genki12-3' },
      { id: 'genki12-4', title: '～ので', type: 'sentence', path: '/genki/genki12-4' },
      { id: 'genki12-5', title: '～なければいけません ◦ ～なきゃいけません', type: 'sentence', path: '/genki/genki12-5' },
      { id: 'genki12-6', title: '～でしょう', type: 'sentence', path: '/genki/genki12-6' },
    ],
  },
];

export const genkiIIChapters: GenkiChapter[] = [
  {
    lesson: 13, links: [
      { id: 'genki13-1', title: 'Potential Verbs', type: 'conjugation', path: '/potentialform' },
      { id: 'genki13-2', title: '～し', type: 'sentence', path: '/genki/genki13-2' },
      { id: 'genki13-3', title: '～そうです (It looks like...)', type: 'sentence', path: '/genki/genki13-3' },
      { id: 'genki13-4', title: '～てみる', type: 'sentence', path: '/genki/genki13-4' },
      { id: 'genki13-5', title: 'なら', type: 'sentence', path: '/genki/genki13-5' },
      { id: 'genki13-6', title: '一週間に三回', type: 'sentence', path: '/genki/genki13-6' },
    ],
  },
  {
    lesson: 14, links: [
      { id: 'genki14-1', title: 'ほしい', type: 'sentence', path: '/genki/genki14-1' },
      { id: 'genki14-2', title: '～かもしれません', type: 'sentence', path: '/genki/genki14-2' },
      { id: 'genki14-3', title: 'あげる ◦ くれる ◦ もらう', type: 'sentence', path: '/genki/genki14-3' },
      { id: 'genki14-4', title: '～たらどうですか', type: 'sentence', path: '/genki/genki14-4' },
      { id: 'genki14-5', title: 'Number + も ◦ Number + しか + Negative', type: 'sentence', path: '/genki/genki14-5' },
    ],
  },
  {
    lesson: 15, links: [
      { id: 'genki15-1', title: 'Volitional Form', type: 'conjugation', path: '/volitionalform' },
      { id: 'genki15-2', title: 'Volitional Form + と思っています', type: 'sentence', path: '/genki/genki15-2' },
      { id: 'genki15-3', title: '～ておく', type: 'sentence', path: '/genki/genki15-3' },
      { id: 'genki15-4', title: 'Using Sentences to Qualify Nouns', type: 'sentence', path: '/genki/genki15-4' },
    ],
  },
  {
    lesson: 16, links: [
      { id: 'genki16-1', title: '～てあげる ◦ くれる ◦ もらう', type: 'sentence', path: '/genki/genki16-1' },
      { id: 'genki16-2', title: '～ていただけませんか', type: 'sentence', path: '/genki/genki16-2' },
      { id: 'genki16-3', title: '～といい', type: 'sentence', path: '/genki/genki16-3' },
      { id: 'genki16-4', title: '～時', type: 'sentence', path: '/genki/genki16-4' },
      { id: 'genki16-5', title: '～てすみませんでした', type: 'sentence', path: '/genki/genki16-5' },
    ],
  },
  {
    lesson: 17, links: [
      { id: 'genki17-1', title: '～そうです (I hear)', type: 'sentence', path: '/genki/genki17-1' },
      { id: 'genki17-2', title: '～って', type: 'sentence', path: '/genki/genki17-2' },
      { id: 'genki17-3', title: '～たら', type: 'sentence', path: '/genki/genki17-3' },
      { id: 'genki17-4', title: '～なくてもいいです', type: 'sentence', path: '/genki/genki17-4' },
      { id: 'genki17-5', title: '～みたいです', type: 'sentence', path: '/genki/genki17-5' },
      { id: 'genki17-6', title: '～前に ◦ ～てから', type: 'sentence', path: '/genki/genki17-6' },
    ],
  },
  {
    lesson: 18, links: [
      { id: 'genki18-1', title: 'Transitivity Pairs', type: 'sentence', path: '/genki/genki18-1' },
      { id: 'genki18-2', title: '～てしまう', type: 'sentence', path: '/genki/genki18-2' },
      { id: 'genki18-3', title: '～と', type: 'sentence', path: '/genki/genki18-3' },
      { id: 'genki18-4', title: '～ながら', type: 'sentence', path: '/genki/genki18-4' },
      { id: 'genki18-5', title: '～ばよかったです', type: 'sentence', path: '/genki/genki18-5' },
    ],
  },
  {
    lesson: 19, links: [
      { id: 'genki19-1', title: 'Honorific Verbs', type: 'sentence', path: '/genki/genki19-1' },
      { id: 'genki19-2', title: 'Giving Respectful Advice', type: 'sentence', path: '/genki/genki19-2' },
      { id: 'genki19-3', title: '～てくれてありがとう', type: 'sentence', path: '/genki/genki19-3' },
      { id: 'genki19-4', title: '～てよかったです', type: 'sentence', path: '/genki/genki19-4' },
      { id: 'genki19-5', title: '～はずです', type: 'sentence', path: '/genki/genki19-5' },
    ],
  },
  {
    lesson: 20, links: [
      { id: 'genki20-1', title: 'Extra-modest Expressions', type: 'sentence', path: '/genki/genki20-1' },
      { id: 'genki20-2', title: 'Humble Expressions', type: 'sentence', path: '/genki/genki20-2' },
      { id: 'genki20-3', title: '～ないで', type: 'sentence', path: '/genki/genki20-3' },
      { id: 'genki20-4', title: 'Questions Within Larger Sentences', type: 'sentence', path: '/genki/genki20-4' },
      { id: 'genki20-5', title: 'Name という Item', type: 'sentence', path: '/genki/genki20-5' },
      { id: 'genki20-6', title: '～やすい ◦ ～にくい', type: 'sentence', path: '/genki/genki20-6' },
    ],
  },
  {
    lesson: 21, links: [
      { id: 'genki21-1', title: 'Passive Sentences', type: 'sentence', path: '/genki/genki21-1' },
      { id: 'genki21-2', title: '～てある', type: 'sentence', path: '/genki/genki21-2' },
      { id: 'genki21-3', title: '～間に', type: 'sentence', path: '/genki/genki21-3' },
      { id: 'genki21-4', title: 'Adjective + する', type: 'sentence', path: '/genki/genki21-4' },
      { id: 'genki21-5', title: '～てほしい', type: 'sentence', path: '/genki/genki21-5' },
    ],
  },
  {
    lesson: 22, links: [
      { id: 'genki22-1', title: 'Causative Sentences', type: 'sentence', path: '/genki/genki22-1' },
      { id: 'genki22-2', title: 'Verb Stem + なさい', type: 'sentence', path: '/genki/genki22-2' },
      { id: 'genki22-3', title: '～ば', type: 'sentence', path: '/genki/genki22-3' },
      { id: 'genki22-4', title: '～のに', type: 'sentence', path: '/genki/genki22-4' },
      { id: 'genki22-5', title: '～のような ◦ ～のように', type: 'sentence', path: '/genki/genki22-5' },
    ],
  },
  {
    lesson: 23, links: [
      { id: 'genki23-1', title: 'Causative-passive Sentences', type: 'sentence', path: '/genki/genki23-1' },
      { id: 'genki23-2', title: '～ても', type: 'sentence', path: '/genki/genki23-2' },
      { id: 'genki23-3', title: '～ことにする', type: 'sentence', path: '/genki/genki23-3' },
      { id: 'genki23-4', title: '～まで', type: 'sentence', path: '/genki/genki23-4' },
      { id: 'genki23-5', title: '～方', type: 'sentence', path: '/genki/genki23-5' },
    ],
  },
];

export function getGenkiLessonById(id: string): GenkiLesson | undefined {
  return genkiLessons.find(l => l.id === id);
}
