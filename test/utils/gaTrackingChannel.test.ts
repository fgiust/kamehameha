// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  bootstrapGaTrackingChannel,
  markGaTrackingBlocked,
  resetGaTrackingChannelCache,
  resolveGaTrackingChannel,
} from '../../src/utils/gaTrackingChannel';

vi.mock('../../src/utils/loadGoogleAnalytics', () => ({
  isGoogleAnalyticsScriptLoaded: vi.fn(),
  loadGoogleAnalytics: vi.fn(),
}));

import { isGoogleAnalyticsScriptLoaded, loadGoogleAnalytics } from '../../src/utils/loadGoogleAnalytics';

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
    await expect(bootstrapGaTrackingChannel()).resolves.toBe('gtag');
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBeNull();
  });

  it('marks mp only when explicitly blocked', async () => {
    markGaTrackingBlocked();
    await expect(resolveGaTrackingChannel()).resolves.toBe('mp');
    expect(loadGoogleAnalytics).not.toHaveBeenCalled();
  });

  it('does not persist gtag in sessionStorage', async () => {
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(true);
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(true);
    await bootstrapGaTrackingChannel();
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBeNull();
  });
});
