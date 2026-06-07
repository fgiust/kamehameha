type UmamiTracker = {
  track: (
    eventOrPayload: string | Record<string, unknown> | ((props: Record<string, unknown>) => Record<string, unknown>),
    data?: Record<string, unknown>,
  ) => void;
};

declare global {
  interface Window {
    umami?: UmamiTracker;
  }
}

function getUmami(): UmamiTracker | undefined {
  if (typeof window === 'undefined') return undefined;
  return window.umami;
}

export function trackUmamiEvent(name: string, data?: Record<string, string | number | boolean>): void {
  try {
    getUmami()?.track(name, data);
  } catch {
    return;
  }
}

export function trackUmamiPageview(url: string): void {
  try {
    const umami = getUmami();
    if (!umami) return;
    umami.track((props) => ({ ...props, url }));
  } catch {
    return;
  }
}
