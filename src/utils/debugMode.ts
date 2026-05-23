export const DEBUG_MODE_STORAGE_KEY = 'nihongo.debugMode';

export function isDebugModeEnabled(): boolean {
  try {
    return localStorage.getItem(DEBUG_MODE_STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

/** Apply `?debug=42` (on) or `?debug=off` (off). Returns whether state changed. */
export function syncDebugModeFromSearch(search: string): boolean {
  const params = new URLSearchParams(search);
  if (!params.has('debug')) return false;

  const value = params.get('debug');
  if (value === 'off') {
    try {
      localStorage.removeItem(DEBUG_MODE_STORAGE_KEY);
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event('nihongo-debug-mode-change'));
    return true;
  }
  if (value === '42') {
    try {
      localStorage.setItem(DEBUG_MODE_STORAGE_KEY, '1');
    } catch {
      /* noop */
    }
    window.dispatchEvent(new Event('nihongo-debug-mode-change'));
    return true;
  }
  return false;
}

/** One-shot URL trigger; does not persist (requires debug mode already on via `?debug=42`). */
export function isDebugAnimationRequest(search: string): boolean {
  return new URLSearchParams(search).get('debug') === 'animation';
}
