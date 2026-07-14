import { GA_MEASUREMENT_ID } from '../analytics/constants';
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
    gtag('config', GA_MEASUREMENT_ID, { page_path: pagePath });
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
