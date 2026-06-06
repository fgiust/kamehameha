import { describe, expect, it } from 'vitest';
import { pickBestSpeechVoice, type SpeechVoiceLike } from '../../src/utils/speechVoicePick';

function v(
  name: string,
  lang: string,
  opts: Partial<Pick<SpeechVoiceLike, 'localService' | 'default'>> = {},
): SpeechVoiceLike {
  return { name, lang, ...opts };
}

describe('pickBestSpeechVoice', () => {
  it('prefers local Samantha over Google cloud en-US', () => {
    const voices = [
      v('Google US English', 'en-US', { localService: false }),
      v('Samantha', 'en-US', { localService: true }),
    ];
    expect(pickBestSpeechVoice(voices, 'en-US')?.name).toBe('Samantha');
  });

  it('skips macOS compact / eloquence voices', () => {
    const voices = [
      v('Samantha (Compact)', 'en-US', { localService: true }),
      v('Alex', 'en-US', { localService: true }),
    ];
    expect(pickBestSpeechVoice(voices, 'en-US')?.name).toBe('Alex');
  });

  it('prefers exact lang match over prefix fallback', () => {
    const voices = [v('Daniel', 'en-GB', { localService: true }), v('Alex', 'en-US', { localService: true })];
    expect(pickBestSpeechVoice(voices, 'en-US')?.name).toBe('Alex');
  });

  it('falls back to en prefix when en-US missing', () => {
    const voices = [v('Daniel', 'en-GB', { localService: true })];
    expect(pickBestSpeechVoice(voices, 'en-US')?.name).toBe('Daniel');
  });

  it('prefers Alice for it-IT', () => {
    const voices = [
      v('Google italiano', 'it-IT', { localService: false }),
      v('Alice', 'it-IT', { localService: true }),
    ];
    expect(pickBestSpeechVoice(voices, 'it-IT')?.name).toBe('Alice');
  });

  it('prefers Kyoko for ja-JP', () => {
    const voices = [
      v('Google 日本語', 'ja-JP', { localService: false }),
      v('Kyoko', 'ja-JP', { localService: true }),
    ];
    expect(pickBestSpeechVoice(voices, 'ja-JP')?.name).toBe('Kyoko');
  });
});
