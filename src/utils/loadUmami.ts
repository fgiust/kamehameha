const UMAMI_SCRIPT = 'https://cloud.umami.is/script.js';
const UMAMI_WEBSITE_ID = '2b463d63-0a4b-43ad-a817-4789dfbd3b6d';

let loadPromise: Promise<void> | null = null;

export function loadUmami(): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve();
  if (window.umami) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const existing = document.querySelector(`script[src="${UMAMI_SCRIPT}"]`);
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.src = UMAMI_SCRIPT;
    script.defer = true;
    script.dataset.websiteId = UMAMI_WEBSITE_ID;
    script.dataset.autoTrack = 'false';
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Umami script failed to load'));
    document.head.appendChild(script);
  });

  return loadPromise;
}
