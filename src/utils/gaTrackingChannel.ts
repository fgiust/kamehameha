import { loadGoogleAnalytics } from './loadGoogleAnalytics';

const CHANNEL_KEY = 'nihongo.analytics.ga_channel';

export type GaTrackingChannel = 'gtag' | 'mp';

let resolvePromise: Promise<GaTrackingChannel> | null = null;

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

async function probeChannel(): Promise<GaTrackingChannel> {
  const loaded = await loadGoogleAnalytics();
  const channel: GaTrackingChannel = loaded ? 'gtag' : 'mp';
  cacheChannel(channel);
  return channel;
}

/** Pick gtag when the script loads; otherwise Measurement Protocol for the rest of the tab session. */
export function resolveGaTrackingChannel(): Promise<GaTrackingChannel> {
  const cached = readCachedChannel();
  if (cached) return Promise.resolve(cached);

  if (!resolvePromise) {
    resolvePromise = probeChannel();
  }
  return resolvePromise;
}

/** Test helper */
export function resetGaTrackingChannelCache(): void {
  resolvePromise = null;
  try {
    sessionStorage.removeItem(CHANNEL_KEY);
  } catch {
    // ignore
  }
}
