import { GA_MEASUREMENT_ID } from '../analytics/constants';

const GTAG_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
const GTAG_LOAD_TIMEOUT_MS = 8000;

let loadPromise: Promise<boolean> | null = null;
let scriptLoaded = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function initGtagStub(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

function waitForScriptElement(script: HTMLScriptElement): Promise<boolean> {
  return new Promise((resolve) => {
    if (scriptLoaded) {
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

    script.addEventListener('load', () => finish(true), { once: true });
    script.addEventListener('error', () => finish(false), { once: true });
    window.setTimeout(() => finish(false), GTAG_LOAD_TIMEOUT_MS);
  });
}

/** True only after googletagmanager.com/gtag/js loaded successfully (not the pre-load stub). */
export function isGoogleAnalyticsScriptLoaded(): boolean {
  return scriptLoaded;
}

export function loadGoogleAnalytics(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  if (scriptLoaded) return Promise.resolve(true);
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    initGtagStub();

    const existing = document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
    if (existing instanceof HTMLScriptElement) {
      return waitForScriptElement(existing);
    }

    const script = document.createElement('script');
    script.src = GTAG_SCRIPT;
    script.async = true;
    document.head.appendChild(script);
    return waitForScriptElement(script);
  })();

  return loadPromise;
}
