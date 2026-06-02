/**
 * One-shot: strip manual {kanji|ascii|fullwidth} duplicates from answer templates.
 * Run: node scripts/simplify-numerical-alternatives.mjs
 */
import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  readNumberSpanAt,
  parseNumberSpan,
  formatKanjiNumber,
} from '../packages/tenshindiff/src/numerals.ts';

function pickPreferredNumericForm(candidates, value, suffix) {
  const kanji = formatKanjiNumber(value) + suffix;
  if (candidates.includes(kanji)) return kanji;
  const kanjiLike = candidates.find(c => {
    const span = readNumberSpanAt(c, 0);
    if (!span || span.end === 0) return false;
    return parseNumberSpan(span.raw) === value && c.slice(span.end) === suffix;
  });
  return kanjiLike ?? candidates[0];
}

function simplifyAlternativeGroup(content) {
  const parts = content.split('|');
  const kept = [];

  for (const part of parts) {
    const span = readNumberSpanAt(part, 0);
    if (!span || span.end === 0) {
      if (!kept.includes(part)) kept.push(part);
      continue;
    }

    const value = parseNumberSpan(span.raw);
    if (value === null) {
      if (!kept.includes(part)) kept.push(part);
      continue;
    }

    const suffix = part.slice(span.end);
    const dupIdx = kept.findIndex(existing => {
      const es = readNumberSpanAt(existing, 0);
      if (!es || es.end === 0) return false;
      const ev = parseNumberSpan(es.raw);
      return ev === value && existing.slice(es.end) === suffix;
    });

    if (dupIdx >= 0) {
      kept[dupIdx] = pickPreferredNumericForm([kept[dupIdx], part], value, suffix);
      continue;
    }

    kept.push(part);
  }

  if (kept.length === 0) return content;
  if (kept.length === 1) return kept[0];
  return kept.join('|');
}

function simplifyTemplate(template) {
  let out = '';

  for (let i = 0; i < template.length; i++) {
    const ch = template[i];
    if (ch === '{') {
      const close = template.indexOf('}', i);
      if (close === -1) {
        out += ch;
        continue;
      }
      const content = template.slice(i + 1, close);
      const simplified = simplifyAlternativeGroup(content);
      if (simplified.includes('|') || simplified.includes('[')) {
        out += `{${simplified}}`;
      } else {
        out += simplified;
      }
      i = close;
      continue;
    }
    out += ch;
  }

  return out;
}

const dataDir = join(import.meta.dirname, '../src/data');
const files = readdirSync(dataDir).filter(f => /^genki-.*\.txt$/.test(f) || /^sentence-.*\.txt$/.test(f));

let changedFiles = 0;
for (const file of files) {
  const path = join(dataDir, file);
  const raw = readFileSync(path, 'utf8');
  const lines = raw.split(/\r?\n/);
  let changed = false;
  const out = lines.map(line => {
    if (!line.includes('{') || !line.includes('|')) return line;
    const next = simplifyTemplate(line);
    if (next !== line) changed = true;
    return next;
  });
  if (changed) {
    writeFileSync(path, out.join('\n') + (raw.endsWith('\n') ? '\n' : ''), 'utf8');
    changedFiles++;
    console.log('updated', file);
  }
}

console.log(`done (${changedFiles} files changed)`);
