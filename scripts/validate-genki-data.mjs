#!/usr/bin/env node
/**
 * Validates Genki/sentence TXT lesson files under src/data/.
 * Exits 1 if any copyright markers (*) remain or blocks are not 3 lines.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..', 'src', 'data');
const patterns = [/^genki-\d+-\d+\.txt$/, /^sentence-.*\.txt$/];

const GENKI_EXERCISES_PER_LESSON = 10;

let starred = 0;
let blockErrors = 0;
let countErrors = 0;
const starredFiles = [];
const blockErrorFiles = [];
const countErrorFiles = [];

function isCommentLine(line) {
  return line.trim().startsWith('#');
}

function countExercises(lines) {
  let i = 2;
  if (lines[i]?.trim() === '') i++;
  let n = 0;
  while (i < lines.length) {
    while (i < lines.length && (lines[i].trim() === '' || isCommentLine(lines[i]))) i++;
    if (i >= lines.length) break;
    if (i + 2 < lines.length) {
      n++;
      i += 3;
    } else break;
  }
  return n;
}

function validateTranslateFile(name) {
  const text = readFileSync(join(root, name), 'utf8');
  const lines = text.split(/\r?\n/);
  let i = 0;

  // title (2 lines) + blank
  if (lines.length < 3) {
    blockErrors++;
    blockErrorFiles.push(`${name}: file too short`);
    return;
  }
  i = 2;
  if (lines[i]?.trim() !== '') {
    blockErrors++;
    blockErrorFiles.push(`${name}: expected blank line after title`);
  }
  i++;

  while (i < lines.length) {
    while (i < lines.length && (lines[i].trim() === '' || isCommentLine(lines[i]))) i++;
    if (i >= lines.length) break;

    const en = lines[i];
    if (en.startsWith('*')) {
      starred++;
      if (!starredFiles.includes(name)) starredFiles.push(name);
    }
    const block = lines.slice(i, i + 3);
    if (block.length < 3 || block.some(l => l === undefined)) {
      blockErrors++;
      blockErrorFiles.push(`${name}: incomplete block at line ${i + 1}`);
      i += block.length;
      continue;
    }
    i += 3;
  }

  if (/^genki-\d+-\d+\.txt$/.test(name)) {
    const n = countExercises(lines);
    if (n !== GENKI_EXERCISES_PER_LESSON) {
      countErrors++;
      countErrorFiles.push(`${name}: expected ${GENKI_EXERCISES_PER_LESSON} exercises, found ${n}`);
    }
  }
}

const files = readdirSync(root).filter(f => patterns.some(p => p.test(f)));
for (const f of files.sort()) validateTranslateFile(f);

console.log(`Checked ${files.length} lesson files in src/data/`);
console.log(`Starred prompts (*): ${starred} in ${starredFiles.length} file(s)`);
if (starredFiles.length) {
  for (const f of starredFiles) console.log(`  - ${f}`);
}
console.log(`Block structure errors: ${blockErrors}`);
if (blockErrorFiles.length) {
  for (const e of blockErrorFiles.slice(0, 20)) console.log(`  - ${e}`);
  if (blockErrorFiles.length > 20) console.log(`  ... and ${blockErrorFiles.length - 20} more`);
}
console.log(`Genki exercise count errors: ${countErrors}`);
if (countErrorFiles.length) {
  for (const e of countErrorFiles) console.log(`  - ${e}`);
}

if (starred > 0 || blockErrors > 0 || countErrors > 0) process.exit(1);
console.log('OK');
