import { describe, expect, it } from 'vitest';
import {
  hydrateSessionProgressSnapshot,
  normalizeSegments,
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
});
