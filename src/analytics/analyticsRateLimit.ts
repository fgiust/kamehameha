import { ANALYTICS_RATE_LIMIT_PER_MINUTE } from './ga4Constants';

const WINDOW_MS = 60_000;
const hitsByKey = new Map<string, number[]>();

export function isAnalyticsRateLimited(key: string, now = Date.now()): boolean {
  const recent = (hitsByKey.get(key) ?? []).filter((timestamp) => now - timestamp < WINDOW_MS);
  if (recent.length >= ANALYTICS_RATE_LIMIT_PER_MINUTE) {
    hitsByKey.set(key, recent);
    return true;
  }

  recent.push(now);
  hitsByKey.set(key, recent);
  return false;
}

/** Test helper */
export function resetAnalyticsRateLimit(): void {
  hitsByKey.clear();
}
