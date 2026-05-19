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


// Genki lesson index structure for navigation
export interface GenkiLessonLink {
  id: string;
  title?: string;
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

export type HomeExerciseLink = {
  id: string;
  title: string;
  to?: string;
  defaultTotal: number;
};

export type HomeSection = {
  id: string;
  title: string;
  titleClassName?: string;
  titleLevel?: 2 | 3;
  description?: string[];
  descriptionClassName?: string;
  items: HomeExerciseLink[];
};

export const APP_TITLE_PREFIX = '';  // '亀 ';

export const DEFAULT_MASTERY_RANDOM_TOTAL = 30;
