import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { resolveGaTrackingChannel } from './gaTrackingChannel';
import { isGoogleAnalyticsScriptLoaded } from './loadGoogleAnalytics';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';

export function sendGaPageView(pagePath: string): Promise<void> {
  if (isGoogleAnalyticsScriptLoaded()) {
    trackGaPageview(pagePath);
    return Promise.resolve();
  }

  return resolveGaTrackingChannel().then((channel) => {
    if (channel === 'gtag' && isGoogleAnalyticsScriptLoaded()) {
      trackGaPageview(pagePath);
      return;
    }
    return trackAnalyticsPageView(pagePath).then(() => undefined);
  });
}

export function sendGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): Promise<void> {
  if (isGoogleAnalyticsScriptLoaded()) {
    trackGaEvent(name, params);
    return Promise.resolve();
  }

  return resolveGaTrackingChannel().then((channel) => {
    if (channel === 'gtag' && isGoogleAnalyticsScriptLoaded()) {
      trackGaEvent(name, params);
      return;
    }
    return trackAnalyticsEvent(name, params).then(() => undefined);
  });
}

export function scheduleGaPageView(pagePath: string): void {
  void sendGaPageView(pagePath);
}

export function scheduleGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  void sendGaEvent(name, params);
}
