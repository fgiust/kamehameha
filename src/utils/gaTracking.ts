import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { isGaTrackingBlocked } from './gaTrackingChannel';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';

export function sendGaPageView(pagePath: string): void {
  const isBlocked = isGaTrackingBlocked();
  console.log('[GA4-DEBUG] sendGaPageView called for pagePath:', pagePath, 'isGaTrackingBlocked:', isBlocked);
  if (isBlocked) {
    console.log('[GA4-DEBUG] sendGaPageView routing to Measurement Protocol proxy (api/analytics)');
    void trackAnalyticsPageView(pagePath);
    return;
  }
  console.log('[GA4-DEBUG] sendGaPageView routing to standard client-side gtag.js');
  trackGaPageview(pagePath);
}

export function sendGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  const isBlocked = isGaTrackingBlocked();
  console.log('[GA4-DEBUG] sendGaEvent called for event:', name, 'isGaTrackingBlocked:', isBlocked);
  if (isBlocked) {
    console.log('[GA4-DEBUG] sendGaEvent routing to Measurement Protocol proxy (api/analytics)');
    void trackAnalyticsEvent(name, params);
    return;
  }
  console.log('[GA4-DEBUG] sendGaEvent routing to standard client-side gtag.js');
  trackGaEvent(name, params);
}

export function scheduleGaPageView(pagePath: string): void {
  sendGaPageView(pagePath);
}

export function scheduleGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  sendGaEvent(name, params);
}
