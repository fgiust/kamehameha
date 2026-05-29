# tenshindiff

Japanese sentence answer diff with Genki-style templates: furigana `漢[かん]`, alternatives `{です|だ}`, optional segments `{primary|}`, and kana-vs-kanji matching.

## Install (monorepo / workspace)

```bash
npm install tenshindiff
```

## Quick start

```ts
import { gradeAnswer, renderDiffHtml } from 'tenshindiff';
import 'tenshindiff/styles.css';

const template = '{私[わたし]は|}図[と]書[しょ]館[かん]で{本[ほん]|教科書[きょうかしょ]}を読[よ]みます';
const { isCorrect, ops, html } = gradeAnswer('図書館で教科書を読みます', template);

document.getElementById('feedback')!.innerHTML = html;
```

## Template syntax

- **Furigana:** `漢[かん]字[じ]` — surface in brackets is the reading.
- **Alternatives:** `{です|だ}` — user may match any option.
- **Optional segment:** `{私[わたし]は|}` — empty second option; primary shown when user fills the slot.

## Diff options (`DiffOptions`)

Pass an optional `options` object to `gradeAnswer`, `generateAnswersFromTemplate`, or `primarySurfaceFromTemplate`. **No flags are enabled by default.**

```ts
import { gradeAnswer, type DiffOptions } from 'tenshindiff';

const options: DiffOptions = {
  ignoreTrailingPunctuation: true,
  commasAsOptional: true,
};

gradeAnswer(user, template, options);
generateAnswersFromTemplate(template, options);
```

| Flag | Effect |
|------|--------|
| `ignoreTrailingPunctuation` | Equivalent to appending `{|。}`: the shorter answer (no `。`) is the default display target, but a user-added trailing `。` is accepted and shown as correct. |
| `commasAsOptional` | Equivalent to wrapping every literal `、` as `{、|}`: commas in the template may be omitted or included. Existing `{、|}` groups are left unchanged. |

Low-level helpers: `applyTemplateDiffOptions`, `applyIgnoreTrailingPunctuation`, `applyCommasAsOptional`.

Validate templates in CI:

```ts
import { validateAnswerTemplate } from 'tenshindiff/validate';

const issues = validateAnswerTemplate(template);
```

## React (optional)

```tsx
import { DiffDisplay, DiffPlayground } from 'tenshindiff/react';
import 'tenshindiff/styles.css';

<DiffDisplay ops={ops} className="diff-answer" />
```

## API (core)

| Export | Description |
|--------|-------------|
| `gradeAnswer(user, template, options?)` | `{ isCorrect, bestAnswer, ops, html }` |
| `generateAnswersFromTemplate(template, options?)` | All expanded answer strings |
| `pickBestDiff`, `diffSentenceAnswer` | Low-level diff |
| `matchesByRubyUnits` | Correctness check |
| `renderDiffHtml(ops)` | HTML without React |
| `formatDiffPlainText(ops)` | Plain copy string |

## Live demo

After enabling GitHub Pages on this repo, the demo is published from `packages/tenshindiff/demo`:

- **URL:** `https://fgiust.github.io/kamehameha/` (project site; adjust `VITE_BASE` in workflow if your repo name differs)

Local demo:

```bash
npm run dev:demo -w tenshindiff
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run build -w tenshindiff` | Build `dist/` |
| `npm run test -w tenshindiff` | Package unit tests |
| `npm run build:demo -w tenshindiff` | Static demo for Pages |

## Limitations

- No nested `{…}` inside `{…}`.
- `pickBestDiff` breaks ties by first-configured alternative.

## Roadmap

Publish to npm (phase 2).
