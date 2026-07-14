import { GA_MEASUREMENT_ID } from '../analytics/constants';
import { markGaTrackingBlocked } from './gaTrackingChannel';

const GTAG_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;
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
  const ready = typeof window.google_tag_manager === 'object' && window.google_tag_manager !== null;
  if (ready) {
    console.log('[GA4-DEBUG] google_tag_manager object detected in window, runtime is ready.');
  }
  return ready;
}

function initGtagStub(): void {
  window.dataLayer = window.dataLayer || [];
  if (typeof window.gtag === 'function') {
    console.log('[GA4-DEBUG] initGtagStub: window.gtag already exists', typeof window.gtag);
    return;
  }

  console.log('[GA4-DEBUG] initGtagStub: creating window.gtag stub');
  window.gtag = function gtag() {
    console.log('[GA4-DEBUG] gtag called with args:', Array.from(arguments));
    window.dataLayer!.push(arguments);
    console.log('[GA4-DEBUG] window.dataLayer length:', window.dataLayer!.length);
  } as Gtag;
}

function queueInitialConfig(): void {
  if (configQueued || typeof window.gtag !== 'function') {
    console.log('[GA4-DEBUG] queueInitialConfig: skipped', { configQueued, hasGtag: typeof window.gtag === 'function' });
    return;
  }
  configQueued = true;
  console.log('[GA4-DEBUG] queueInitialConfig: queueing js and config commands');
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

/** Queue gtag commands immediately; start loading gtag.js in the background. */
export function ensureGtagBootstrap(): void {
  if (typeof document === 'undefined') return;
  console.log('[GA4-DEBUG] ensureGtagBootstrap called');
  initGtagStub();
  queueInitialConfig();
  void loadGoogleAnalytics();
}

function markScriptLoaded(script: HTMLScriptElement): void {
  console.log('[GA4-DEBUG] markScriptLoaded: setting attribute ' + GTAG_LOADED_ATTR + ' on script');
  script.setAttribute(GTAG_LOADED_ATTR, '1');
  scriptLoaded = true;
}

function isScriptElementAlreadyLoaded(script: HTMLScriptElement): boolean {
  const hasLoadedAttr = script.getAttribute(GTAG_LOADED_ATTR) === '1';
  const hasGtmObject = isGtagRuntimeReady();
  const readyState = (script as HTMLScriptElement & { readyState?: string }).readyState;
  const hasReadyState = readyState === 'loaded' || readyState === 'complete';

  const isLoaded = hasLoadedAttr || hasGtmObject || hasReadyState;

  if (isLoaded) {
    console.log('[GA4-DEBUG] isScriptElementAlreadyLoaded details:', {
      hasLoadedAttr,
      hasGtmObject,
      readyState,
      hasReadyState
    });
  }
  return isLoaded;
}

function waitForScriptElement(script: HTMLScriptElement): Promise<boolean> {
  if (scriptLoaded || isScriptElementAlreadyLoaded(script)) {
    console.log('[GA4-DEBUG] waitForScriptElement: script already loaded');
    markScriptLoaded(script);
    return Promise.resolve(true);
  }

  console.log('[GA4-DEBUG] waitForScriptElement: waiting for script tag to load');
  return new Promise((resolve) => {
    let settled = false;
    const finishOk = () => {
      if (settled) return;
      settled = true;
      console.log('[GA4-DEBUG] waitForScriptElement: script load success!');
      window.clearInterval(pollId);
      markScriptLoaded(script);
      resolve(true);
    };
    const finishBlocked = () => {
      if (settled) return;
      settled = true;
      console.warn('[GA4-DEBUG] waitForScriptElement: script load error event! Adblock/Tracker blocker suspected!');
      window.clearInterval(pollId);
      markGaTrackingBlocked();
      scriptLoaded = false;
      loadPromise = null;
      resolve(false);
    };

    const pollId = window.setInterval(() => {
      if (isScriptElementAlreadyLoaded(script)) {
        console.log('[GA4-DEBUG] waitForScriptElement: poll detected script is loaded!');
        finishOk();
      }
    }, 50);

    script.addEventListener('load', () => {
      console.log('[GA4-DEBUG] waitForScriptElement: load event listener fired');
      finishOk();
    }, { once: true });
    script.addEventListener('error', () => {
      console.log('[GA4-DEBUG] waitForScriptElement: error event listener fired');
      finishBlocked();
    }, { once: true });
  });
}

export function isGoogleAnalyticsScriptLoaded(): boolean {
  const loaded = scriptLoaded || isGtagRuntimeReady();
  console.log('[GA4-DEBUG] isGoogleAnalyticsScriptLoaded check returning:', loaded);
  return loaded;
}

export function loadGoogleAnalytics(): Promise<boolean> {
  if (typeof document === 'undefined') return Promise.resolve(false);
  console.log('[GA4-DEBUG] loadGoogleAnalytics started. scriptLoaded state:', scriptLoaded);
  if (isGoogleAnalyticsScriptLoaded()) {
    console.log('[GA4-DEBUG] loadGoogleAnalytics: already loaded');
    scriptLoaded = true;
    return Promise.resolve(true);
  }
  if (loadPromise) {
    console.log('[GA4-DEBUG] loadGoogleAnalytics: returning existing loadPromise');
    return loadPromise;
  }

  loadPromise = (async () => {
    initGtagStub();
    queueInitialConfig();

    const existing = document.querySelector('script[src^="https://www.googletagmanager.com/gtag/js"]');
    if (existing instanceof HTMLScriptElement) {
      console.log('[GA4-DEBUG] loadGoogleAnalytics: found existing script tag');
      return waitForScriptElement(existing);
    }

    console.log('[GA4-DEBUG] loadGoogleAnalytics: creating and appending new script tag');
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
