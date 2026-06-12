/** Run callback after the browser is idle (or after a short timeout fallback). */
export function runWhenIdle(callback: () => void, timeoutMs = 3000): void {
  if (typeof window === 'undefined') return;
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => callback(), { timeout: timeoutMs });
    return;
  }
  globalThis.setTimeout(callback, Math.min(timeoutMs, 2000));
}
