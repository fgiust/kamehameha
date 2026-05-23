import type { TranslateSessionData } from '../types';

export type ParseTranslateSessionTxtInput = {
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

export function parseTranslateSessionTxt(input: ParseTranslateSessionTxtInput): TranslateSessionData {
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
  if (!titleEnLine) {
    throw new Error(`Invalid translate session format: missing English title (${sourceName})`);
  }

  const titleItLine = nextNonEmptyNonCommentLine();
  if (!titleItLine) {
    throw new Error(`Invalid translate session format: missing Italian title (${sourceName})`);
  }

  const blocks: Array<{ startLine: number; lines: string[] }> = [];
  let currentBlock: string[] = [];
  let currentStartLine = i + 1;

  for (let lineIndex = i; lineIndex < lines.length; lineIndex += 1) {
    const raw = lines[lineIndex];
    const trimmed = raw.trim();

    if (trimmed.length === 0) {
      if (currentBlock.length > 0) {
        blocks.push({ startLine: currentStartLine, lines: currentBlock });
        currentBlock = [];
      }
      continue;
    }

    if (trimmed.startsWith('#')) continue;

    if (currentBlock.length === 0) {
      currentStartLine = lineIndex + 1;
    }
    currentBlock.push(raw);
  }

  if (currentBlock.length > 0) {
    blocks.push({ startLine: currentStartLine, lines: currentBlock });
  }

  const sentenceData: TranslateSessionData['sentenceData'] = [];

  for (const block of blocks) {
    const trimmedLines = block.lines.map(l => l.trim());
    const shouldIgnore = trimmedLines.some(l => l.startsWith('#'));
    if (shouldIgnore) continue;

    if (trimmedLines.length !== 3) {
      throw new Error(
        `Invalid translate session format: each exercise block must have exactly 3 lines` +
          formatSourceLocation(sourceName, block.startLine)
      );
    }

    sentenceData.push({
      english: trimmedLines[0],
      italian: trimmedLines[1],
      answer: trimmedLines[2],
    });
  }

  if (sentenceData.length === 0) {
    throw new Error(`Invalid translate session format: no exercise blocks found (${sourceName})`);
  }

  return {
    id: input.id,
    title: titleEnLine.trimmed,
    titleItalian: titleItLine.trimmed,
    sentenceData,
  };
}

