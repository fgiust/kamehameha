import en from '../i18n/locales/en';
import it from '../i18n/locales/it';
import { homeConfig } from '../data/homeSections';
import type { TranslateSessionData } from '../types';
import { getSeoCopy, interpolate, type SeoLang } from './seoCopy';
import { localizePath } from './localizedPaths';

export const SITE_ORIGIN = 'https://kamehameha.fgiust.com';
export const BRAND = '亀 kamehameha!';
export const SHARE_IMAGE = `${SITE_ORIGIN}/share-1200.png`;

const VERB_CONJ_IDS = new Set([
  'teform', 'causativeform', 'conditionalform', 'imperativeform', 'negativeform',
  'passiveform', 'pastform', 'politeform', 'politeform-short', 'potentialform',
  'provisionalform', 'volitionalform', 'randomize',
]);

const ADJ_CONJ_IDS = new Set([
  'adj-naruform', 'adj-conditionalform', 'adj-negativeform', 'adj-pastform',
  'adj-volitionalform', 'adj-randomize',
]);

const EXERCISE_BY_PATH = Object.fromEntries(
  Object.values(homeConfig.exercises).map(ex => [ex.to, ex]),
);

export type HreflangAlternate = { lang: string; href: string };

export type PageMeta = {
  lang: SeoLang;
  internalPath: string;
  /** SEO / share title (og:, twitter, JSON-LD). */
  title: string;
  /** Short title shown in the browser tab. */
  documentTitle: string;
  description: string;
  canonical: string;
  og: {
    title: string;
    description: string;
    url: string;
    image: string;
    type: string;
    siteName: string;
    locale: string;
    localeAlternate: string;
  };
  twitter: {
    card: string;
    title: string;
    description: string;
    image: string;
  };
  hreflangAlternates: HreflangAlternate[];
  jsonLd: Record<string, unknown>;
};

type BuildPageMetaOptions = {
  internalPath: string;
  lang: SeoLang;
  genkiLessons?: TranslateSessionData[];
  sentenceLessons?: TranslateSessionData[];
};

function resolveI18nKey(lang: SeoLang, key: string): string {
  const root = lang === 'it' ? it : en;
  const parts = key.split('.');
  let obj: unknown = root;
  for (const part of parts) {
    obj = (obj as Record<string, unknown>)?.[part];
  }
  return typeof obj === 'string' ? obj : key;
}

function parseGenkiId(id: string): { lesson: number; exercise: number } | null {
  const match = /^genki(\d+)-(\d+)$/.exec(id);
  if (!match) return null;
  return { lesson: Number(match[1]), exercise: Number(match[2]) };
}

function normalizeInternalPath(path: string): string {
  if (!path || path === '/') return '/';
  return path.endsWith('/') && path.length > 1 ? path.slice(0, -1) : path;
}

function exerciseNameForId(lang: SeoLang, exerciseId: string): string {
  const def = homeConfig.exercises[exerciseId];
  if (!def?.title || typeof def.title === 'string') {
    return typeof def?.title === 'string' ? def.title : exerciseId;
  }
  return resolveI18nKey(lang, def.title.key);
}

function buildHreflangAlternates(internalPath: string): HreflangAlternate[] {
  const normalized = normalizeInternalPath(internalPath);
  return [
    { lang: 'en', href: `${SITE_ORIGIN}${localizePath(normalized, 'en')}` },
    { lang: 'it', href: `${SITE_ORIGIN}${localizePath(normalized, 'it')}` },
    { lang: 'x-default', href: `${SITE_ORIGIN}${localizePath(normalized, 'en')}` },
  ];
}

function buildJsonLd(
  internalPath: string,
  lang: SeoLang,
  title: string,
  description: string,
): Record<string, unknown> {
  const url = `${SITE_ORIGIN}${localizePath(internalPath, lang)}`;
  if (internalPath === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: BRAND,
      url: SITE_ORIGIN,
      description,
      inLanguage: ['en', 'it'],
    };
  }
  return {
    '@context': 'https://schema.org',
    '@type': 'LearningResource',
    name: title,
    description,
    url,
    inLanguage: lang,
    isAccessibleForFree: true,
    learningResourceType: 'practice problem',
    educationalLevel: 'intermediate',
    about: {
      '@type': 'Thing',
      name: lang === 'it' ? 'Grammatica giapponese' : 'Japanese grammar',
    },
  };
}

export function listPublicInternalPaths(
  genkiLessons: TranslateSessionData[],
  sentenceLessons: TranslateSessionData[],
): string[] {
  const paths = new Set<string>(['/']);
  for (const lesson of genkiLessons) paths.add(`/genki/${lesson.id}`);
  for (const lesson of sentenceLessons) paths.add(`/sentence/${lesson.id}`);
  for (const ex of Object.values(homeConfig.exercises)) {
    if (ex.to) paths.add(ex.to);
  }
  paths.add('/disclaimer');
  paths.add('/contact');
  return [...paths].sort();
}

export function buildPageMeta(options: BuildPageMetaOptions): PageMeta {
  const {
    internalPath: rawPath,
    lang,
    genkiLessons = [],
    sentenceLessons = [],
  } = options;
  const internalPath = normalizeInternalPath(rawPath);
  const seo = getSeoCopy(lang);
  const canonical = `${SITE_ORIGIN}${localizePath(internalPath, lang)}`;
  const hreflangAlternates = buildHreflangAlternates(internalPath);

  let title = seo.homeTitle;
  let documentTitle = 'kamehameha!';
  let description = seo.homeDescription;

  if (internalPath === '/') {
    // defaults above
  } else if (internalPath === '/disclaimer') {
    title = seo.disclaimerTitle;
    documentTitle = resolveI18nKey(lang, 'common.disclaimer');
    description = seo.disclaimerDescription;
  } else if (internalPath === '/contact') {
    title = seo.contactTitle;
    documentTitle = resolveI18nKey(lang, 'common.contact');
    description = seo.contactDescription;
  } else if (internalPath.startsWith('/genki/')) {
    const lessonId = internalPath.slice('/genki/'.length);
    const lesson = genkiLessons.find(l => l.id === lessonId);
    const parsed = parseGenkiId(lessonId);
    const topic = lang === 'it' ? (lesson?.titleItalian ?? lesson?.title ?? lessonId) : (lesson?.title ?? lessonId);
    const lessonNum = parsed?.lesson ?? 0;
    const exerciseNum = parsed?.exercise ?? 0;
    const vars = { topic, lesson: lessonNum, exercise: exerciseNum };
    title = interpolate(seo.genkiExerciseTitle, vars);
    documentTitle = topic;
    description = interpolate(seo.genkiExerciseDescription, vars);
  } else if (internalPath.startsWith('/sentence/')) {
    const lessonId = internalPath.slice('/sentence/'.length);
    const lesson = sentenceLessons.find(l => l.id === lessonId);
    const topic = lang === 'it' ? (lesson?.titleItalian ?? lesson?.title ?? lessonId) : (lesson?.title ?? lessonId);
    const vars = { topic };
    title = interpolate(seo.sentenceExerciseTitle, vars);
    documentTitle = topic;
    description = interpolate(seo.sentenceExerciseDescription, vars);
  } else {
    const exercise = EXERCISE_BY_PATH[internalPath];
    if (exercise) {
      const formName = exerciseNameForId(lang, exercise.id);
      documentTitle = formName;
      if (VERB_CONJ_IDS.has(exercise.id)) {
        const vars = { form: formName };
        title = interpolate(seo.conjugationTitle, vars);
        description = interpolate(seo.conjugationDescription, vars);
      } else if (ADJ_CONJ_IDS.has(exercise.id)) {
        const vars = { form: formName };
        title = interpolate(seo.adjectiveConjugationTitle, vars);
        description = interpolate(seo.adjectiveConjugationDescription, vars);
      } else {
        const vars = { name: formName };
        title = interpolate(seo.exerciseTitle, vars);
        description = interpolate(seo.exerciseDescription, vars);
      }
    } else {
      title = seo.notFoundTitle;
      documentTitle = '404';
      description = seo.notFoundDescription;
    }
  }

  const ogLocale = lang === 'it' ? 'it_IT' : 'en_US';
  const ogLocaleAlternate = lang === 'it' ? 'en_US' : 'it_IT';

  return {
    lang,
    internalPath,
    title,
    documentTitle,
    description,
    canonical,
    og: {
      title,
      description,
      url: canonical,
      image: SHARE_IMAGE,
      type: 'website',
      siteName: BRAND,
      locale: ogLocale,
      localeAlternate: ogLocaleAlternate,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      image: SHARE_IMAGE,
    },
    hreflangAlternates,
    jsonLd: buildJsonLd(internalPath, lang, title, description),
  };
}

export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderMetaTags(meta: PageMeta): string {
  const lines: string[] = [
    `<meta name="description" content="${escapeHtml(meta.description)}">`,
    `<link rel="canonical" href="${escapeHtml(meta.canonical)}">`,
    ...meta.hreflangAlternates.map(
      alt => `<link rel="alternate" hreflang="${escapeHtml(alt.lang)}" href="${escapeHtml(alt.href)}">`,
    ),
    `<meta property="og:title" content="${escapeHtml(meta.og.title)}">`,
    `<meta property="og:description" content="${escapeHtml(meta.og.description)}">`,
    `<meta property="og:type" content="${escapeHtml(meta.og.type)}">`,
    `<meta property="og:url" content="${escapeHtml(meta.og.url)}">`,
    `<meta property="og:image" content="${escapeHtml(meta.og.image)}">`,
    `<meta property="og:image:width" content="1200">`,
    `<meta property="og:image:height" content="1200">`,
    `<meta property="og:site_name" content="${escapeHtml(meta.og.siteName)}">`,
    `<meta property="og:locale" content="${escapeHtml(meta.og.locale)}">`,
    `<meta property="og:locale:alternate" content="${escapeHtml(meta.og.localeAlternate)}">`,
    `<meta name="twitter:card" content="${escapeHtml(meta.twitter.card)}">`,
    `<meta name="twitter:title" content="${escapeHtml(meta.twitter.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(meta.twitter.description)}">`,
    `<meta name="twitter:image" content="${escapeHtml(meta.twitter.image)}">`,
    `<script type="application/ld+json">${JSON.stringify(meta.jsonLd)}</script>`,
  ];
  return lines.join('\n  ');
}
