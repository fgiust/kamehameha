import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import {
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from './analyticsClient';
import { resolveGaTrackingChannel } from './gaTrackingChannel';
import { trackGaEvent, trackGaPageview } from './googleAnalyticsGtag';
import { runWhenIdle } from './runWhenIdle';

export function scheduleGaPageView(pagePath: string): void {
  runWhenIdle(() => {
    void resolveGaTrackingChannel().then((channel) => {
      if (channel === 'gtag') {
        trackGaPageview(pagePath);
        return;
      }
      void trackAnalyticsPageView(pagePath);
    });
  });
}

export function scheduleGaEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  runWhenIdle(() => {
    void resolveGaTrackingChannel().then((channel) => {
      if (channel === 'gtag') {
        trackGaEvent(name, params);
        return;
      }
      void trackAnalyticsEvent(name, params);
    });
  });
}
