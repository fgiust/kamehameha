import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { describe, expect, it } from 'vitest';
import {
  listTranslateBlocks,
  updateTranslateBlockInFile,
} from '../../src/lessons/updateTranslateBlockInFile';

const SAMPLE = [
  'Title EN',
  'Title IT',
  '',
  '# Grammar note',
  'English one',
  'Italian one',
  'Japanese one',
  '',
  'English two',
  'Italian two',
  'Japanese two',
].join('\n');

describe('updateTranslateBlockInFile', () => {
  it('lists exercise blocks skipping title and comments', () => {
    const lines = SAMPLE.split('\n');
    const blocks = listTranslateBlocks(lines);
    expect(blocks).toHaveLength(2);
    expect(blocks[0]).toEqual({ blockIndex: 0, startLine: 4 });
    expect(blocks[1]).toEqual({ blockIndex: 1, startLine: 8 });
  });

  it('updates only the three lines of the target block', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nihongo-update-'));
    const fileName = 'sentence-test.txt';
    writeFileSync(join(dir, fileName), SAMPLE, 'utf8');

    updateTranslateBlockInFile({
      dataDir: dir,
      fileName,
      blockIndex: 1,
      english: 'English TWO edited',
      italian: 'Italian TWO edited',
      answer: '答[こた]え二',
    });

    const updated = readFileSync(join(dir, fileName), 'utf8');
    const lines = updated.split('\n');
    expect(lines[4]).toBe('English one');
    expect(lines[8]).toBe('English TWO edited');
    expect(lines[9]).toBe('Italian TWO edited');
    expect(lines[10]).toBe('答[こた]え二');
    expect(lines[0]).toBe('Title EN');
    expect(lines[3]).toBe('# Grammar note');
  });

  it('rejects disallowed file names', () => {
    const dir = mkdtempSync(join(tmpdir(), 'nihongo-update-'));
    expect(() =>
      updateTranslateBlockInFile({
        dataDir: dir,
        fileName: '../evil.txt',
        blockIndex: 0,
        english: 'a',
        italian: 'b',
        answer: 'c',
      }),
    ).toThrow(/not allowed/);
  });
});
