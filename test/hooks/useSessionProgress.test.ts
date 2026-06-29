import { describe, expect, it } from 'vitest';
import {
  listPersistedSessionProgressRecords,
  hydrateSessionProgressSnapshot,
  normalizeSegments,
  readPersistedSessionProgressRecord,
  writePersistedSessionProgressRecord,
  type ProgressSegmentState,
} from '../../src/hooks/useSessionProgress';

describe('useSessionProgress hydration', () => {
  it('normalizes segment length to total', () => {
    expect(normalizeSegments([1, 2], 4)).toEqual([1, 2, 0, 0]);
    expect(normalizeSegments([1, 2, 0, 1, 2], 3)).toEqual([1, 2, 0]);
  });

  it('hydrates refs so getState would read recorded keys', () => {
    const segmentsRef = { current: [] as ProgressSegmentState[] };
    const keyToIndexRef = { current: new Map<string, number>() };
    const indexToKeyRef = { current: [] as Array<string | null> };
    const nextIndexRef = { current: 0 };

    hydrateSessionProgressSnapshot(
      {
        segments: [1, 0, 2],
        keyToIndex: [['item-a', 0], ['item-c', 2]],
      },
      3,
      { segmentsRef, keyToIndexRef, indexToKeyRef, nextIndexRef },
    );

    expect(segmentsRef.current).toEqual([1, 0, 2]);
    expect(keyToIndexRef.current.get('item-a')).toBe(0);
    expect(keyToIndexRef.current.get('item-c')).toBe(2);
    expect(indexToKeyRef.current[0]).toBe('item-a');
    expect(indexToKeyRef.current[2]).toBe('item-c');
    expect(nextIndexRef.current).toBe(0);
  });

  it('allocates the next empty slot after hydrate when recording a new key', () => {
    const segmentsRef = { current: [0, 0, 0, 0, 0] as ProgressSegmentState[] };
    const keyToIndexRef = { current: new Map<string, number>() };
    const indexToKeyRef = { current: Array<string | null>(5).fill(null) };
    const nextIndexRef = { current: 0 };

    hydrateSessionProgressSnapshot(
      {
        segments: [1, 2, 0, 0, 0],
        keyToIndex: [
          ['0', 0],
          ['1', 1],
          ['2', 2],
        ],
      },
      5,
      { segmentsRef, keyToIndexRef, indexToKeyRef, nextIndexRef },
    );

    const map = keyToIndexRef.current;
    const key = '3';
    let idx = map.get(key);
    if (idx === undefined) {
      const empty = indexToKeyRef.current.indexOf(null);
      idx = empty !== -1 ? empty : nextIndexRef.current;
      map.set(key, idx);
      indexToKeyRef.current[idx] = key;
    }
    segmentsRef.current = [...segmentsRef.current] as ProgressSegmentState[];
    segmentsRef.current[idx] = 1;

    expect(idx).toBe(3);
    expect(segmentsRef.current).toEqual([1, 2, 0, 1, 0]);
    expect(nextIndexRef.current).toBe(3);
  });

  it('does not treat a repeated hydrate as a total change', () => {
    const segmentsRef = { current: [] as ProgressSegmentState[] };
    const keyToIndexRef = { current: new Map<string, number>() };
    const indexToKeyRef = { current: [] as Array<string | null> };
    const nextIndexRef = { current: 0 };
    const snapshot = {
      segments: [1, 2, 0] as ProgressSegmentState[],
      keyToIndex: [['0', 0], ['1', 1]] as [string, number][],
    };

    hydrateSessionProgressSnapshot(snapshot, 3, {
      segmentsRef,
      keyToIndexRef,
      indexToKeyRef,
      nextIndexRef,
    });
    hydrateSessionProgressSnapshot(snapshot, 3, {
      segmentsRef,
      keyToIndexRef,
      indexToKeyRef,
      nextIndexRef,
    });

    expect(segmentsRef.current).toEqual([1, 2, 0]);
  });

  it('reads and lists persisted progress records with timestamps', () => {
    const storage = new Map<string, string>();
    const localStorageMock = {
      getItem: (key: string) => storage.get(key) ?? null,
      setItem: (key: string, value: string) => {
        storage.set(key, value);
      },
      removeItem: (key: string) => {
        storage.delete(key);
      },
      clear: () => {
        storage.clear();
      },
      key: (index: number) => [...storage.keys()][index] ?? null,
      get length() {
        return storage.size;
      },
    } as Storage;

    const previousLocalStorage = globalThis.localStorage;
    Object.defineProperty(globalThis, 'localStorage', {
      configurable: true,
      value: localStorageMock,
    });

    try {
      localStorage.clear();
      writePersistedSessionProgressRecord('/verbs/plain', [1, 2, 0], 1234);
      writePersistedSessionProgressRecord('/sentence/genki-01-1', [1, 1], 5678);

      expect(readPersistedSessionProgressRecord('/verbs/plain')).toEqual({
        persistKey: '/verbs/plain',
        segments: [1, 2, 0],
        total: 3,
        at: 1234,
      });

      expect(listPersistedSessionProgressRecords()).toEqual(
        expect.arrayContaining([
          {
            persistKey: '/verbs/plain',
            segments: [1, 2, 0],
            total: 3,
            at: 1234,
          },
          {
            persistKey: '/sentence/genki-01-1',
            segments: [1, 1],
            total: 2,
            at: 5678,
          },
        ]),
      );
    } finally {
      Object.defineProperty(globalThis, 'localStorage', {
        configurable: true,
        value: previousLocalStorage,
      });
    }
  });
});
