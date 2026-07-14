import { isGoogleAnalyticsScriptLoaded, loadGoogleAnalytics } from './loadGoogleAnalytics';

const CHANNEL_KEY = 'nihongo.analytics.ga_channel';

export type GaTrackingChannel = 'gtag' | 'mp';

function readCachedChannel(): GaTrackingChannel | null {
  try {
    const value = sessionStorage.getItem(CHANNEL_KEY);
    if (value === 'gtag' || value === 'mp') return value;
  } catch {
    // ignore
  }
  return null;
}

function cacheChannel(channel: GaTrackingChannel): void {
  try {
    sessionStorage.setItem(CHANNEL_KEY, channel);
  } catch {
    // ignore
  }
}

export function getCachedGaTrackingChannel(): GaTrackingChannel | null {
  return readCachedChannel();
}

/** Background probe: confirm gtag.js loads, or switch to MP for the tab. */
export function probeGaTrackingChannel(): Promise<GaTrackingChannel> {
  if (readCachedChannel() === 'mp') return Promise.resolve('mp');

  return loadGoogleAnalytics().then((loaded) => {
    const channel: GaTrackingChannel = loaded && isGoogleAnalyticsScriptLoaded() ? 'gtag' : 'mp';
    cacheChannel(channel);
    return channel;
  });
}

export function resolveGaTrackingChannel(): Promise<GaTrackingChannel> {
  return probeGaTrackingChannel();
}

/** Test helper */
export function resetGaTrackingChannelCache(): void {
  try {
    sessionStorage.removeItem(CHANNEL_KEY);
  } catch {
    // ignore
  }
}
