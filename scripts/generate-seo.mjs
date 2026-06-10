/**
 * Post-build SEO generator — run via vite-node so lesson data resolves correctly.
 * Called automatically from vite build (closeBundle) and manually via npm run generate:seo.
 */
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const result = spawnSync(
  'npx',
  ['vite-node', '--config', 'vite.config.ts', 'scripts/run-generate-seo.ts'],
  { cwd: root, stdio: 'inherit', shell: false },
);

process.exit(result.status ?? 1);
