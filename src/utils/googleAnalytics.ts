export const GA_MEASUREMENT_ID = 'G-QEYQ7EPJXP';

declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (...args: unknown[]) => void;
  }
}

function getGtag(): ((...args: unknown[]) => void) | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.gtag;
}

export function trackGaPageview(pagePath: string): void {
  try {
    const gtag = getGtag();
    if (!gtag) return;
    gtag('config', GA_MEASUREMENT_ID, { page_path: pagePath });
  } catch {
    return;
  }
}
