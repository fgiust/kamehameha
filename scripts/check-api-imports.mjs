import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

const API_DIR = 'api';
const FORBIDDEN_IMPORT =
  /from\s+['"](\.\.\/src\/|\.\.\/\.\.\/src\/|\.\.\/server\/|\.\.\/\.\.\/server\/|ga4-analytics|tenshindiff)/;

function collectApiHandlerFiles(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.ts'))
    .map((entry) => join(dir, entry.name));
}

let failed = false;

for (const file of collectApiHandlerFiles(API_DIR)) {
  const content = readFileSync(file, 'utf8');
  if (!FORBIDDEN_IMPORT.test(content)) continue;

  console.error(
    `${file}: Vercel API handlers must not import from src/, server/, or workspace packages. ` +
      'Use npm dependencies (e.g. @supabase/supabase-js) or helpers under api/_lib/.',
  );
  failed = true;
}

if (failed) process.exit(1);

console.log('API import check passed.');
