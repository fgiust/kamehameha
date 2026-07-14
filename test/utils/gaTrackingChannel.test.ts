// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetGaTrackingChannelCache,
  resolveGaTrackingChannel,
} from '../../src/utils/gaTrackingChannel';

vi.mock('../../src/utils/loadGoogleAnalytics', () => ({
  isGoogleAnalyticsScriptLoaded: vi.fn(),
  loadGoogleAnalytics: vi.fn(),
}));

import {
  isGoogleAnalyticsScriptLoaded,
  loadGoogleAnalytics,
} from '../../src/utils/loadGoogleAnalytics';

describe('gaTrackingChannel', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetGaTrackingChannelCache();
    vi.mocked(loadGoogleAnalytics).mockReset();
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReset();
  });

  it('uses gtag when the script loads', async () => {
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(true);
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(true);
    await expect(resolveGaTrackingChannel()).resolves.toBe('gtag');
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBe('gtag');
    expect(loadGoogleAnalytics).toHaveBeenCalledTimes(1);
  });

  it('falls back to mp when the script fails to load', async () => {
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(false);
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(false);
    await expect(resolveGaTrackingChannel()).resolves.toBe('mp');
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBe('mp');
  });

  it('reuses mp without probing again', async () => {
    sessionStorage.setItem('nihongo.analytics.ga_channel', 'mp');
    await expect(resolveGaTrackingChannel()).resolves.toBe('mp');
    expect(loadGoogleAnalytics).not.toHaveBeenCalled();
  });

  it('still loads gtag when sessionStorage says gtag (e.g. after reload)', async () => {
    sessionStorage.setItem('nihongo.analytics.ga_channel', 'gtag');
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(true);
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(true);
    await expect(resolveGaTrackingChannel()).resolves.toBe('gtag');
    expect(loadGoogleAnalytics).toHaveBeenCalledTimes(1);
  });

  it('downgrades cached gtag to mp when the script no longer loads', async () => {
    sessionStorage.setItem('nihongo.analytics.ga_channel', 'gtag');
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(false);
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(false);
    await expect(resolveGaTrackingChannel()).resolves.toBe('mp');
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBe('mp');
  });
});
