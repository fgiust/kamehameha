// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  getOrCreateAnalyticsClientId,
  getOrCreateAnalyticsSessionId,
  trackAnalyticsEvent,
  trackAnalyticsPageView,
} from '../../src/utils/analyticsClient';

describe('analyticsClient', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.restoreAllMocks();
    vi.stubGlobal('navigator', {
      ...navigator,
      sendBeacon: vi.fn().mockReturnValue(false),
    });
  });

  it('persists client_id in localStorage', () => {
    const first = getOrCreateAnalyticsClientId();
    const second = getOrCreateAnalyticsClientId();
    expect(first).toBe(second);
    expect(localStorage.getItem('nihongo.analytics.client_id')).toBe(first);
  });

  it('persists session_id in sessionStorage', () => {
    const first = getOrCreateAnalyticsSessionId(1_700_000_000_000);
    const second = getOrCreateAnalyticsSessionId(1_700_000_000_500);
    expect(first).toBe(second);
    expect(sessionStorage.getItem('nihongo.analytics.session_id')).toBe(String(first));
  });

  it('starts a new session after 30 minutes of inactivity', () => {
    const first = getOrCreateAnalyticsSessionId(1_700_000_000_000);
    const second = getOrCreateAnalyticsSessionId(1_700_000_000_000 + 30 * 60 * 1000 + 1);
    expect(second).toBeGreaterThan(first);
  });

  it('posts page_view to first-party analytics API', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    const ok = await trackAnalyticsPageView('/genki/17-2');
    expect(ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('/api/analytics');
    const body = JSON.parse(String(init.body)) as {
      name: string;
      params: {
        page_path: string;
        session_id: number;
        engagement_time_msec: number;
      };
    };
    expect(body.name).toBe('page_view');
    expect(body.params.page_path).toBe('/genki/17-2');
    expect(body.params.session_id).toEqual(expect.any(Number));
    expect(body.params.engagement_time_msec).toBe(100);
  });

  it('posts custom events', async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 204 });
    vi.stubGlobal('fetch', fetchMock);

    const ok = await trackAnalyticsEvent('kamehameha', { exercise: '/time' });
    expect(ok).toBe(true);

    const body = JSON.parse(String(fetchMock.mock.calls[0][1].body)) as {
      name: string;
      params: { exercise: string };
    };
    expect(body.name).toBe('kamehameha');
    expect(body.params.exercise).toBe('/time');
  });
});
