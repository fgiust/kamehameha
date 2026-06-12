import { GA_MEASUREMENT_ID } from './googleAnalytics';

const GTAG_SCRIPT = `https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`;

let loadPromise: Promise<void> | null = null;

function initGtag(): void {
  window.dataLayer = window.dataLayer || [];
  window.gtag = window.gtag || function gtag(...args: unknown[]) {
    window.dataLayer!.push(args);
  };
  window.gtag('js', new Date());
  window.gtag('config', GA_MEASUREMENT_ID, { send_page_view: false });
}

export function loadGoogleAnalytics(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (window.gtag) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    initGtag();

    const existing = document.querySelector(`script[src^="https://www.googletagmanager.com/gtag/js"]`);
    if (existing) {
      resolve();
      return;
    }

    const script = document.createElement('script');
    script.src = GTAG_SCRIPT;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Analytics script failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
