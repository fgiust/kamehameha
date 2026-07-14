import type { AnalyticsEventName, AnalyticsEventParams } from '../analytics/types';
import { runWhenIdle } from './runWhenIdle';

const CLIENT_ID_KEY = 'nihongo.analytics.client_id';
const SESSION_ID_KEY = 'nihongo.analytics.session_id';
const SESSION_LAST_ACTIVITY_KEY = 'nihongo.analytics.session_last_activity';
const SESSION_TIMEOUT_MS = 30 * 60 * 1000;
const DEFAULT_ENGAGEMENT_TIME_MSEC = 100;

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

/** GA4 MP requires session_id + engagement_time_msec for Realtime active users. */
export function getOrCreateAnalyticsSessionId(now = Date.now()): number {
  try {
    const storedId = sessionStorage.getItem(SESSION_ID_KEY);
    const lastActivityRaw = sessionStorage.getItem(SESSION_LAST_ACTIVITY_KEY);
    const lastActivity = lastActivityRaw ? Number(lastActivityRaw) : NaN;

    if (storedId && Number.isFinite(lastActivity) && now - lastActivity < SESSION_TIMEOUT_MS) {
      sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));
      return Number(storedId);
    }

    const sessionId = Math.floor(now / 1000);
    sessionStorage.setItem(SESSION_ID_KEY, String(sessionId));
    sessionStorage.setItem(SESSION_LAST_ACTIVITY_KEY, String(now));
    return sessionId;
  } catch {
    return Math.floor(now / 1000);
  }
}

function buildSessionParams(now = Date.now()): AnalyticsEventParams {
  return {
    session_id: getOrCreateAnalyticsSessionId(now),
    engagement_time_msec: DEFAULT_ENGAGEMENT_TIME_MSEC,
  };
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
    params: {
      ...buildSessionParams(),
      ...(params ?? {}),
    },
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
