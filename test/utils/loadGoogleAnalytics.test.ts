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

  it('queues gtag commands immediately via ensureGtagBootstrap', async () => {
    const { ensureGtagBootstrap } = await import('../../src/utils/loadGoogleAnalytics');
    ensureGtagBootstrap();
    expect(typeof window.gtag).toBe('function');
    expect(window.dataLayer?.length).toBeGreaterThan(0);
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
});

describe('googleAnalyticsGtag', () => {
  beforeEach(async () => {
    vi.resetModules();
    document.head.innerHTML = '';
    delete window.gtag;
    delete window.dataLayer;
    delete window.google_tag_manager;
    const mod = await import('../../src/utils/loadGoogleAnalytics');
    mod.resetGoogleAnalyticsLoaderState();
  });

  it('queues page_view immediately through gtag/dataLayer', async () => {
    const { trackGaPageview } = await import('../../src/utils/googleAnalyticsGtag');
    trackGaPageview('/genki/17-2');
    expect(window.dataLayer?.length).toBeGreaterThan(0);
    const lastEntry = window.dataLayer?.[window.dataLayer.length - 1] as unknown as IArguments;
    expect(lastEntry?.[0]).toBe('event');
    expect(lastEntry?.[1]).toBe('page_view');
  });
});
