import type { AnalyticsEventParams } from '../analytics/types';
import { ensureGtagBootstrap } from './loadGoogleAnalytics';

export function trackGaPageview(pagePath: string): void {
  try {
    ensureGtagBootstrap();
    const gtag = window.gtag;
    if (!gtag) return;

    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    gtag('event', 'page_view', {
      page_path: normalizedPath,
      page_location: `${window.location.origin}${normalizedPath}`,
      page_title: document.title,
      transport_type: 'beacon',
    });
  } catch {
    // ignore
  }
}

export function trackGaEvent(name: string, params: AnalyticsEventParams): void {
  try {
    ensureGtagBootstrap();
    const gtag = window.gtag;
    if (!gtag) return;
    gtag('event', name, {
      ...params,
      transport_type: 'beacon',
    });
  } catch {
    // ignore
  }
}
