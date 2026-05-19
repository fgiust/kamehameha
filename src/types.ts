// Core types for the exercise engine system

/** Verb types used in conjugation exercises */
export type VerbType = 'u' | 'ru' | 'irr';

/** Adjective types used in conjugation exercises */
export type AdjectiveType = 'i' | 'na';

/** A word used in conjugation exercises */
export interface ConjugationWord {
  kana: string;
  kanji: string;
  type: VerbType | AdjectiveType;
  eng: string;
}

/** Options that can be toggled for conjugation exercises */
export interface ConjugationOption {
  id: string;
  label: string;
}

/** The active option flags for an exercise */
export type OptionFlags = Record<string, boolean>;

/** Interface for a conjugation form engine */
export interface ConjugationEngine {
  /** Options available for this form */
  opts: ConjugationOption[];
  baseFormHint?: 'plain' | 'polite' | 'negative';
  /** Exception words that have irregular conjugation */
  exceptions?: string[];
  /** Compute the conjugated answer */
  getAnswer(word: string, type: string, flags: OptionFlags): string | string[];
}

/** Interface for a randomize engine that picks forms randomly */
export interface RandomizeEngine {
  opts: ConjugationOption[];
  getForm(): string;
  getAnswer(
    word: ConjugationWord,
    type: string,
    flags: OptionFlags
  ): { kana: string | string[]; kanji: string | string[] };
}

/** A single sentence exercise item from Genki */
export interface SentenceItem {
  answer: string;
  english: string;
}

/** Configuration for a sentence translation session */
export interface TranslateSessionData {
  id: string;
  title: string;
  sentenceData: SentenceItem[];
}

/** Configuration for a conjugation exercise */
export interface ConjugationExerciseConfig {
  id: string;
  title: string;
  jsname: string;
  helplink?: string;
}

/** Type labels for conjugation display */
export interface TypeLabels {
  [key: string]: string;
}

/** Previous answer record */
export interface PreviousAnswer {
  question: string;
  userAnswer: string;
  correctAnswer: string;
  isCorrect: boolean;
  displayAnswer?: string;
  diffOps?: unknown;
}

/** Global localStorage settings keys used across exercises */
export const SETTINGS_KEYS = {
  randomizeForm: 'nihongo.randomizeForm',
  reverseQA: 'nihongo.reverseQA',
  showKanji: 'nihongo.showKanji',
  showFurigana: 'nihongo.showFurigana',
  showType: 'nihongo.showType',
  showEnglish: 'nihongo.showEnglish',
} as const;

export const APP_TITLE_PREFIX = '';  // '亀 ';

export const DEFAULT_MASTERY_RANDOM_TOTAL = 30;

export function readStoredBool(key: string, fallback: boolean) {
  try {
    const v = localStorage.getItem(key);
    if (v === null) return fallback;
    return v === 'true';
  } catch {
    return fallback;
  }
}

export function writeStoredBool(key: string, value: boolean) {
  try {
    localStorage.setItem(key, value ? 'true' : 'false');
  } catch {
    return;
  }
}

export function stripRubyTags(input: string) {
  return input
    .replace(/<rt>.*?<\/rt>/g, '')
    .replace(/<\/?rb>/g, '')
    .replace(/<\/?ruby>/g, '');
}

export function getConjugationFormHint(engine: ConjugationEngine, flags: OptionFlags) {
  const base = engine.baseFormHint ?? 'plain';
  const hasNegOpt = engine.opts.some(o => o.id === 'neg');
  const hasPoliteOpt = engine.opts.some(o => o.id === 'polite');

  const isNeg = base === 'negative' || (hasNegOpt && !!flags.neg);
  const isPolite = base === 'polite' || (hasPoliteOpt && !!flags.polite);
  const isPlain = !isNeg && !isPolite;

  const parts: string[] = [];
  for (const o of engine.opts) {
    if (o.id === 'neg' || o.id === 'polite') continue;
    if (flags[o.id]) parts.push(o.label.toLowerCase());
  }
  if (isPlain) parts.push('plain');
  if (isNeg) parts.push('negative');
  if (isPolite) parts.push('polite');
  parts.push('form');
  return parts.join(' ');
}

/** Details of the current active question for feedback system */
export interface FeedbackDetails {
  section: string;
  question: string;
  correctAnswer: string;
  userAnswer?: string;
}

function cleanRubyText(html: string): string {
  if (!html) return '';
  return html
    .replace(/<rt[^>]*>([\s\S]*?)<\/rt>/gi, '')
    .replace(/<\/?[^>]+(>|$)/g, '')
    .replace(/&nbsp;/g, ' ')
    .trim();
}

/** Helper to update current question details globally */
export function updateFeedbackDetails(details: Partial<FeedbackDetails>) {
  const w = window as Window & { currentQuestionDetails?: FeedbackDetails };
  const current: FeedbackDetails = w.currentQuestionDetails ?? {
    section: '',
    question: '',
    correctAnswer: '',
    userAnswer: '',
  };
  const updated = {
    section: details.section ?? current.section ?? '',
    question: cleanRubyText(details.question ?? current.question ?? ''),
    correctAnswer: cleanRubyText(details.correctAnswer ?? current.correctAnswer ?? ''),
    userAnswer: cleanRubyText(details.userAnswer ?? current.userAnswer ?? ''),
  };
  w.currentQuestionDetails = updated;
  window.dispatchEvent(new CustomEvent('nihongo-feedback-update', { detail: updated }));
}
