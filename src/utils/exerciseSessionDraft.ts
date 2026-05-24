import type { ProgressSegmentState } from '../hooks/useSessionProgress';
import type { PreviousAnswer } from '../types';
import { clearPersistedSessionProgress } from '../hooks/useSessionProgress';

export const EXERCISE_DRAFT_STORAGE_PREFIX = 'kamehameha.exerciseDraft.v1.';

export type ExerciseSessionPickerState = {
  remainingIdx: number[];
  phase: 0 | 2 | null;
  lastIdx: number | null;
};

export type ExerciseSessionProgressSnapshot = {
  segments: ProgressSegmentState[];
  keyToIndex: [string, number][];
};

export type ExerciseSessionDraft = {
  version: 1;
  persistKey: string;
  fingerprint: string;
  savedAt: number;
  progress: ExerciseSessionProgressSnapshot;
  picker: ExerciseSessionPickerState;
  currentIdx: number;
  correct: number;
  incorrect: number;
  prevAnswers: PreviousAnswer[];
  isFinished: boolean;
  extras?: Record<string, unknown>;
};

export function buildExerciseDraftStorageKey(persistKey: string): string {
  return EXERCISE_DRAFT_STORAGE_PREFIX + encodeURIComponent(persistKey);
}

function isValidSegmentState(v: unknown): v is ProgressSegmentState {
  return v === 0 || v === 1 || v === 2;
}

function parseDraft(raw: string): ExerciseSessionDraft | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const d = parsed as ExerciseSessionDraft;
    if (d.version !== 1) return null;
    if (typeof d.persistKey !== 'string' || typeof d.fingerprint !== 'string') return null;
    if (!d.progress || !Array.isArray(d.progress.segments) || !d.progress.segments.every(isValidSegmentState)) {
      return null;
    }
    if (!Array.isArray(d.progress.keyToIndex)) return null;
    if (!d.picker || !Array.isArray(d.picker.remainingIdx)) return null;
    if (d.picker.phase !== 0 && d.picker.phase !== 2 && d.picker.phase !== null) return null;
    if (typeof d.currentIdx !== 'number' || !Number.isFinite(d.currentIdx)) return null;
    if (typeof d.correct !== 'number' || typeof d.incorrect !== 'number') return null;
    if (!Array.isArray(d.prevAnswers)) return null;
    if (typeof d.isFinished !== 'boolean') return null;
    return d;
  } catch {
    return null;
  }
}

export function loadExerciseSessionDraft(
  persistKey: string,
  fingerprint: string,
): ExerciseSessionDraft | null {
  try {
    const raw = sessionStorage.getItem(buildExerciseDraftStorageKey(persistKey));
    if (!raw) return null;
    const draft = parseDraft(raw);
    if (!draft || draft.persistKey !== persistKey || draft.fingerprint !== fingerprint) return null;
    return draft;
  } catch {
    return null;
  }
}

export function saveExerciseSessionDraft(draft: ExerciseSessionDraft): boolean {
  try {
    sessionStorage.setItem(buildExerciseDraftStorageKey(draft.persistKey), JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearExerciseSessionDraft(persistKey: string): void {
  try {
    sessionStorage.removeItem(buildExerciseDraftStorageKey(persistKey));
  } catch {
    return;
  }
}

export function clearPersistedSessionProgressForKey(persistKey: string): void {
  clearPersistedSessionProgress(persistKey);
}

export function clearAllExerciseSessionDrafts(): void {
  try {
    const keysToRemove: string[] = [];
    const persistKeysToClear: string[] = [];
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (!key?.startsWith(EXERCISE_DRAFT_STORAGE_PREFIX)) continue;
      keysToRemove.push(key);
      const encoded = key.slice(EXERCISE_DRAFT_STORAGE_PREFIX.length);
      try {
        persistKeysToClear.push(decodeURIComponent(encoded));
      } catch {
        // ignore
      }
    }
    for (const key of keysToRemove) {
      sessionStorage.removeItem(key);
    }
    for (const persistKey of persistKeysToClear) {
      clearPersistedSessionProgressForKey(persistKey);
    }
  } catch {
    return;
  }
}

export function buildExerciseFingerprint(...parts: (string | number)[]): string {
  return parts.map(String).join('|');
}

export function sessionWordKeysFromWords(words: { japanese: string }[]): string[] {
  return words.map(w => w.japanese);
}

export function restoreSessionWordsFromDraft<T extends { japanese: string }>(
  wordData: T[],
  draft: ExerciseSessionDraft | null,
  pickFresh: () => T[],
): T[] {
  const keys = draft?.extras?.sessionWordKeys;
  if (!Array.isArray(keys) || keys.length === 0) return pickFresh();
  const words = keys
    .map(key => wordData.find(w => w.japanese === key))
    .filter((w): w is T => w !== undefined);
  return words.length === keys.length ? words : pickFresh();
}
