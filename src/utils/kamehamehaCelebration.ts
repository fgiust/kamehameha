type CelebrationAssets = {
  audioUrl: string;
  gifUrl: string;
};

let assetsPromise: Promise<CelebrationAssets> | null = null;

function loadCelebrationAssets(): Promise<CelebrationAssets> {
  if (!assetsPromise) {
    assetsPromise = Promise.all([
      import('../assets/kamehameha.mp3'),
      import('../assets/kamehameha.gif'),
    ]).then(([audioMod, gifMod]) => ({
      audioUrl: audioMod.default,
      gifUrl: gifMod.default,
    }));
  }
  return assetsPromise;
}

/** Play completion sound and return cache-bust key + GIF src for display. */
export async function triggerKamehamehaCelebration(): Promise<{ key: number; gifSrc: string }> {
  const key = Date.now();
  const { audioUrl, gifUrl } = await loadCelebrationAssets();
  const audio = new Audio(audioUrl);
  audio.play().catch(error => console.error('Audio play failed:', error));
  return { key, gifSrc: `${gifUrl}?v=${key}` };
}
