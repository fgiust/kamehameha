import { useCallback, useEffect, useRef, useState } from 'react';

/** Briefly shows the "answer undone" message in the answer-banner slot. */
export function useAnswerUndoneBanner(durationMs = 1600) {
  const [undoneBanner, setUndoneBanner] = useState(false);
  const timerRef = useRef<number | null>(null);

  const showUndoneBanner = useCallback(() => {
    if (timerRef.current !== null) {
      window.clearTimeout(timerRef.current);
    }
    setUndoneBanner(true);
    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      setUndoneBanner(false);
    }, durationMs);
  }, [durationMs]);

  useEffect(() => {
    return () => {
      if (timerRef.current !== null) {
        window.clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { undoneBanner, showUndoneBanner };
}
