import { afterEach, describe, expect, it } from 'vitest';
import {
  ANALYTICS_RATE_LIMIT_PER_MINUTE,
} from '../../src/analytics/ga4Constants';
import {
  isAnalyticsRateLimited,
  resetAnalyticsRateLimit,
} from '../../src/analytics/analyticsRateLimit';

describe('analyticsRateLimit', () => {
  afterEach(() => {
    resetAnalyticsRateLimit();
  });

  it('allows requests under the per-minute limit', () => {
    const key = '203.0.113.10';
    for (let i = 0; i < ANALYTICS_RATE_LIMIT_PER_MINUTE; i += 1) {
      expect(isAnalyticsRateLimited(key, 1_000 + i)).toBe(false);
    }
  });

  it('blocks requests once the limit is exceeded', () => {
    const key = '203.0.113.10';
    for (let i = 0; i < ANALYTICS_RATE_LIMIT_PER_MINUTE; i += 1) {
      isAnalyticsRateLimited(key, 1_000 + i);
    }
    expect(isAnalyticsRateLimited(key, 1_000 + ANALYTICS_RATE_LIMIT_PER_MINUTE)).toBe(true);
  });

  it('resets the window after one minute', () => {
    const key = '203.0.113.10';
    for (let i = 0; i < ANALYTICS_RATE_LIMIT_PER_MINUTE; i += 1) {
      isAnalyticsRateLimited(key, 1_000 + i);
    }
    expect(isAnalyticsRateLimited(key, 62_000)).toBe(false);
  });
});
