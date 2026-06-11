import { describe, expect, it } from 'vitest';
import {
  parseSpeechTestHighlightSegments,
  stripSpeechTestHighlightMarkers,
} from '../../src/utils/speechTestHighlight';

describe('speechTestHighlight', () => {
  it('parses alternating highlight segments', () => {
    expect(parseSpeechTestHighlightSegments('*雨[あめ]*が*飴[あめ]*')).toEqual([
      { text: '雨[あめ]', highlight: true },
      { text: 'が', highlight: false },
      { text: '飴[あめ]', highlight: true },
    ]);
  });

  it('strips highlight markers for speech', () => {
    expect(stripSpeechTestHighlightMarkers('店[みせ]で何[なに]か*買[か]*いましたか')).toBe(
      '店[みせ]で何[なに]か買[か]いましたか',
    );
  });
});
