import { useMemo } from 'react';
import {
  type ExerciseSessionDraft,
  loadExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';

/** Loads a resumable session draft from sessionStorage (survives reload, not home navigation). */
export function useExerciseSessionDraft(
  persistKey: string | undefined,
  fingerprint: string,
): ExerciseSessionDraft | null {
  return useMemo(() => {
    if (!persistKey) return null;
    return loadExerciseSessionDraft(persistKey, fingerprint);
  }, [persistKey, fingerprint]);
}
