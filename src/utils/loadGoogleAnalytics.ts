import { GA_MEASUREMENT_ID } from '../analytics/constants';

const GTAG_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
const GTAG_LOAD_TIMEOUT_MS = 4000;

let loadPromise: Promise<boolean> | null = null;
let scriptLoaded = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function initGtag(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

/** True only after googletagmanager.com/gtag/js loaded successfully (not the pre-load stub). */
export function isGoogleAnalyticsScriptLoaded(): boolean {
  return scriptLoaded;
}

export function loadGoogleAnalytics(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  if (scriptLoaded) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve) => {
    initGtag();

    const existing = document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
    if (existing) {
      scriptLoaded = true;
      resolve(true);
      return;
    }

    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      scriptLoaded = ok;
      resolve(ok);
    };

    const script = document.createElement('script');
    script.src = GTAG_SCRIPT;
    script.async = true;
    script.onload = () => finish(true);
    script.onerror = () => finish(false);
    document.head.appendChild(script);

    window.setTimeout(() => finish(false), GTAG_LOAD_TIMEOUT_MS);
  });

  return loadPromise;
}
