import type { AnalyticsEventParams } from '../analytics/types';
import { isGoogleAnalyticsScriptLoaded } from './loadGoogleAnalytics';

function getGtag() {
  if (!isGoogleAnalyticsScriptLoaded()) return undefined;
  return window.gtag;
}

export function trackGaPageview(pagePath: string): void {
  try {
    const gtag = getGtag();
    if (!gtag) return;

    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    const pageLocation = `${window.location.origin}${normalizedPath}`;
    const pageTitle = document.title;

    gtag('event', 'page_view', {
      page_path: normalizedPath,
      page_location: pageLocation,
      page_title: pageTitle,
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
