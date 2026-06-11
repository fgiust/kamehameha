export type SpeechTestHighlightSegment = {
  text: string;
  highlight: boolean;
};

/** Split ruby notation into normal vs *highlighted* segments (markers are not included). */
export function parseSpeechTestHighlightSegments(text: string): SpeechTestHighlightSegment[] {
  const segments: SpeechTestHighlightSegment[] = [];
  let highlight = false;
  let buffer = '';

  const flush = () => {
    if (!buffer) return;
    segments.push({ text: buffer, highlight });
    buffer = '';
  };

  for (const ch of text) {
    if (ch === '*') {
      flush();
      highlight = !highlight;
      continue;
    }
    buffer += ch;
  }

  flush();
  return segments;
}

export function stripSpeechTestHighlightMarkers(text: string): string {
  return text.replace(/\*/g, '');
}
