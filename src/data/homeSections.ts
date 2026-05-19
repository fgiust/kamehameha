import adjectives from './adjectives';
import { adjectivesNounsSentenceData } from './adjectivesNouns';
import counters from './counters';
import { familyNamesData } from './familyNamesData';
import { genkiChapters, getGenkiLinkPath, getGenkiLinkTitle, getGenkiLessonById } from './genkiLessons';
import { naVsNoData } from './naVsNoData';
import { transitiveData } from './transitiveData';
import verbs from './verbs';
import { DEFAULT_MASTERY_RANDOM_TOTAL, GenkiChapter, HomeSection } from '../types';

const VERB_TOTAL = verbs.length;
const ADJ_TOTAL = adjectives.length;
const COUNTERS_DEFAULT_TOTAL = counters.reduce((acc, c) => acc + c.readings.length + Object.keys(c.extraReadings ?? {}).length, 0);
const COUNTERS_PEOPLE_TOTAL = (() => {
  const c = counters.find(x => x.meaning[1] === 'people');
  if (!c) return 0;
  return c.readings.length + Object.keys(c.extraReadings ?? {}).length;
})();
const TRANSITIVE_TOTAL = transitiveData.length;
const NA_VS_NO_TOTAL = naVsNoData.questions['な'].length + naVsNoData.questions['の'].length;
const FAMILY_NAMES_TOTAL = familyNamesData.length;
const ADJECTIVES_NOUNS_TOTAL = adjectivesNounsSentenceData.length;
const COUNTING_THINGS_TOTAL = 30;

function getDefaultTotalSegmentsForPath(path: string) {
  if (path.startsWith('/genki/')) {
    const id = path.slice('/genki/'.length);
    const lesson = getGenkiLessonById(id);
    if (lesson) return lesson.sentenceData.length;
  }

  if (path === '/randomize') return VERB_TOTAL;
  if (/^\/(teform|causativeform|conditionalform|imperativeform|negativeform|passiveform|pastform|politeform|potentialform|provisionalform|volitionalform)$/.test(path)) {
    return VERB_TOTAL;
  }

  if (path === '/adj-randomize') return ADJ_TOTAL;
  if (/^\/adj-(naruform|conditionalform|negativeform|pastform|volitionalform)$/.test(path)) {
    return ADJ_TOTAL;
  }

  if (path === '/counters') return COUNTERS_DEFAULT_TOTAL;
  if (path === '/counters-people') return COUNTERS_PEOPLE_TOTAL;
  if (path === '/counting-things') return COUNTING_THINGS_TOTAL;
  if (path === '/days') return 31;
  if (path === '/numbers') return DEFAULT_MASTERY_RANDOM_TOTAL;
  if (path === '/time') return DEFAULT_MASTERY_RANDOM_TOTAL;
  if (path === '/transitive') return TRANSITIVE_TOTAL;
  if (path === '/na-vs-no') return NA_VS_NO_TOTAL;
  if (path === '/family-names') return FAMILY_NAMES_TOTAL;
  if (path === '/adjectives-nouns') return ADJECTIVES_NOUNS_TOTAL;

  return 12;
}

function mapGenkiChapter(ch: GenkiChapter) {
  return ch.links.map(link => {
    const to = getGenkiLinkPath(link);
    const title = getGenkiLinkTitle(link);
    const effectivePath = to ?? link.path ?? '';
    const defaultTotal = effectivePath ? getDefaultTotalSegmentsForPath(effectivePath) : 12;
    return {
      id: link.id,
      title,
      to,
      defaultTotal,
    };
  });
}

export const homeSections: HomeSection[] = [
  {
    id: 'verb-conjugation',
    title: 'Verb Conjugation Practice',
    titleClassName: 'section-title',
    items: [
      { id: 'teform', title: 'て-Form', to: '/teform', defaultTotal: VERB_TOTAL },
      { id: 'causativeform', title: 'Causative Form', to: '/causativeform', defaultTotal: VERB_TOTAL },
      { id: 'conditionalform', title: 'Conditional Form', to: '/conditionalform', defaultTotal: VERB_TOTAL },
      { id: 'imperativeform', title: 'Imperative Form', to: '/imperativeform', defaultTotal: VERB_TOTAL },
      { id: 'negativeform', title: 'Negative Form', to: '/negativeform', defaultTotal: VERB_TOTAL },
      { id: 'passiveform', title: 'Passive Form', to: '/passiveform', defaultTotal: VERB_TOTAL },
      { id: 'pastform', title: 'Past Form', to: '/pastform', defaultTotal: VERB_TOTAL },
      { id: 'politeform', title: 'Polite Form', to: '/politeform', defaultTotal: VERB_TOTAL },
      { id: 'potentialform', title: 'Potential Form', to: '/potentialform', defaultTotal: VERB_TOTAL },
      { id: 'provisionalform', title: 'Provisional Form', to: '/provisionalform', defaultTotal: VERB_TOTAL },
      { id: 'volitionalform', title: 'Volitional Form', to: '/volitionalform', defaultTotal: VERB_TOTAL },
      { id: 'randomize', title: 'Randomized Forms', to: '/randomize', defaultTotal: VERB_TOTAL },
    ],
  },
  {
    id: 'adjective-conjugation',
    title: 'Adjective Conjugation Practice',
    titleClassName: 'section-title',
    items: [
      { id: 'adj-naruform', title: 'なる Form', to: '/adj-naruform', defaultTotal: ADJ_TOTAL },
      { id: 'adj-conditionalform', title: 'Conditional Form', to: '/adj-conditionalform', defaultTotal: ADJ_TOTAL },
      { id: 'adj-negativeform', title: 'Negative Form', to: '/adj-negativeform', defaultTotal: ADJ_TOTAL },
      { id: 'adj-pastform', title: 'Past Form', to: '/adj-pastform', defaultTotal: ADJ_TOTAL },
      { id: 'adj-volitionalform', title: 'Volitional Form', to: '/adj-volitionalform', defaultTotal: ADJ_TOTAL },
      { id: 'adj-randomize', title: 'Randomized Forms', to: '/adj-randomize', defaultTotal: ADJ_TOTAL },
    ],
  },
  {
    id: 'other',
    title: 'Other',
    titleClassName: 'section-title',
    items: [
      { id: 'counters', title: 'Counters', to: '/counters', defaultTotal: COUNTERS_DEFAULT_TOTAL },
      { id: 'counting-things', title: 'Counting things', to: '/counting-things', defaultTotal: COUNTING_THINGS_TOTAL },
      { id: 'days', title: 'Days of the Month', to: '/days', defaultTotal: 31 },
      { id: 'numbers', title: 'Numbers', to: '/numbers', defaultTotal: DEFAULT_MASTERY_RANDOM_TOTAL },
      { id: 'time', title: 'Time', to: '/time', defaultTotal: DEFAULT_MASTERY_RANDOM_TOTAL },
      { id: 'transitive', title: 'Transitive / Intransitive pairs', to: '/transitive', defaultTotal: TRANSITIVE_TOTAL },
      { id: 'na-vs-no', title: 'な vs の Adjectives', to: '/na-vs-no', defaultTotal: NA_VS_NO_TOTAL },
      { id: 'family-names', title: 'Common family names', to: '/family-names', defaultTotal: FAMILY_NAMES_TOTAL },
      { id: 'adjectives-nouns', title: 'Adjectives + nouns', to: '/adjectives-nouns', defaultTotal: ADJECTIVES_NOUNS_TOTAL },
    ],
  },
  {
    id: 'genki-intro',
    title: 'Genki supplementary exercises',
    titleClassName: 'genki-supp-title',
    titleLevel: 2,
    descriptionClassName: 'genki-supp-desc',
    description: [
      'Grammar exercises organized by Genki lesson topics.',
      'This app does not reproduce any copyrighted content from the Genki textbooks.',
      'The exercises are original and are simply organized following the same lesson order to provide well-structured supplementary practice for Genki learners.',
    ],
    items: [],
  },
  ...genkiChapters.map(ch => {
    const bookLabel = ch.lesson <= 12 ? 'Genki I' : 'Genki II';
    return {
      id: `genki-${ch.lesson}`,
      title: `${bookLabel} - Lesson ${ch.lesson}`,
      titleClassName: 'section-title',
      titleLevel: 3,
      items: mapGenkiChapter(ch),
    } satisfies HomeSection;
  }),
];
