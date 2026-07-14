import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const API_DIR = 'api';
const FORBIDDEN_IMPORT = /from\s+['"](\.\.\/src\/|\.\.\/\.\.\/src\/|\.\.\/server\/|\.\.\/\.\.\/server\/)/;

function collectApiFiles(dir) {
  const entries = readdirSync(dir);
  const files = [];

  for (const entry of entries) {
    const path = join(dir, entry);
    const stats = statSync(path);
    if (stats.isDirectory()) {
      files.push(...collectApiFiles(path));
      continue;
    }
    if (entry.endsWith('.ts')) files.push(path);
  }

  return files;
}

let failed = false;

for (const file of collectApiFiles(API_DIR)) {
  const content = readFileSync(file, 'utf8');
  if (!FORBIDDEN_IMPORT.test(content)) continue;

  console.error(
    `${file}: Vercel API routes must not import from src/ or server/. ` +
      'Use npm dependencies (including workspace packages under packages/) or keep helpers in api/.',
  );
  failed = true;
}

if (failed) process.exit(1);

console.log('API import check passed.');
