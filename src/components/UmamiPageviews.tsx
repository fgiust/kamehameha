import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { trackUmamiPageview } from '../utils/umami';

const UMAMI_READY_MAX_ATTEMPTS = 30;
const UMAMI_READY_RETRY_MS = 50;

export default function UmamiPageviews() {
  const location = useLocation();
  const pathKey = location.pathname + location.search;

  useEffect(() => {
    let cancelled = false;
    let attempts = 0;

    const send = () => {
      if (cancelled) return;
      if (window.umami) {
        trackUmamiPageview(pathKey);
        return;
      }
      if (attempts < UMAMI_READY_MAX_ATTEMPTS) {
        attempts += 1;
        window.setTimeout(send, UMAMI_READY_RETRY_MS);
      }
    };

    send();
    return () => {
      cancelled = true;
    };
  }, [pathKey]);

  return null;
}
