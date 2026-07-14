import { loadGoogleAnalytics } from './loadGoogleAnalytics';

const CHANNEL_KEY = 'nihongo.analytics.ga_channel';

export type GaTrackingChannel = 'gtag' | 'mp';

function readCachedChannel(): GaTrackingChannel | null {
  try {
    const value = sessionStorage.getItem(CHANNEL_KEY);
    if (value === 'mp') return 'mp';
  } catch {
    // ignore
  }
  return null;
}

export function isGaTrackingBlocked(): boolean {
  return readCachedChannel() === 'mp';
}

/** Call only when gtag.js fails to load (adblock). */
export function markGaTrackingBlocked(): void {
  try {
    sessionStorage.setItem(CHANNEL_KEY, 'mp');
  } catch {
    // ignore
  }
}

export function getCachedGaTrackingChannel(): GaTrackingChannel | null {
  return readCachedChannel();
}

/** One-time bootstrap on app start. MP fallback only on script error, never on timeout. */
export function bootstrapGaTrackingChannel(): Promise<GaTrackingChannel> {
  if (isGaTrackingBlocked()) return Promise.resolve('mp');

  return loadGoogleAnalytics().then((loaded) => {
    return loaded && !isGaTrackingBlocked() ? 'gtag' : 'mp';
  });
}

export function resolveGaTrackingChannel(): Promise<GaTrackingChannel> {
  return bootstrapGaTrackingChannel();
}

/** Test helper */
export function resetGaTrackingChannelCache(): void {
  try {
    sessionStorage.removeItem(CHANNEL_KEY);
  } catch {
    // ignore
  }
}
