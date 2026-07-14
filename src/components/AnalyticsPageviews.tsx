import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { sendGaPageView } from '../utils/gaTracking';
import { loadUmami } from '../utils/loadUmami';
import { runWhenIdle } from '../utils/runWhenIdle';
import { trackUmamiPageview } from '../utils/umami';

const TRACKER_READY_MAX_ATTEMPTS = 30;
const TRACKER_READY_RETRY_MS = 50;

export default function AnalyticsPageviews() {
  const location = useLocation();
  const pathKey = location.pathname + location.search;

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let umamiSent = false;

    const sendUmami = () => {
      if (cancelled || umamiSent) return;
      if (!window.umami) {
        if (attempts < TRACKER_READY_MAX_ATTEMPTS) {
          attempts += 1;
          window.setTimeout(sendUmami, TRACKER_READY_RETRY_MS);
        }
        return;
      }
      trackUmamiPageview(pathKey);
      umamiSent = true;
    };

    void sendGaPageView(pathKey);

    runWhenIdle(() => {
      if (cancelled) return;
      void loadUmami().finally(() => {
        if (!cancelled) sendUmami();
      });
    });

    return () => {
      cancelled = true;
    };
  }, [pathKey]);

  return null;
}
