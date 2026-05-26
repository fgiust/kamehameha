import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { isEditableSentenceDataFile } from './lessonDataFile';

export type TranslateBlockSpan = {
  /** 0-based index among exercise blocks (matches sentenceData index). */
  blockIndex: number;
  /** 0-based line index in the file for the first line of the block. */
  startLine: number;
};

function isCommentLine(line: string): boolean {
  return line.trim().startsWith('#');
}

/**
 * Lists exercise blocks in a translate session file (same rules as parseTranslateSessionTxt).
 * Each block is exactly 3 lines; blocks containing a commented line are skipped.
 */
export function listTranslateBlocks(lines: string[]): TranslateBlockSpan[] {
  const blocks: TranslateBlockSpan[] = [];
  let i = 0;

  if (lines.length < 3) return blocks;
  i = 2;
  if (lines[i]?.trim() !== '') i++;
  else i++;

  while (i < lines.length) {
    while (i < lines.length && (lines[i]!.trim() === '' || isCommentLine(lines[i]!))) i++;
    if (i >= lines.length) break;

    const startLine = i;
    const block = lines.slice(i, i + 3);
    if (block.length < 3 || block.some(l => l === undefined)) break;

    const trimmed = block.map(l => l.trim());
    const shouldIgnore = trimmed.some(l => l.startsWith('#'));
    if (!shouldIgnore) {
      blocks.push({ blockIndex: blocks.length, startLine });
    }
    i += 3;
  }

  return blocks;
}

export type UpdateTranslateBlockInput = {
  dataDir: string;
  fileName: string;
  blockIndex: number;
  english: string;
  italian: string;
  answer: string;
};

export function updateTranslateBlockInFile(input: UpdateTranslateBlockInput): void {
  const { dataDir, fileName, blockIndex, english, italian, answer } = input;

  if (!isEditableSentenceDataFile(fileName)) {
    throw new Error(`File not allowed: ${fileName}`);
  }

  const filePath = join(dataDir, fileName);
  const raw = readFileSync(filePath, 'utf8');
  const hadTrailingNewline = raw.endsWith('\n');
  const lines = raw.split(/\r?\n/);

  const blocks = listTranslateBlocks(lines);
  const block = blocks[blockIndex];
  if (!block) {
    throw new Error(`Block index ${blockIndex} not found in ${fileName}`);
  }

  lines[block.startLine] = english;
  lines[block.startLine + 1] = italian;
  lines[block.startLine + 2] = answer;

  let output = lines.join('\n');
  if (hadTrailingNewline && !output.endsWith('\n')) {
    output += '\n';
  }

  writeFileSync(filePath, output, 'utf8');
}
