import { GA_MEASUREMENT_ID } from '../analytics/constants';

const GTAG_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
const GTAG_LOAD_TIMEOUT_MS = 8000;
const GTAG_LOADED_ATTR = 'data-ga-loaded';

let loadPromise: Promise<boolean> | null = null;
let scriptLoaded = false;

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: Gtag;
    google_tag_manager?: Record<string, unknown>;
  }
}

type Gtag = {
  (command: 'js', date: Date): void;
  (command: 'config', measurementId: string, params?: Record<string, unknown>): void;
  (command: 'event', eventName: string, params?: Record<string, unknown>): void;
};

function initGtagStub(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') return;

  // Official GA snippet uses `arguments`, not a rest-params array — gtag.js expects that shape.
  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  } as Gtag;
}

export function applyGoogleAnalyticsConfig(): void {
  if (typeof window.gtag !== 'function') return;
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

function markScriptLoaded(script: HTMLScriptElement): void {
  script.setAttribute(GTAG_LOADED_ATTR, '1');
  scriptLoaded = true;
  applyGoogleAnalyticsConfig();
}

function waitForScriptElement(script: HTMLScriptElement): Promise<boolean> {
  if (script.getAttribute(GTAG_LOADED_ATTR) === '1' && scriptLoaded) {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      if (ok) {
        markScriptLoaded(script);
      } else {
        scriptLoaded = false;
        script.remove();
        loadPromise = null;
      }
      resolve(ok);
    };

    script.addEventListener('load', () => finish(true), { once: true });
    script.addEventListener('error', () => finish(false), { once: true });
    window.setTimeout(() => finish(false), GTAG_LOAD_TIMEOUT_MS);
  });
}

/** True only after googletagmanager.com/gtag/js loaded and config applied. */
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

/** Test helper */
export function resetGoogleAnalyticsLoaderState(): void {
  loadPromise = null;
  scriptLoaded = false;
}
