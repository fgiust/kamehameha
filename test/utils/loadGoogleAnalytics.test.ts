// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('loadGoogleAnalytics', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.head.innerHTML = '';
    delete window.gtag;
    delete window.dataLayer;
    delete window.google_tag_manager;
    const mod = await import('../../src/utils/loadGoogleAnalytics');
    mod.resetGoogleAnalyticsLoaderState();
  });

  it('detects an already-loaded gtag script without waiting for load again', async () => {
    const { loadGoogleAnalytics, isGoogleAnalyticsScriptLoaded } =
      await import('../../src/utils/loadGoogleAnalytics');

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-TEST';
    script.setAttribute('data-ga-loaded', '1');
    document.head.appendChild(script);
    window.google_tag_manager = {};

    await expect(loadGoogleAnalytics()).resolves.toBe(true);
    expect(isGoogleAnalyticsScriptLoaded()).toBe(true);
  });

  it('resolves as soon as the runtime is ready even if load listeners were missed', async () => {
    const { loadGoogleAnalytics } = await import('../../src/utils/loadGoogleAnalytics');

    const script = document.createElement('script');
    script.src = 'https://www.googletagmanager.com/gtag/js?id=G-TEST';
    document.head.appendChild(script);
    window.google_tag_manager = {};

    await expect(loadGoogleAnalytics()).resolves.toBe(true);
  });
});

describe('googleAnalyticsGtag', () => {
  beforeEach(() => {
    window.gtag = vi.fn();
    vi.resetModules();
  });

  it('does not send pageviews until gtag.js has loaded', async () => {
    vi.doMock('../../src/utils/loadGoogleAnalytics', () => ({
      isGoogleAnalyticsScriptLoaded: () => false,
    }));
    const { trackGaPageview } = await import('../../src/utils/googleAnalyticsGtag');
    trackGaPageview('/test');
    expect(window.gtag).not.toHaveBeenCalled();
  });

  it('sends an explicit page_view event after gtag.js loads', async () => {
    vi.doMock('../../src/utils/loadGoogleAnalytics', () => ({
      isGoogleAnalyticsScriptLoaded: () => true,
    }));
    const { trackGaPageview } = await import('../../src/utils/googleAnalyticsGtag');
    trackGaPageview('/genki/17-2');
    expect(window.gtag).toHaveBeenCalledWith('event', 'page_view', expect.objectContaining({
      page_path: '/genki/17-2',
    }));
  });
});
