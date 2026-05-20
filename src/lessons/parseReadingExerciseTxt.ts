import type { ReadingSessionData } from '../types';

export type ParseReadingExerciseTxtInput = {
  id: string;
  text: string;
  sourceName?: string;
};

function formatSourceLocation(sourceName: string | undefined, lineNumber: number | undefined) {
  if (!sourceName && !lineNumber) return '';
  if (!sourceName) return ` (line ${lineNumber})`;
  if (!lineNumber) return ` (${sourceName})`;
  return ` (${sourceName}:line ${lineNumber})`;
}

export function parseReadingExerciseTxt(input: ParseReadingExerciseTxtInput): ReadingSessionData {
  const sourceName = input.sourceName ?? input.id;
  const normalized = input.text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');

  let i = 0;
  const nextNonEmptyNonCommentLine = () => {
    while (i < lines.length) {
      const raw = lines[i];
      const trimmed = raw.trim();
      const lineNumber = i + 1;
      i += 1;

      if (trimmed.length === 0) continue;
      if (trimmed.startsWith('#')) continue;

      return { raw, trimmed, lineNumber };
    }
    return null;
  };

  const titleEnLine = nextNonEmptyNonCommentLine();
  if (!titleEnLine) throw new Error(`Invalid reading format: missing English title (${sourceName})`);

  const titleItLine = nextNonEmptyNonCommentLine();
  if (!titleItLine) throw new Error(`Invalid reading format: missing Italian title (${sourceName})`);

  const items: ReadingSessionData['items'] = [];

  for (let lineIndex = i; lineIndex < lines.length; lineIndex += 1) {
    const raw = lines[lineIndex] ?? '';
    const trimmed = raw.trim();
    if (trimmed.length === 0) continue;
    if (trimmed.startsWith('#')) continue;

    const parts = trimmed.split(/\s+/g);
    if (parts.length !== 2) {
      throw new Error(
        `Invalid reading format: each item line must have exactly 2 columns` +
          formatSourceLocation(sourceName, lineIndex + 1)
      );
    }

    items.push({ question: parts[0]!, answer: parts[1]! });
  }

  if (items.length === 0) throw new Error(`Invalid reading format: no items found (${sourceName})`);

  return {
    id: input.id,
    title: titleEnLine.trimmed,
    titleItalian: titleItLine.trimmed,
    items,
  };
}

