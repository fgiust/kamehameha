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
  const cached = readCachedChannel();
  return cached === 'mp';
}

/** Call only when gtag.js fails to load (adblock). */
export function markGaTrackingBlocked(): void {
  console.log('[GA4-DEBUG] markGaTrackingBlocked called! Saving "mp" channel to sessionStorage.');
  try {
    sessionStorage.setItem(CHANNEL_KEY, 'mp');
  } catch (err) {
    console.error('[GA4-DEBUG] Failed to save ga_channel to sessionStorage:', err);
  }
}

export function getCachedGaTrackingChannel(): GaTrackingChannel | null {
  return readCachedChannel();
}

/** One-time bootstrap on app start. MP fallback only on script error, never on timeout. */
export function bootstrapGaTrackingChannel(): Promise<GaTrackingChannel> {
  const isBlocked = isGaTrackingBlocked();
  console.log('[GA4-DEBUG] bootstrapGaTrackingChannel called. isGaTrackingBlocked:', isBlocked);
  if (isBlocked) {
    console.log('[GA4-DEBUG] bootstrapGaTrackingChannel: already blocked, resolving to "mp"');
    return Promise.resolve('mp');
  }

  console.log('[GA4-DEBUG] bootstrapGaTrackingChannel: loading google analytics...');
  return loadGoogleAnalytics().then((loaded) => {
    const finalBlockedState = isGaTrackingBlocked();
    console.log('[GA4-DEBUG] bootstrapGaTrackingChannel resolved with loaded:', loaded, 'finalBlockedState:', finalBlockedState);
    return loaded && !finalBlockedState ? 'gtag' : 'mp';
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
