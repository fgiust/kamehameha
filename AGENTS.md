# AGENTS.md

## Cursor Cloud specific instructions

### Overview
kamehameha! is a Japanese language learning SPA (React + Vite + TypeScript). No external services are needed for local development — the feedback API is mocked locally by writing to a file.

### Commands
Standard commands are in `package.json`:
- `npm run dev` — Vite dev server on port 5173 (includes TypeScript checker overlay)
- `npm run test` — Vitest (70 tests, all pass)
- `npm run lint` — ESLint (flat config, has pre-existing warnings)
- `npm run build` — validates data + tests + type-check + production build
- `npm run validate:data` — checks Genki `.txt` exercise files for structure errors

### Dev server notes
- The Vite dev server runs with `vite-plugin-checker` which shows TypeScript errors in both the terminal and browser overlay.
- Romaji-to-hiragana conversion in the browser requires no OS-level IME; it's handled by `wanakana` in-app.
- The feedback endpoint is mocked locally (appends to `feedback.txt` in the project root) — no Vercel KV credentials needed.

### Environment variables
No environment variables are required for local dev. Production-only vars are only needed for deployed API routes:

- `GA_MEASUREMENT_ID` — GA4 property id (defaults to `G-QEYQ7EPJXP` if unset)
- `GA_MEASUREMENT_API_SECRET` — GA4 Measurement Protocol secret (**required** for `/api/analytics` in production; rotate if exposed)
- `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, etc. — feedback/contact APIs

Local dev mocks `/api/analytics` in Vite (returns 204). Umami remains client-side for comparison during the GA4 evaluation period.

### Vercel API routes (`api/`)
Vercel deploys each file under `api/` as an isolated serverless function. **Do not import from `src/` or `server/`** — those paths are not bundled at runtime (`Cannot find module .../src/...`).

Allowed imports for `api/**/*.ts`:
- npm packages (`@supabase/supabase-js`, etc.)
- workspace packages under `packages/` (e.g. `ga4-analytics`, `ga4-analytics/server`)
- relative imports within `api/` (prefer `.js` extensions if using shared `api/_lib/` files)

`npm run build` runs `scripts/check-api-imports.mjs` to catch forbidden imports before deploy.

When client and server need shared logic, add a workspace package in `packages/` rather than importing from `src/`.

### Lint
ESLint exits with code 1 due to pre-existing issues (13 react-hooks warnings + 1 `no-useless-escape` error in `src/utils/rubyNotation.ts`). These are not blockers for development.

### Data files
Exercise data lives in `src/data/` as `.txt` files. After editing any `genki-*.txt` or `sentence-*.txt` file, run `npm run validate:data` to verify structure (3-line blocks, no starred prompts, 10 exercises per Genki file).
