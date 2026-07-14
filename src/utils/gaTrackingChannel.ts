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

async function resolveChannel(): Promise<GaTrackingChannel> {
  const cached = readCachedChannel();
  if (cached === 'mp') return 'mp';

  const loaded = await loadGoogleAnalytics();
  const channel: GaTrackingChannel = loaded && isGoogleAnalyticsScriptLoaded() ? 'gtag' : 'mp';
  cacheChannel(channel);
  return channel;
}

/**
 * Pick gtag when the script loads; otherwise Measurement Protocol for the tab session.
 * Cached "gtag" still re-loads the script on each page load — sessionStorage survives reloads
 * but the gtag module state and DOM script do not.
 */
export function resolveGaTrackingChannel(): Promise<GaTrackingChannel> {
  return resolveChannel();
}

/** Test helper */
export function resetGaTrackingChannelCache(): void {
  try {
    sessionStorage.removeItem(CHANNEL_KEY);
  } catch {
    // ignore
  }
}
