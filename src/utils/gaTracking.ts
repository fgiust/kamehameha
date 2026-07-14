import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { resolveGaTrackingChannel } from './gaTrackingChannel';
import { isGoogleAnalyticsScriptLoaded } from './loadGoogleAnalytics';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';
import { runWhenIdle } from './runWhenIdle';

export function sendGaPageView(pagePath: string): Promise<void> {
  return resolveGaTrackingChannel().then((channel) => {
    if (channel === 'gtag' && isGoogleAnalyticsScriptLoaded()) {
      trackGaPageview(pagePath);
      return;
    }
    if (channel === 'gtag') {
      // Cached gtag but runtime not ready — fall back rather than drop the hit.
      return trackAnalyticsPageView(pagePath).then(() => undefined);
    }
    return trackAnalyticsPageView(pagePath).then(() => undefined);
  });
}

export function sendGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): Promise<void> {
  return resolveGaTrackingChannel().then((channel) => {
    if (channel === 'gtag' && isGoogleAnalyticsScriptLoaded()) {
      trackGaEvent(name, params);
      return;
    }
    if (channel === 'gtag') {
      return trackAnalyticsEvent(name, params).then(() => undefined);
    }
    return trackAnalyticsEvent(name, params).then(() => undefined);
  });
}

export function scheduleGaPageView(pagePath: string): void {
  runWhenIdle(() => {
    void sendGaPageView(pagePath);
  });
}

export function scheduleGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  runWhenIdle(() => {
    void sendGaEvent(name, params);
  });
}
