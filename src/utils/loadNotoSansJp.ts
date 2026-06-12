import { runWhenIdle } from './runWhenIdle';

let loadPromise: Promise<void> | null = null;

/** Load Japanese UI font weights after first paint (non-blocking). */
export function loadNotoSansJp(): Promise<void> {
  if (loadPromise) return loadPromise;
  loadPromise = Promise.all([
    import('@fontsource/noto-sans-jp/japanese-400.css'),
    import('@fontsource/noto-sans-jp/japanese-500.css'),
    import('@fontsource/noto-sans-jp/japanese-700.css'),
  ]).then(() => undefined);
  return loadPromise;
}

export function scheduleNotoSansJpLoad(): void {
  runWhenIdle(() => {
    void loadNotoSansJp();
  });
}
