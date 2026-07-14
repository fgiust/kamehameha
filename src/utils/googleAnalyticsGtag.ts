import type { AnalyticsEventParams } from '../analytics/types';
import { isGoogleAnalyticsScriptLoaded } from './loadGoogleAnalytics';

function getGtag(): ((...args: unknown[]) => void) | undefined {
  if (!isGoogleAnalyticsScriptLoaded()) return undefined;
  return window.gtag;
}

export function trackGaPageview(pagePath: string): void {
  try {
    const gtag = getGtag();
    if (!gtag) return;

    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    gtag('event', 'page_view', {
      page_path: normalizedPath,
      page_location: `${window.location.origin}${normalizedPath}`,
      page_title: document.title,
    });
  } catch {
    // ignore
  }
}

export function trackGaEvent(name: string, params: AnalyticsEventParams): void {
  try {
    const gtag = getGtag();
    if (!gtag) return;
    gtag('event', name, params);
  } catch {
    // ignore
  }
}
