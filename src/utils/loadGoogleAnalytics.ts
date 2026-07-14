import { GA_MEASUREMENT_ID } from '../analytics/constants';

const GTAG_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
const GTAG_LOAD_TIMEOUT_MS = 3000;
const GTAG_POLL_MS = 50;
const GTAG_LOADED_ATTR = 'data-ga-loaded';

let loadPromise: Promise<boolean> | null = null;
let scriptLoaded = false;
let configQueued = false;

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

function isGtagRuntimeReady(): boolean {
  return typeof window.google_tag_manager === 'object' && window.google_tag_manager !== null;
}

function initGtagStub(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') return;

  window.gtag = function gtag() {
    window.dataLayer!.push(arguments);
  } as Gtag;
}

function queueInitialConfig(): void {
  if (configQueued || typeof window.gtag !== 'function') return;
  configQueued = true;
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

/** Queue gtag commands immediately; start loading gtag.js in the background. */
export function ensureGtagBootstrap(): void {
  if (typeof document === 'undefined') return;
  initGtagStub();
  queueInitialConfig();
  void loadGoogleAnalytics();
}

function markScriptLoaded(script: HTMLScriptElement): void {
  script.setAttribute(GTAG_LOADED_ATTR, '1');
  scriptLoaded = true;
}

function isScriptElementAlreadyLoaded(script: HTMLScriptElement): boolean {
  if (script.getAttribute(GTAG_LOADED_ATTR) === '1') return true;
  if (isGtagRuntimeReady()) return true;

  const readyState = (script as HTMLScriptElement & { readyState?: string }).readyState;
  return readyState === 'loaded' || readyState === 'complete';
}

function waitForScriptElement(script: HTMLScriptElement): Promise<boolean> {
  if (scriptLoaded || isScriptElementAlreadyLoaded(script)) {
    markScriptLoaded(script);
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    let settled = false;
    const finish = (ok: boolean) => {
      if (settled) return;
      settled = true;
      window.clearInterval(pollId);
      window.clearTimeout(timeoutId);
      if (ok || isGtagRuntimeReady()) {
        markScriptLoaded(script);
        resolve(true);
        return;
      }
      scriptLoaded = false;
      loadPromise = null;
      resolve(false);
    };

    const pollId = window.setInterval(() => {
      if (isGtagRuntimeReady()) finish(true);
    }, GTAG_POLL_MS);

    const timeoutId = window.setTimeout(() => finish(isGtagRuntimeReady()), GTAG_LOAD_TIMEOUT_MS);
    script.addEventListener('load', () => finish(true), { once: true });
    script.addEventListener('error', () => finish(false), { once: true });
  });
}

export function isGoogleAnalyticsScriptLoaded(): boolean {
  return scriptLoaded || isGtagRuntimeReady();
}

export function loadGoogleAnalytics(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  if (isGoogleAnalyticsScriptLoaded()) {
    scriptLoaded = true;
    return Promise.resolve(true);
  }
  if (loadPromise) return loadPromise;

  loadPromise = (async () => {
    initGtagStub();
    queueInitialConfig();

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
  configQueued = false;
}
