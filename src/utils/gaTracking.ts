import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { isGaTrackingBlocked } from './gaTrackingChannel';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';

export function sendGaPageView(pagePath: string): void {
  if (isGaTrackingBlocked()) {
    void trackAnalyticsPageView(pagePath);
    return;
  }
  trackGaPageview(pagePath);
}

export function sendGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  if (isGaTrackingBlocked()) {
    void trackAnalyticsEvent(name, params);
    return;
  }
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
