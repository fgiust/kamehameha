import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackGaPageview } from '../utils/googleAnalytics';
import { trackUmamiPageview } from '../utils/umami';

const TRACKER_READY_MAX_ATTEMPTS = 30;
const TRACKER_READY_RETRY_MS = 50;

export default function UmamiPageviews() {
  const location = useLocation();
  const pathKey = location.pathname + location.search;

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    let umamiSent = false;
    let gaSent = false;

    const send = () => {
      if (cancelled) return;

      if (!umamiSent && window.umami) {
        trackUmamiPageview(pathKey);
        umamiSent = true;
      }
      if (!gaSent && typeof window.gtag === 'function') {
        trackGaPageview(pathKey);
        gaSent = true;
      }

      if ((!umamiSent || !gaSent) && attempts < TRACKER_READY_MAX_ATTEMPTS) {
        attempts += 1;
        window.setTimeout(send, TRACKER_READY_RETRY_MS);
      }
    };

    send();
    return () => {
      cancelled = true;
    };
  }, [pathKey]);

  return null;
}
