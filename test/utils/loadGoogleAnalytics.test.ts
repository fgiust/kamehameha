// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('../../src/utils/loadGoogleAnalytics', () => ({
  isGoogleAnalyticsScriptLoaded: vi.fn(),
}));

import { isGoogleAnalyticsScriptLoaded } from '../../src/utils/loadGoogleAnalytics';
import { trackGaPageview } from '../../src/utils/googleAnalyticsGtag';

describe('googleAnalyticsGtag', () => {
  beforeEach(() => {
    window.gtag = vi.fn();
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReset();
  });

  it('does not send pageviews until gtag.js has loaded', () => {
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(false);
    trackGaPageview('/test');
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('sends an explicit page_view event after gtag.js loads', () => {
    vi.mocked(isGoogleAnalyticsScriptLoaded).mockReturnValue(true);
    trackGaPageview('/genki/17-2');
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
      page_path: '/genki/17-2',
    }));
  });
});
