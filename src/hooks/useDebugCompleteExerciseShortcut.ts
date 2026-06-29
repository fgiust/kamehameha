import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { clearExerciseSessionDraft } from '../utils/exerciseSessionDraft';
import { getLanguageFromPathname, localizePath } from '../seo/localizedPaths';
import { notifySessionProgressUpdated, writePersistedSessionProgressRecord, type ProgressSegmentState } from './useSessionProgress';
import { useDebugMode } from './useDebugMode';

type Options = {
  persistKey?: string;
  totalSegments: number;
};

const DEBUG_COMPLETE_KEY = 'y';

export function useDebugCompleteExerciseShortcut({ persistKey, totalSegments }: Options) {
  const debugMode = useDebugMode();
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!debugMode || !persistKey || totalSegments <= 0) return;

    const onKeyDown = (event: KeyboardEvent) => {
      const hasCommandKey = event.metaKey || event.ctrlKey;
      if (!hasCommandKey || !event.shiftKey || event.altKey || event.repeat) return;
      if (event.key.toLowerCase() !== DEBUG_COMPLETE_KEY) return;

      const segments = Array(totalSegments).fill(1) as ProgressSegmentState[];
      const saved = writePersistedSessionProgressRecord(persistKey, segments);
      clearExerciseSessionDraft(persistKey);
      if (saved) notifySessionProgressUpdated(persistKey);

      event.preventDefault();
      const lang = getLanguageFromPathname(location.pathname) ?? 'en';
      navigate(localizePath('/', lang), { state: { restoreScroll: true } });
    };

    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [debugMode, location.pathname, navigate, persistKey, totalSegments]);
}
