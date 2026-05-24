import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  buildExerciseDraftStorageKey,
  buildExerciseFingerprint,
  clearAllExerciseSessionDrafts,
  clearExerciseSessionDraft,
  loadExerciseSessionDraft,
  restoreSessionWordsFromDraft,
  saveExerciseSessionDraft,
  type ExerciseSessionDraft,
} from '../../src/utils/exerciseSessionDraft';
import { buildSessionProgressStorageKey } from '../../src/hooks/useSessionProgress';

const sampleDraft = (overrides: Partial<ExerciseSessionDraft> = {}): ExerciseSessionDraft => ({
  version: 1,
  persistKey: '/test',
  fingerprint: 'fp',
  savedAt: Date.now(),
  progress: {
    segments: [1, 0, 2],
    keyToIndex: [['0', 0], ['2', 2]],
  },
  picker: { remainingIdx: [1], phase: 0, lastIdx: 0 },
  currentIdx: 0,
  correct: 2,
  incorrect: 1,
  prevAnswers: [],
  isFinished: false,
  ...overrides,
});

function installSessionStorageMock() {
  const store = new Map<string, string>();
  vi.stubGlobal('sessionStorage', {
    get length() {
      return store.size;
    },
    key(index: number) {
      return [...store.keys()][index] ?? null;
    },
    getItem(key: string) {
      return store.get(key) ?? null;
    },
    setItem(key: string, value: string) {
      store.set(key, value);
    },
    removeItem(key: string) {
      store.delete(key);
    },
    clear() {
      store.clear();
    },
  });
}

describe('exerciseSessionDraft', () => {
  beforeEach(() => {
    installSessionStorageMock();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('round-trips a draft through sessionStorage', () => {
    const draft = sampleDraft();
    expect(saveExerciseSessionDraft(draft)).toBe(true);
    expect(loadExerciseSessionDraft('/test', 'fp')).toEqual(draft);
  });

  it('rejects drafts when fingerprint does not match', () => {
    saveExerciseSessionDraft(sampleDraft({ fingerprint: 'a' }));
    expect(loadExerciseSessionDraft('/test', 'b')).toBeNull();
  });

  it('rejects drafts when persistKey does not match', () => {
    saveExerciseSessionDraft(sampleDraft({ persistKey: '/other' }));
    expect(loadExerciseSessionDraft('/test', 'fp')).toBeNull();
  });

  it('clears a single draft', () => {
    saveExerciseSessionDraft(sampleDraft());
    clearExerciseSessionDraft('/test');
    expect(sessionStorage.getItem(buildExerciseDraftStorageKey('/test'))).toBeNull();
  });

  it('clears all drafts with the prefix', () => {
    saveExerciseSessionDraft(sampleDraft({ persistKey: '/a' }));
    saveExerciseSessionDraft(sampleDraft({ persistKey: '/b' }));
    clearAllExerciseSessionDrafts();
    expect(sessionStorage.length).toBe(0);
  });

  it('clearAllExerciseSessionDrafts does not remove localStorage HP progress', () => {
    const localStore = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => localStore.get(key) ?? null,
      setItem: (key: string, value: string) => {
        localStore.set(key, value);
      },
      removeItem: (key: string) => {
        localStore.delete(key);
      },
    });

    const progressKey = buildSessionProgressStorageKey('/a');
    localStore.set(progressKey, JSON.stringify({ segments: '🟩', total: 1 }));

    saveExerciseSessionDraft(sampleDraft({ persistKey: '/a' }));
    clearAllExerciseSessionDrafts();

    expect(sessionStorage.length).toBe(0);
    expect(localStore.has(progressKey)).toBe(true);
  });

  it('buildExerciseFingerprint joins parts', () => {
    expect(buildExerciseFingerprint('/x', 10, 'y')).toBe('/x|10|y');
  });

  it('restoreSessionWordsFromDraft restores words by japanese keys', () => {
    const wordData = [
      { japanese: '食[た]べる', type: 'v' as const, en: 'eat', it: 'mangiare' },
      { japanese: '行[い]く', type: 'v' as const, en: 'go', it: 'andare' },
    ];
    const draft = sampleDraft({
      extras: { sessionWordKeys: ['行[い]く', '食[た]べる'] },
    });
    const restored = restoreSessionWordsFromDraft(wordData, draft, () => [wordData[0]!]);
    expect(restored.map(w => w.japanese)).toEqual(['行[い]く', '食[た]べる']);
  });

  it('restoreSessionWordsFromDraft falls back when keys are stale', () => {
    const wordData = [{ japanese: 'a', type: 'v' as const, en: 'a', it: 'a' }];
    const draft = sampleDraft({ extras: { sessionWordKeys: ['missing'] } });
    const restored = restoreSessionWordsFromDraft(wordData, draft, () => wordData);
    expect(restored).toEqual(wordData);
  });
});
