// @vitest-environment happy-dom
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { GA_MEASUREMENT_ID, trackGaPageview } from '../../src/utils/googleAnalytics';

describe('googleAnalytics', () => {
  const gtag = vi.fn();

  beforeEach(() => {
    gtag.mockClear();
    window.gtag = gtag;
  });

  afterEach(() => {
    window.gtag = undefined;
  });

  it('tracks pageviews with the current route', () => {
    trackGaPageview('/it/negativeform');
    expect(gtag).toHaveBeenCalledWith('config', GA_MEASUREMENT_ID, {
      page_path: '/it/negativeform',
    });
  });

  it('ignores calls when gtag is unavailable', () => {
    window.gtag = undefined;
    expect(() => trackGaPageview('/time')).not.toThrow();
  });
});
