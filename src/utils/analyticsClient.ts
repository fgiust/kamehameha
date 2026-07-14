import type { AnalyticsEventName, AnalyticsEventParams } from 'ga4-analytics';
import { runWhenIdle } from './runWhenIdle';

const CLIENT_ID_KEY = 'nihongo.analytics.client_id';

export function getOrCreateAnalyticsClientId(): string {
  try {
    const existing = localStorage.getItem(CLIENT_ID_KEY);
    if (existing) return existing;
    const id = crypto.randomUUID();
    localStorage.setItem(CLIENT_ID_KEY, id);
    return id;
  } catch {
    return crypto.randomUUID();
  }
}

function buildPageViewParams(pagePath: string): AnalyticsEventParams {
  const params: AnalyticsEventParams = {
    page_path: pagePath,
    page_location: `${window.location.origin}${pagePath.startsWith('/') ? pagePath : `/${pagePath}`}`,
    page_title: document.title,
    language: pagePath === '/it' || pagePath.startsWith('/it/') ? 'it' : 'en',
  };

  if (document.referrer) params.page_referrer = document.referrer;
  if (window.screen?.width) params.screen_width = window.screen.width;
  if (window.screen?.height) params.screen_height = window.screen.height;

  return params;
}

async function postAnalyticsEvent(
  name: AnalyticsEventName,
  params?: AnalyticsEventParams,
): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const payload = {
    client_id: getOrCreateAnalyticsClientId(),
    name,
    ...(params ? { params } : {}),
  };

  const body = JSON.stringify(payload);

  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([body], { type: 'application/json' });
      if (navigator.sendBeacon('/api/analytics', blob)) return true;
    }

    const response = await fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body,
      keepalive: true,
    });
    return response.status === 204 || response.ok;
  } catch {
    return false;
  }
}

export function trackAnalyticsPageView(pagePath: string): Promise<boolean> {
  return postAnalyticsEvent('page_view', buildPageViewParams(pagePath));
}

export function trackAnalyticsEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): Promise<boolean> {
  return postAnalyticsEvent(name, params);
}

export function scheduleAnalyticsPageView(pagePath: string): void {
  runWhenIdle(() => {
    void trackAnalyticsPageView(pagePath);
  });
}

export function scheduleAnalyticsEvent(
  name: Exclude<AnalyticsEventName, 'page_view'>,
  params: AnalyticsEventParams,
): void {
  runWhenIdle(() => {
    void trackAnalyticsEvent(name, params);
  });
}
