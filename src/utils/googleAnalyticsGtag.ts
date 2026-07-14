import type { AnalyticsEventParams } from '../analytics/types';
import { ensureGtagBootstrap } from './loadGoogleAnalytics';

export function trackGaPageview(pagePath: string): void {
  console.log('[GA4-DEBUG] trackGaPageview called for path:', pagePath);
  try {
    ensureGtagBootstrap();
    const gtag = window.gtag;
    if (!gtag) {
      console.error('[GA4-DEBUG] trackGaPageview error: window.gtag is not defined!');
      return;
    }

    const normalizedPath = pagePath.startsWith('/') ? pagePath : `/${pagePath}`;
    const pageLocation = `${window.location.origin}${normalizedPath}`;
    const pageTitle = document.title;

    console.log('[GA4-DEBUG] trackGaPageview: queuing page_view event', {
      page_path: normalizedPath,
      page_location: pageLocation,
      page_title: pageTitle
    });

    gtag('event', 'page_view', {
      page_path: normalizedPath,
      page_location: pageLocation,
      page_title: pageTitle,
      transport_type: 'beacon',
    });

    console.log('[GA4-DEBUG] trackGaPageview event queued successfully');
  } catch (err) {
    console.error('[GA4-DEBUG] trackGaPageview error caught:', err);
  }
}

export function trackGaEvent(name: string, params: AnalyticsEventParams): void {
  console.log('[GA4-DEBUG] trackGaEvent called for event:', name, 'params:', params);
  try {
    ensureGtagBootstrap();
    const gtag = window.gtag;
    if (!gtag) {
      console.error('[GA4-DEBUG] trackGaEvent error: window.gtag is not defined!');
      return;
    }
    gtag('event', name, {
      ...params,
      transport_type: 'beacon',
    });
    console.log('[GA4-DEBUG] trackGaEvent event queued successfully');
  } catch (err) {
    console.error('[GA4-DEBUG] trackGaEvent error caught:', err);
  }
}
