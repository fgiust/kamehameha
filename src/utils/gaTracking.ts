import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { getCachedGaTrackingChannel, probeGaTrackingChannel } from './gaTrackingChannel';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';

export function sendGaPageView(pagePath: string): void {
  if (getCachedGaTrackingChannel() === 'mp') {
    void trackAnalyticsPageView(pagePath);
    return;
  }

  trackGaPageview(pagePath);
  void probeGaTrackingChannel();
}

export function sendGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  if (getCachedGaTrackingChannel() === 'mp') {
    void trackAnalyticsEvent(name, params);
    return;
  }

  trackGaEvent(name, params);
  void probeGaTrackingChannel();
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
