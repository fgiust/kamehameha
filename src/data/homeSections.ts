import adjectives from './dictConjugationAdjectives';
import counters from './dictCounters';
import { genkiLessons, getGenkiLessonById } from '../lessons/genkiLessons';
import { getReadingTxtLessonById } from '../lessons/readingTxtLessons';
import { getSentenceTxtLessonById, sentenceTxtLessons } from '../lessons/sentenceTxtLessons';
import { transitiveData } from './dictTransitivePairs';
import verbs from './dictConjugationVerbs';
import { CONJUGATION_SESSION_TARGET_TOTAL, DEFAULT_MASTERY_RANDOM_TOTAL, HomeConfig } from '../types';

const VERB_TOTAL = verbs.length;
const ADJ_TOTAL = adjectives.length;
const VERB_CONJ_TOTAL = Math.min(VERB_TOTAL, CONJUGATION_SESSION_TARGET_TOTAL);
const ADJ_CONJ_TOTAL = Math.min(ADJ_TOTAL, CONJUGATION_SESSION_TARGET_TOTAL);
const COUNTERS_DEFAULT_TOTAL = Math.min(
  CONJUGATION_SESSION_TARGET_TOTAL,
  counters.reduce((acc, c) => acc + Object.keys(c.readings).length, 0)
);
const COUNTERS_PEOPLE_TOTAL = (() => {
  const c = counters.find(x => x.en[1] === 'people');
  if (!c) return 0;
  return Math.min(CONJUGATION_SESSION_TARGET_TOTAL, Object.keys(c.readings).length);
})();
const TRANSITIVE_TOTAL = transitiveData.length;
const DAYS_TOTAL = getReadingTxtLessonById('reading-days')?.items.length ?? 31;
const FAMILY_NAMES_TOTAL = getReadingTxtLessonById('reading-familynames')?.items.length ?? 0;
const ADJECTIVES_NOUNS_TOTAL = getSentenceTxtLessonById('sentence-adjectivenouns')?.sentenceData.length ?? 0;
const COUNTING_THINGS_TOTAL = 30;

const genkiSentenceExercises = Object.fromEntries(
  genkiLessons.map(l => ([
    l.id,
    { id: l.id, title: l.title, to: `/genki/${l.id}`, defaultTotal: l.sentenceData.length },
  ]))
);

const sentenceTxtExercises = Object.fromEntries(
  sentenceTxtLessons.map(l => ([
    l.id,
    { id: l.id, title: l.title, to: `/sentence/${l.id}`, defaultTotal: l.sentenceData.length },
  ]))
);

function genkiSectionTitle(lesson: number) {
  const bookLabel = lesson <= 12 ? 'Genki I' : 'Genki II';
  return { key: 'genki.lessonTitle', values: { book: bookLabel, lesson } };
}

export const homeConfig: HomeConfig = {
  exercises: {
    ...genkiSentenceExercises,
    ...sentenceTxtExercises,

    teform: { id: 'teform', title: { key: 'forms.te' }, to: '/teform', defaultTotal: VERB_CONJ_TOTAL },
    causativeform: { id: 'causativeform', title: { key: 'forms.causative' }, to: '/causativeform', defaultTotal: VERB_CONJ_TOTAL },
    conditionalform: { id: 'conditionalform', title: { key: 'forms.conditional' }, to: '/conditionalform', defaultTotal: VERB_CONJ_TOTAL },
    imperativeform: { id: 'imperativeform', title: { key: 'forms.imperative' }, to: '/imperativeform', defaultTotal: VERB_CONJ_TOTAL },
    negativeform: { id: 'negativeform', title: { key: 'forms.negative' }, to: '/negativeform', defaultTotal: VERB_CONJ_TOTAL },
    passiveform: { id: 'passiveform', title: { key: 'forms.passive' }, to: '/passiveform', defaultTotal: VERB_CONJ_TOTAL },
    pastform: { id: 'pastform', title: { key: 'forms.past' }, to: '/pastform', defaultTotal: VERB_CONJ_TOTAL },
    politeform: { id: 'politeform', title: { key: 'forms.polite' }, to: '/politeform', defaultTotal: VERB_CONJ_TOTAL },
    'politeform-short': { id: 'politeform-short', title: { key: 'forms.short' }, to: '/politeform-short', defaultTotal: VERB_CONJ_TOTAL },
    potentialform: { id: 'potentialform', title: { key: 'forms.potential' }, to: '/potentialform', defaultTotal: VERB_CONJ_TOTAL },
    provisionalform: { id: 'provisionalform', title: { key: 'forms.provisional' }, to: '/provisionalform', defaultTotal: VERB_CONJ_TOTAL },
    volitionalform: { id: 'volitionalform', title: { key: 'forms.volitional' }, to: '/volitionalform', defaultTotal: VERB_CONJ_TOTAL },
    randomize: { id: 'randomize', title: { key: 'forms.randomized' }, to: '/randomize', defaultTotal: VERB_CONJ_TOTAL },

    'adj-naruform': { id: 'adj-naruform', title: { key: 'forms.naru' }, to: '/adj-naruform', defaultTotal: ADJ_CONJ_TOTAL },
    'adj-conditionalform': { id: 'adj-conditionalform', title: { key: 'forms.conditional' }, to: '/adj-conditionalform', defaultTotal: ADJ_CONJ_TOTAL },
    'adj-negativeform': { id: 'adj-negativeform', title: { key: 'forms.negative' }, to: '/adj-negativeform', defaultTotal: ADJ_CONJ_TOTAL },
    'adj-pastform': { id: 'adj-pastform', title: { key: 'forms.past' }, to: '/adj-pastform', defaultTotal: ADJ_CONJ_TOTAL },
    'adj-volitionalform': { id: 'adj-volitionalform', title: { key: 'forms.volitional' }, to: '/adj-volitionalform', defaultTotal: ADJ_CONJ_TOTAL },
    'adj-randomize': { id: 'adj-randomize', title: { key: 'forms.randomized' }, to: '/adj-randomize', defaultTotal: ADJ_CONJ_TOTAL },

    counters: { id: 'counters', title: { key: 'home.exercises.counters' }, to: '/counters', defaultTotal: COUNTERS_DEFAULT_TOTAL },
    'counters-people': { id: 'counters-people', title: { key: 'pages.countersPeople.title' }, to: '/counters-people', defaultTotal: COUNTERS_PEOPLE_TOTAL },
    'counting-things': { id: 'counting-things', title: { key: 'pages.countingThings.title' }, to: '/counting-things', defaultTotal: COUNTING_THINGS_TOTAL },
    days: { id: 'days', title: { key: 'pages.days.title' }, to: '/days', defaultTotal: DAYS_TOTAL },
    numbers: { id: 'numbers', title: { key: 'home.exercises.numbers' }, to: '/numbers', defaultTotal: DEFAULT_MASTERY_RANDOM_TOTAL },
    time: { id: 'time', title: { key: 'home.exercises.time' }, to: '/time', defaultTotal: DEFAULT_MASTERY_RANDOM_TOTAL },
    transitive: { id: 'transitive', title: { key: 'pages.transitive.title' }, to: '/transitive', defaultTotal: TRANSITIVE_TOTAL },
    'family-names': { id: 'family-names', title: { key: 'pages.familyNames.title' }, to: '/family-names', defaultTotal: FAMILY_NAMES_TOTAL },
    'adjectives-nouns': { id: 'adjectives-nouns', title: { key: 'pages.adjectivesNouns.title' }, to: '/adjectives-nouns', defaultTotal: ADJECTIVES_NOUNS_TOTAL },
  },
  sections: [
    {
      id: 'verb-conjugation',
      title: { key: 'home.sections.verbConjugation' },
      titleClassName: 'section-title',
      items: [
        { id: 'teform' },
        { id: 'causativeform' },
        { id: 'conditionalform' },
        { id: 'imperativeform' },
        { id: 'negativeform' },
        { id: 'passiveform' },
        { id: 'pastform' },
        { id: 'politeform' },
        { id: 'potentialform' },
        { id: 'provisionalform' },
        { id: 'volitionalform' },
        { id: 'randomize' },
      ],
    },
    {
      id: 'adjective-conjugation',
      title: { key: 'home.sections.adjectiveConjugation' },
      titleClassName: 'section-title',
      items: [
        { id: 'adj-naruform' },
        { id: 'adj-conditionalform' },
        { id: 'adj-negativeform' },
        { id: 'adj-pastform' },
        { id: 'adj-volitionalform' },
        { id: 'adj-randomize' },
      ],
    },
    {
      id: 'other',
      title: { key: 'home.sections.other' },
      titleClassName: 'section-title',
      items: [
        { id: 'counters' },
        { id: 'counting-things' },
        { id: 'days' },
        { id: 'numbers' },
        { id: 'time' },
        { id: 'transitive' },
        { id: 'family-names' },
        { id: 'adjectives-nouns' },
        { id: 'sentence-obligation' },
        { id: 'sentence-prohibition' },
      ],
    },
    {
      id: 'genki-intro',
      title: { key: 'home.sections.genkiSupplementary' },
      titleClassName: 'genki-supp-title',
      titleLevel: 2,
      descriptionClassName: 'genki-supp-desc',
      description: { key: 'home.genkitext' },
      items: [],
    },
    {
      id: 'genki-1',
      title: genkiSectionTitle(1),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki1-1' },
        { id: 'genki1-2' },
        { id: 'genki1-3' },
        { id: 'numbers', title: { key: 'pages.numbers.title' } },
        { id: 'time', title: { key: 'pages.time.title' } },
      ],
    },
    {
      id: 'genki-2',
      title: genkiSectionTitle(2),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki2-1' },
        { id: 'genki2-2' },
        { id: 'genki2-3' },
        { id: 'genki2-4' },
        { id: 'genki2-5' },
        { id: 'genki2-6' },
        { id: 'genki2-7' },
      ],
    },
    {
      id: 'genki-3',
      title: genkiSectionTitle(3),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'politeform', title: { key: 'home.genkiOverrides.verbConjugation' } },
        { id: 'genki3-2' },
        { id: 'genki3-3' },
        { id: 'genki3-4' },
        { id: 'genki3-5' },
        { id: 'genki3-7' },
      ],
    },
    {
      id: 'genki-4',
      title: genkiSectionTitle(4),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki4-1' },
        { id: 'genki4-2' },
        { id: 'genki4-3' },
        { id: 'pastform', title: { key: 'home.genkiOverrides.pastTenseVerbs' } },
        { id: 'genki4-5' },
        { id: 'genki4-6' },
        { id: 'genki4-7' },
        { id: 'genki4-8' },
      ],
    },
    {
      id: 'genki-5',
      title: genkiSectionTitle(5),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki5-1' },
        { id: 'genki5-2' },
        { id: 'genki5-3' },
        { id: 'counters', title: { key: 'home.genkiOverrides.counting' } },
      ],
    },
    {
      id: 'genki-6',
      title: genkiSectionTitle(6),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'teform', title: { key: 'home.genkiOverrides.teForm' } },
        { id: 'genki6-2' },
        { id: 'genki6-3' },
        { id: 'genki6-4' },
        { id: 'genki6-5' },
        { id: 'genki6-6' },
        { id: 'genki6-7' },
      ],
    },
    {
      id: 'genki-7',
      title: genkiSectionTitle(7),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki7-1' },
        { id: 'genki7-2' },
        { id: 'genki7-3' },
        { id: 'genki7-4' },
        { id: 'counters-people', title: { key: 'pages.countersPeople.title' } },
      ],
    },
    {
      id: 'genki-8',
      title: genkiSectionTitle(8),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'politeform-short' },
        { id: 'genki8-3' },
        { id: 'genki8-4' },
        { id: 'genki8-5' },
        { id: 'genki8-6' },
        { id: 'genki8-7' },
      ],
    },
    {
      id: 'genki-9',
      title: genkiSectionTitle(9),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'pastform', title: { key: 'home.genkiOverrides.pastShortFormsVerbs' } },
        { id: 'adj-pastform', title: { key: 'home.genkiOverrides.pastShortFormsAdjectives' } },
        { id: 'genki9-2' },
        { id: 'genki9-3' },
        { id: 'genki9-4' },
      ],
    },
    {
      id: 'genki-10',
      title: genkiSectionTitle(10),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki10-1' },
        { id: 'genki10-2' },
        { id: 'genki10-3' },
        { id: 'genki10-4' },
        { id: 'adj-naruform', title: { key: 'home.genkiOverrides.adjectiveNaru' } },
        { id: 'genki10-5' },
        { id: 'genki10-6' },
        { id: 'genki10-7' },
      ],
    },
    {
      id: 'genki-11',
      title: genkiSectionTitle(11),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki11-1' },
        { id: 'genki11-2' },
        { id: 'genki11-3' },
        { id: 'genki11-4' },
      ],
    },
    {
      id: 'genki-12',
      title: genkiSectionTitle(12),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki12-1', beta: true },
        { id: 'genki12-2', beta: true },
        { id: 'genki12-3', beta: true },
        { id: 'genki12-4', beta: true },
        { id: 'genki12-5', beta: true },
        { id: 'genki12-6', beta: true },
      ],
    },
    {
      id: 'genki-13',
      title: genkiSectionTitle(13),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'potentialform', title: { key: 'home.genkiOverrides.potentialVerbs' } },
        { id: 'genki13-2' },
        { id: 'genki13-3' },
        { id: 'genki13-4' },
        { id: 'genki13-5' },
        { id: 'genki13-6' },
      ],
    },
    {
      id: 'genki-14',
      title: genkiSectionTitle(14),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki14-1' },
        { id: 'genki14-2' },
        { id: 'genki14-3' },
        { id: 'genki14-4' },
        { id: 'genki14-5' },
      ],
    },
    {
      id: 'genki-15',
      title: genkiSectionTitle(15),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'volitionalform' },
        { id: 'genki15-2' },
        { id: 'genki15-3' },
        { id: 'genki15-4' },
      ],
    },
    {
      id: 'genki-16',
      title: genkiSectionTitle(16),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki16-1', beta: true },
        { id: 'genki16-2', beta: true },
        { id: 'genki16-3', beta: true },
        { id: 'genki16-4', beta: true },
        { id: 'genki16-5', beta: true },
      ],
    },
    {
      id: 'genki-17',
      title: genkiSectionTitle(17),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki17-1', beta: true },
        { id: 'genki17-2', beta: true },
        { id: 'genki17-3', beta: true },
        { id: 'genki17-4', beta: true },
        { id: 'genki17-5', beta: true },
        { id: 'genki17-6', beta: true },
      ],
    },
    {
      id: 'genki-18',
      title: genkiSectionTitle(18),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki18-1', beta: true },
        { id: 'genki18-2', beta: true },
        { id: 'genki18-3', beta: true },
        { id: 'genki18-4', beta: true },
        { id: 'genki18-5', beta: true },
      ],
    },
    {
      id: 'genki-19',
      title: genkiSectionTitle(19),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki19-1', beta: true },
        { id: 'genki19-2', beta: true },
        { id: 'genki19-3', beta: true },
        { id: 'genki19-4', beta: true },
        { id: 'genki19-5', beta: true },
      ],
    },
    {
      id: 'genki-20',
      title: genkiSectionTitle(20),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki20-1', beta: true },
        { id: 'genki20-2', beta: true },
        { id: 'genki20-3', beta: true },
        { id: 'genki20-4', beta: true },
        { id: 'genki20-5', beta: true },
        { id: 'genki20-6', beta: true },
      ],
    },
    {
      id: 'genki-21',
      title: genkiSectionTitle(21),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki21-1', beta: true },
        { id: 'genki21-2', beta: true },
        { id: 'genki21-3', beta: true },
        { id: 'genki21-4', beta: true },
        { id: 'genki21-5', beta: true },
      ],
    },
    {
      id: 'genki-22',
      title: genkiSectionTitle(22),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki22-1', beta: true },
        { id: 'genki22-2', beta: true },
        { id: 'genki22-3', beta: true },
        { id: 'genki22-4', beta: true },
        { id: 'genki22-5', beta: true },
      ],
    },
    {
      id: 'genki-23',
      title: genkiSectionTitle(23),
      titleClassName: 'section-title',
      titleLevel: 3,
      items: [
        { id: 'genki23-1', beta: true },
        { id: 'genki23-2', beta: true },
        { id: 'genki23-3', beta: true },
        { id: 'genki23-4', beta: true },
        { id: 'genki23-5', beta: true },
      ],
    },
  ],
};

export function getHomeExerciseTitle(id: string) {
  return homeConfig.exercises[id]?.title;
}

export function getHomeExercisePath(id: string) {
  return homeConfig.exercises[id]?.to;
}

export function getHomeExerciseDefaultTotal(id: string) {
  return homeConfig.exercises[id]?.defaultTotal ?? (id.startsWith('genki') ? (getGenkiLessonById(id)?.sentenceData.length ?? 12) : 12);
}
