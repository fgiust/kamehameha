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

### Lint
ESLint exits with code 1 due to pre-existing issues (13 react-hooks warnings + 1 `no-useless-escape` error in `src/utils/rubyNotation.ts`). These are not blockers for development.

### Data files
Exercise data lives in `src/data/` as `.txt` files. After editing any `genki-*.txt` or `sentence-*.txt` file, run `npm run validate:data` to verify structure (3-line blocks, no starred prompts, 10 exercises per Genki file).
