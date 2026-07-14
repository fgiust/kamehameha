import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { resolveGaTrackingChannel } from './gaTrackingChannel';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';
import { runWhenIdle } from './runWhenIdle';

export function sendGaPageView(pagePath: string): Promise<void> {
  return resolveGaTrackingChannel().then((channel) => {
    if (channel === 'gtag') {
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
  return resolveGaTrackingChannel().then((channel) => {
    if (channel === 'gtag') {
      trackGaEvent(name, params);
      return;
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
