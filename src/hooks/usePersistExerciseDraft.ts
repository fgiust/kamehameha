import { useCallback, useEffect, useRef } from 'react';
import {
  type ExerciseSessionDraft,
  saveExerciseSessionDraft,
} from '../utils/exerciseSessionDraft';

type DraftPayload = Omit<ExerciseSessionDraft, 'version' | 'persistKey' | 'fingerprint' | 'savedAt'>;

export function usePersistExerciseDraft(
  persistKey: string | undefined,
  fingerprint: string,
  buildDraft: () => DraftPayload | null,
  deps: React.DependencyList,
) {
  const buildRef = useRef(buildDraft);
  buildRef.current = buildDraft;

  const persistNow = useCallback(() => {
    if (!persistKey) return;
    const payload = buildRef.current();
    if (!payload) return;
    saveExerciseSessionDraft({
      version: 1,
      persistKey,
      fingerprint,
      savedAt: Date.now(),
      ...payload,
    });
  }, [persistKey, fingerprint]);

  useEffect(() => {
    if (!persistKey) return;
    const timer = window.setTimeout(() => persistNow(), 300);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- caller supplies full snapshot deps
  }, [persistKey, persistNow, ...deps]);

  useEffect(() => {
    if (!persistKey) return;
    const onPageHide = () => persistNow();
    window.addEventListener('pagehide', onPageHide);
    return () => window.removeEventListener('pagehide', onPageHide);
  }, [persistKey, persistNow]);

  return { persistNow };
}
