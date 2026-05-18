# kamehameha! - Project Context

This document describes the current project state, the goals, architectural decisions, and the remaining work needed so that another agent can pick up development and continue confidently.

## Maintenance Rule (IMPORTANT)
This file MUST be kept up to date. Every time any change is made to code, data, architecture, or UI behavior, update this file with:
- what was changed,
- why it was changed (briefly),
- what is still missing / known gaps.
- Avoid duplication: if the same change would require editing many pages/components, prefer extracting a shared component/hook/util instead of copy-pasting.
- Datasets must live under `src/data/` and must not be defined inline inside React components/pages.

---

## 🎯 Project Goals
Build a React + TypeScript app (Vite) that replicates and improves Steven Kraft’s Japanese learning app:
https://steven-kraft.com/projects/japanese/

The application includes:
1. **Conjugation exercises (verbs and adjectives)** with deterministic answers based on precise rules (polite, negative, past, passive, causative, volitional, etc.).
2. **Genki-style sentence exercises** (English → Japanese) supporting multiple alternatives, `#name` placeholder replacement, and character-level diff feedback.
3. **Parametric design**: engines are decoupled from datasets. Data lives in typed TS/JSON so the system is extensible.

---

## 🛠️ Tech Stack & Architecture
- **Frontend**: React + React Router (v7).
- **Language**: TypeScript (strictly typed).
- **Bundler/Dev Server**: Vite 5 (Node.js v21.7.2 compatible).
- **Styling**: Vanilla CSS with CSS variables and Dark Mode support.

### Directory Structure
```text
src/
├── engines/
│   ├── types.ts              # Shared types for exercise engines
│   ├── verbConjugation.ts    # Parametric verb conjugation engines (11 forms)
│   ├── adjConjugation.ts     # Parametric adjective conjugation engines (5 forms)
│   ├── sentenceEngine.ts     # Sentence generation + diff engine
│   ├── japaneseNumber.ts     # Number readings generator (romaji->hiragana answers)
│   ├── japaneseTime.ts       # Time readings generator (hour/minute counters)
│   └── multipleChoice.ts     # Reusable multiple-choice quiz engine (NEW)
├── data/
│   ├── verbs.ts              # Verb dataset (kana/kanji/type/eng)
│   ├── adjectives.ts         # Adjective dataset (kana/kanji/type/eng)
│   ├── counters.ts           # Counter dataset (multiple valid readings)
│   ├── daysOfMonth.ts        # Days-of-month readings (1-31)
│   ├── genkiLessons.ts       # Genki lesson mapping + sentence datasets
│   ├── naVsNoData.ts         # Na vs No Adjectives data (NEW)
│   └── transitiveData.ts     # Transitive/Intransitive pairs data (NEW)
├── components/
│   ├── ConjugationExercise.tsx # Unified single-answer exercise component
│   └── SentenceExercise.tsx    # Unified sentence exercise component
├── pages/
│   ├── HomePage.tsx
│   ├── GenkiPage.tsx
│   ├── GenkiLessonPage.tsx
│   ├── VerbExercisePage.tsx
│   ├── AdjExercisePage.tsx
│   ├── RandomizePage.tsx
│   ├── AdjRandomizePage.tsx
│   ├── CountersPage.tsx
│   ├── DaysPage.tsx
│   ├── NumbersPage.tsx
│   ├── TimePage.tsx
│   ├── NaVsNoPage.tsx        # Na vs No Adjectives quiz page (NEW)
│   └── TransitivePage.tsx    # Transitive/Intransitive quiz page (NEW)
└── styles/
    └── index.css             # Design system + Dark Mode
```

---

## ✅ What’s Implemented
### Core Application
- Vite + React + TS project set up and working.
- Dark Mode toggle persisted in `localStorage`.
- **Real-time Type Checking (NEW)**: `vite-plugin-checker` integrated in Vite dev mode to show TypeScript compiler errors on both the terminal console and browser screen.

### Engines
- Verb conjugation engines implemented for: Te, Causative, Conditional, Imperative, Negative, Passive, Past, Polite, Potential, Provisional, Volitional.
- Adjective conjugation engines implemented for: Negative, Past, Naru, Conditional, Volitional.
- Kanji input support added to conjugation logic (works for kana and kanji strings).

### Sentence Exercises
- Sentence engine supports:
  - arrays of alternatives,
  - `#name` placeholder replacement,
  - detailed diff feedback for wrong/missing characters.
- **Genki Sentence Exercises**: All Genki I and Genki II sentence exercises have been implemented with N5-N4 level content.
- **Other Interactive Exercises (NEW)**: "Transitive / Intransitive" and "な vs の Adjectives" have been built as dedicated pages replicating the reference tools' exact interaction styles.
  - "な vs の" leverages `MultipleChoiceEngine` (reusable multiple-choice logic) and imports its data from `src/data/naVsNoData.ts`.
  - "Transitive / Intransitive" practices verb-pair counters using wanakana auto-conversion, pulling its pairs from `src/data/transitiveData.ts`.

### Conjugation Exercise Global Options (NEW)
Implemented in `src/components/ConjugationExercise.tsx`:
- Display toggles (first row): Kanji, Furigana, English, Type, Reverse Q-A.
- Form toggles (second section): engine flags, with Randomize always last.
- Toggle styling was made more compact so the 5 display toggles fit on one line, with no pill background and a bottom border highlight when on.
- Form hint now includes all active form flags (e.g. causative short/passive) and uses per-engine defaults for forms that are inherently polite/negative.
- English and type are displayed above the input: centered if only one is enabled, or on the same row aligned to the input edges if both are enabled.

All the above settings are persisted globally via `localStorage` so they carry across routes/pages.

### Answer Flow (NEW)
- After submitting an answer, the exercise does NOT auto-advance.
- The next question is shown only after pressing `Enter` again, or by pressing a typing key while the input is focused (the next question starts with an empty input).
- The space for the answer banner is reserved from the start to prevent the page from shifting when the answer is revealed.

### Typography (NEW)
- Japanese question text (kana/kanji prompts) is rendered at 32px; English prompts keep the smaller size.

### Session Progress (NEW)
- Type filter buttons were removed to avoid inconsistent states.
- Each exercise page shows a 5px progress line divided into N squares.
  - On each submitted answer, the square for that question is colored green (correct) or red (incorrect).
  - If the same question appears again, its previous square is updated (not appended).
  - The line resets only when the exercise page is restarted (route remount).
  - The score is displayed inline: correct/incorrect on the left of the line and percentage on the right.
  - The percentage is plain text (no badge background) and the progress line stays full-width while the labels are aligned to the card edges.
  - Each updated square plays a strong “pop/glow” animation and a short sound (different for correct vs incorrect).

### Romaji → Hiragana Input (NEW)
- Answer inputs accept Latin-letter typing and convert it automatically to hiragana while typing (to avoid relying on OS-level Japanese IME kanji conversion).
- IME-like behavior is implemented:
  - `n` is kept as `n` until it becomes a full syllable (e.g. `na` → な) or until it is committed on submit (Enter), where it becomes `ん`.
  - `nn` commits immediately to `ん`.
  - `nna/nni/nny...` become `んな/んに/んにゃ...` (matching typical Japanese IME behavior).

### Keyboard Shortcut (NEW)
- Pressing `Shift` toggles **Show Furigana** instantly (only when “Show Kanji” is enabled) and persists the setting.

### Furigana Dataset (NEW)
- `src/data/verbs.ts` now contains ruby markup in `kanji` (e.g. `<rb>行</rb><rt>い</rt>く`) restored from `/tmp/verb-conj-formatted.js`.

### Numbers & Counters (NEW)
Implemented routes + pages (mirroring the original app behavior):
- `/counters`: Japanese counters practice with per-counter toggles and **multiple valid readings** accepted.
- `/days`: Days of the month (1日..31日) with a toggle for **1-10 ⟷ 1-31**.
- `/numbers`: Numbers practice with a **digits slider (1..8)** and **Hiragana⇄Number** reverse mode (multiple valid readings accepted where applicable).
- `/time`: Time practice with optional **AM/PM** and multiple valid readings accepted (e.g. pronunciation variants).

### Removed (NEW)
- The **Kana & Kanji** section was removed from the Home page and is intentionally not planned for implementation.

---

## ⚠️ Known Limitations / What’s Still Missing
- **Furigana is dataset-driven**:
  - Verbs now have ruby markup and support furigana.
  - Adjectives now include ruby markup for their `kanji` field (restored from the reference bundle), so furigana works for them as well.
- **Reverse mode furigana**:
  - Furigana is supported in Reverse (Q-A) when “Show Kanji” is enabled, because conjugation engines can operate on ruby-marked kanji strings and preserve `<rt>` readings in the generated prompt.
- **Parity audit with the original app**:
  - The highest-priority items from the previous “Next Steps” section are completed.
  - Any additional gaps versus the original site should be tracked here as they are discovered.

---

## Implementation Notes
- Ruby stripping behavior:
  - When “Show Kanji” is ON and “Show Furigana” is OFF, `<rt>...</rt>` and `<rb>` tags are removed before display.
- Reference snapshots:
  - `reference/` contains downloaded HTML and formatted bundles used to restore datasets without needing online access.
- LocalStorage keys for conjugation settings:
  - `nihongo.conj.randomizeForm`
  - `nihongo.conj.reverseQA`
  - `nihongo.conj.showKanji`
  - `nihongo.conj.showFurigana`
  - `nihongo.conj.showType`
  - `nihongo.conj.showEnglish`
  - Legacy: `nihongo.conj.hideType` is migrated to `nihongo.conj.showType` (inverted) on first load.

### Flag parity vs reference (expected differences)
- Settings label text differs intentionally: the app uses short labels (Kanji/Furigana/English/Type/Reverse Q-A) instead of the reference “Show/Hide …” wording.
- English toggle semantics differ intentionally: reference uses “Hide English”; this app uses “English” (show/hide).
- Type toggle semantics differ intentionally: reference uses “Hide Type”; this app uses “Type” (show/hide).
- Toggle ordering differs intentionally: display toggles are grouped first, form toggles second with Randomize last.
