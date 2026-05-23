import kamehamehaAudioUrl from '../assets/kamehameha.mp3';
import kamehamehaGifUrl from '../assets/kamehameha.gif';

/** Play completion sound and return a cache-bust key for the GIF. */
export function triggerKamehamehaCelebration(): number {
  const key = Date.now();
  const audio = new Audio(kamehamehaAudioUrl);
  audio.play().catch(e => console.error('Audio play failed:', e));
  return key;
}

export function kamehamehaGifSrc(key: number): string {
  return `${kamehamehaGifUrl}?v=${key}`;
}
