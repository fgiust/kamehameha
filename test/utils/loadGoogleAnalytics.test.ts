// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { trackGaPageview } from '../../src/utils/googleAnalyticsGtag';

describe('googleAnalyticsGtag', () => {
  it('does not send pageviews until gtag.js has loaded', () => {
    window.gtag = vi.fn();
    trackGaPageview('/test');
    expect(window.gtag).not.toHaveBeenCalled();
  });
});
