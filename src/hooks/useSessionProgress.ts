import { useCallback, useEffect, useMemo, useRef, useState, type MutableRefObject } from 'react';
import {
  areAllSegmentsGreen,
  shouldTrackKamehamehaCompletion,
  trackExerciseKamehameha,
  trackExerciseQuestion,
} from '../utils/exerciseAnalytics';

export type ProgressSegmentState = 0 | 1 | 2;

export const SESSION_PROGRESS_STORAGE_PREFIX = 'kamehameha.sessionProgress.v1.';

export const SESSION_PROGRESS_UPDATED_EVENT = 'kamehameha.sessionProgressUpdated.v1';

const SEGMENT_OK = '🟩';
const SEGMENT_BAD = '🟥';
const SEGMENT_EMPTY = '⬜️';

function encodeSegments(segments: ProgressSegmentState[]) {
  return segments.map(s => (s === 1 ? SEGMENT_OK : s === 2 ? SEGMENT_BAD : SEGMENT_EMPTY)).join('');
}

function decodeSegments(raw: string): ProgressSegmentState[] | null {
  if (!raw) return null;
  const tokens = raw.match(/🟩|🟥|⬜️|⬜/gu);
  if (!tokens || tokens.length === 0) return null;
  const out: ProgressSegmentState[] = [];
  for (const t of tokens) {
    if (t === SEGMENT_OK) out.push(1);
    else if (t === SEGMENT_BAD) out.push(2);
    else out.push(0);
  }
  return out;
}

export function buildSessionProgressStorageKey(persistKey: string) {
  return SESSION_PROGRESS_STORAGE_PREFIX + encodeURIComponent(persistKey);
}

export type PersistedSessionProgressRecord = {
  persistKey: string;
  segments: ProgressSegmentState[];
  total: number;
  at: number | null;
};

function parsePersistedSessionProgressRaw(raw: string): Omit<PersistedSessionProgressRecord, 'persistKey'> | null {
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!parsed || typeof parsed !== 'object') return null;
    const obj = parsed as { segments?: unknown; total?: unknown; at?: unknown };
    const total =
      typeof obj.total === 'number' && Number.isFinite(obj.total)
        ? Math.max(0, Math.floor(obj.total))
        : null;
    const at = typeof obj.at === 'number' && Number.isFinite(obj.at) ? Math.floor(obj.at) : null;

    if (typeof obj.segments === 'string') {
      const decoded = decodeSegments(obj.segments);
      if (!decoded) return null;
      const normalized = total !== null
        ? decoded.length > total
          ? decoded.slice(0, total)
          : [...decoded, ...(Array(total - decoded.length).fill(0) as ProgressSegmentState[])]
        : decoded;

      return {
        segments: normalized,
        total: total ?? normalized.length,
        at,
      };
    }

    if (Array.isArray(obj.segments)) {
      if (!obj.segments.every(v => v === 0 || v === 1 || v === 2)) return null;
      const arr = obj.segments as ProgressSegmentState[];
      const normalized = total !== null
        ? arr.length > total
          ? arr.slice(0, total)
          : [...arr, ...(Array(total - arr.length).fill(0) as ProgressSegmentState[])]
        : arr;

      return {
        segments: normalized,
        total: total ?? normalized.length,
        at,
      };
    }

    return null;
  } catch {
    return null;
  }
}

function decodePersistKeyFromStorageKey(storageKey: string) {
  if (!storageKey.startsWith(SESSION_PROGRESS_STORAGE_PREFIX)) return null;
  try {
    return decodeURIComponent(storageKey.slice(SESSION_PROGRESS_STORAGE_PREFIX.length));
  } catch {
    return null;
  }
}

export function readPersistedSessionProgressRecord(persistKey: string): PersistedSessionProgressRecord | null {
  try {
    const raw = localStorage.getItem(buildSessionProgressStorageKey(persistKey));
    if (!raw) return null;
    const parsed = parsePersistedSessionProgressRaw(raw);
    if (!parsed) return null;
    return {
      persistKey,
      ...parsed,
    };
  } catch {
    return null;
  }
}

export function readPersistedSessionProgress(persistKey: string): ProgressSegmentState[] | null {
  return readPersistedSessionProgressRecord(persistKey)?.segments ?? null;
}

export function listPersistedSessionProgressRecords(): PersistedSessionProgressRecord[] {
  try {
    const out: PersistedSessionProgressRecord[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const storageKey = localStorage.key(i);
      if (!storageKey) continue;
      const persistKey = decodePersistKeyFromStorageKey(storageKey);
      if (!persistKey) continue;
      const raw = localStorage.getItem(storageKey);
      if (!raw) continue;
      const parsed = parsePersistedSessionProgressRaw(raw);
      if (!parsed) continue;
      out.push({ persistKey, ...parsed });
    }
    return out;
  } catch {
    return [];
  }
}

export function writePersistedSessionProgressRecord(
  persistKey: string,
  segments: ProgressSegmentState[],
  at = Date.now(),
) {
  try {
    localStorage.setItem(
      buildSessionProgressStorageKey(persistKey),
      JSON.stringify({ segments: encodeSegments(segments), total: segments.length, at })
    );
    return true;
  } catch {
    return false;
  }
}

function writePersistedSessionProgress(persistKey: string, segments: ProgressSegmentState[]) {
  return writePersistedSessionProgressRecord(persistKey, segments);
}

export function notifySessionProgressUpdated(persistKey?: string) {
  try {
    window.dispatchEvent(new CustomEvent(SESSION_PROGRESS_UPDATED_EVENT, { detail: { persistKey } }));
  } catch {
    return;
  }
}

export type SessionProgressSnapshot = {
  segments: ProgressSegmentState[];
  keyToIndex: [string, number][];
};

export function normalizeSegments(segments: ProgressSegmentState[], totalSegments: number): ProgressSegmentState[] {
  const n = Math.max(0, totalSegments);
  if (segments.length === n) return [...segments];
  if (segments.length > n) return segments.slice(0, n);
  return [...segments, ...(Array(n - segments.length).fill(0) as ProgressSegmentState[])];
}

export function hydrateSessionProgressSnapshot(
  snapshot: SessionProgressSnapshot,
  totalSegments: number,
  refs: {
    segmentsRef: MutableRefObject<ProgressSegmentState[]>;
    keyToIndexRef: MutableRefObject<Map<string, number>>;
    indexToKeyRef: MutableRefObject<Array<string | null>>;
    nextIndexRef: MutableRefObject<number>;
  },
): ProgressSegmentState[] {
  const n = Math.max(0, totalSegments);
  const segments = normalizeSegments(snapshot.segments, n);
  refs.segmentsRef.current = segments;

  const map = new Map<string, number>(snapshot.keyToIndex);
  refs.keyToIndexRef.current = map;

  const indexToKey = Array(n).fill(null) as Array<string | null>;
  for (const [key, idx] of map) {
    if (idx >= 0 && idx < n) indexToKey[idx] = key;
  }
  refs.indexToKeyRef.current = indexToKey;

  let nextIndex = 0;
  for (const idx of map.values()) {
    if (idx + 1 > nextIndex) nextIndex = idx + 1;
  }
  refs.nextIndexRef.current = n > 0 ? nextIndex % n : 0;
  return segments;
}

export function clearPersistedSessionProgress(persistKey: string): void {
  try {
    localStorage.removeItem(buildSessionProgressStorageKey(persistKey));
  } catch {
    return;
  }
}

export function useSessionProgress(
  totalSegments: number,
  options?: {
    persistKey?: string;
    initialProgress?: SessionProgressSnapshot | null;
  }
) {
  const initialProgress = options?.initialProgress ?? null;
  const pendingRestoreRef = useRef(initialProgress);
  const appliedTotalRef = useRef<number | null>(null);

  const [segments, setSegments] = useState<ProgressSegmentState[]>(() => {
    if (initialProgress) return normalizeSegments(initialProgress.segments, totalSegments);
    return Array(Math.max(0, totalSegments)).fill(0);
  });
  const [pulses, setPulses] = useState<number[]>(() => Array(Math.max(0, totalSegments)).fill(0));
  const segmentsRef = useRef<ProgressSegmentState[]>(
    initialProgress
      ? normalizeSegments(initialProgress.segments, totalSegments)
      : (Array(Math.max(0, totalSegments)).fill(0) as ProgressSegmentState[]),
  );
  const keyToIndexRef = useRef<Map<string, number>>(
    initialProgress ? new Map(initialProgress.keyToIndex) : new Map(),
  );
  const indexToKeyRef = useRef<Array<string | null>>(Array(Math.max(0, totalSegments)).fill(null));
  const nextIndexRef = useRef(0);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const wasAllGreenRef = useRef(
    initialProgress
      ? areAllSegmentsGreen(normalizeSegments(initialProgress.segments, totalSegments))
      : false,
  );

  const trackAnswerAndCompletion = useCallback((nextSegments: ProgressSegmentState[]) => {
    const nextAllGreen = areAllSegmentsGreen(nextSegments);
    const exerciseId = options?.persistKey;
    if (exerciseId && shouldTrackKamehamehaCompletion(wasAllGreenRef.current, nextAllGreen)) {
      trackExerciseKamehameha(exerciseId);
    }
    wasAllGreenRef.current = nextAllGreen;
  }, [options?.persistKey]);

  useEffect(() => {
    const n = Math.max(0, totalSegments);
    const restore = pendingRestoreRef.current;
    if (restore && n > 0) {
      const nextSegments = hydrateSessionProgressSnapshot(restore, n, {
        segmentsRef,
        keyToIndexRef,
        indexToKeyRef,
        nextIndexRef,
      });
      setSegments(nextSegments);
      setPulses(Array(n).fill(0));
      pendingRestoreRef.current = null;
      appliedTotalRef.current = n;
      wasAllGreenRef.current = areAllSegmentsGreen(nextSegments);
      return;
    }
    if (restore && n === 0) return;

    // React Strict Mode re-runs this effect with the same totalSegments; keep hydrated state.
    if (appliedTotalRef.current === n) return;

    appliedTotalRef.current = n;
    segmentsRef.current = Array(n).fill(0);
    setSegments(Array(n).fill(0));
    setPulses(Array(n).fill(0));
    keyToIndexRef.current = new Map();
    indexToKeyRef.current = Array(n).fill(null);
    nextIndexRef.current = 0;
    wasAllGreenRef.current = false;
  }, [totalSegments]);

  const getProgressSnapshot = useCallback((): SessionProgressSnapshot => {
    return {
      segments: [...segmentsRef.current],
      keyToIndex: [...keyToIndexRef.current.entries()],
    };
  }, []);

  const record = useCallback((key: string, isCorrect: boolean) => {
    if (totalSegments <= 0) return;
    const map = keyToIndexRef.current;
    let idx = map.get(key);
    if (idx === undefined) {
      const empty = indexToKeyRef.current.indexOf(null);
      if (empty !== -1) {
        idx = empty;
      } else {
        idx = nextIndexRef.current;
        const oldKey = indexToKeyRef.current[idx];
        if (oldKey !== null) map.delete(oldKey);
        nextIndexRef.current = (idx + 1) % totalSegments;
      }
      map.set(key, idx);
      indexToKeyRef.current[idx] = key;
    }

    const base = segmentsRef.current.length === totalSegments
      ? segmentsRef.current
      : (Array(totalSegments).fill(0) as ProgressSegmentState[]);
    const nextSegments = [...base] as ProgressSegmentState[];
    nextSegments[idx] = isCorrect ? 1 : 2;
    segmentsRef.current = nextSegments;
    setSegments(nextSegments);

    setPulses(prev => {
      const next = prev.length === totalSegments ? [...prev] : Array(totalSegments).fill(0);
      next[idx] = (next[idx] ?? 0) + 1;
      return next;
    });

    if (options?.persistKey) {
      trackExerciseQuestion(options.persistKey, isCorrect);
      const ok = writePersistedSessionProgress(options.persistKey, nextSegments);
      if (ok) notifySessionProgressUpdated(options.persistKey);
    }
    trackAnswerAndCompletion(nextSegments);

    try {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextCtor();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCorrect ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isCorrect ? 880 : 220, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(isCorrect ? 0.05 : 0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isCorrect ? 0.12 : 0.18));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isCorrect ? 0.14 : 0.2));
    } catch {
      return;
    }
  }, [options?.persistKey, totalSegments, trackAnswerAndCompletion]);

  const getState = useCallback((key: string): ProgressSegmentState => {
    const idx = keyToIndexRef.current.get(key);
    if (idx === undefined) return 0;
    return segmentsRef.current[idx] ?? 0;
  }, []);

  const recordAt = useCallback((idx: number, isCorrect: boolean) => {
    if (totalSegments <= 0) return;
    if (!Number.isFinite(idx)) return;
    const slot = Math.floor(idx);
    if (slot < 0 || slot >= totalSegments) return;

    const base = segmentsRef.current.length === totalSegments
      ? segmentsRef.current
      : (Array(totalSegments).fill(0) as ProgressSegmentState[]);
    const nextSegments = [...base] as ProgressSegmentState[];
    nextSegments[slot] = isCorrect ? 1 : 2;
    segmentsRef.current = nextSegments;
    setSegments(nextSegments);

    setPulses(prev => {
      const next = prev.length === totalSegments ? [...prev] : Array(totalSegments).fill(0);
      next[slot] = (next[slot] ?? 0) + 1;
      return next;
    });

    if (options?.persistKey) {
      trackExerciseQuestion(options.persistKey, isCorrect);
      const ok = writePersistedSessionProgress(options.persistKey, nextSegments);
      if (ok) notifySessionProgressUpdated(options.persistKey);
    }
    trackAnswerAndCompletion(nextSegments);

    try {
      const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioContextCtor) return;
      if (!audioCtxRef.current) audioCtxRef.current = new AudioContextCtor();
      const ctx = audioCtxRef.current;
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isCorrect ? 'sine' : 'triangle';
      osc.frequency.setValueAtTime(isCorrect ? 880 : 220, now);
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(isCorrect ? 0.05 : 0.06, now + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (isCorrect ? 0.12 : 0.18));
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + (isCorrect ? 0.14 : 0.2));
    } catch {
      return;
    }
  }, [options?.persistKey, totalSegments, trackAnswerAndCompletion]);

  return useMemo(
    () => ({ segments, pulses, record, getState, recordAt, getProgressSnapshot }),
    [segments, pulses, record, getState, recordAt, getProgressSnapshot],
  );
}
