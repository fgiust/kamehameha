// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  resetGaTrackingChannelCache,
  resolveGaTrackingChannel,
} from '../../src/utils/gaTrackingChannel';

vi.mock('../../src/utils/loadGoogleAnalytics', () => ({
  loadGoogleAnalytics: vi.fn(),
}));

import { loadGoogleAnalytics } from '../../src/utils/loadGoogleAnalytics';

describe('gaTrackingChannel', () => {
  beforeEach(() => {
    sessionStorage.clear();
    resetGaTrackingChannelCache();
    vi.mocked(loadGoogleAnalytics).mockReset();
  });

  it('uses gtag when the script loads', async () => {
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(true);
    await expect(resolveGaTrackingChannel()).resolves.toBe('gtag');
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBe('gtag');
    expect(loadGoogleAnalytics).toHaveBeenCalledTimes(1);
  });

  it('falls back to mp when the script fails to load', async () => {
    vi.mocked(loadGoogleAnalytics).mockResolvedValue(false);
    await expect(resolveGaTrackingChannel()).resolves.toBe('mp');
    expect(sessionStorage.getItem('nihongo.analytics.ga_channel')).toBe('mp');
  });

  it('reuses the cached channel without probing again', async () => {
    sessionStorage.setItem('nihongo.analytics.ga_channel', 'mp');
    await expect(resolveGaTrackingChannel()).resolves.toBe('mp');
    expect(loadGoogleAnalytics).not.toHaveBeenCalled();
  });
});
