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
Build a React + TypeScript app (Vite) inspired by Steven Kraft’s Japanese learning app https://steven-kraft.com/projects/japanese/ - with different original tests and a more engaging UI

The application includes:
1. **Conjugation exercises (verbs and adjectives)** with deterministic answers based on precise rules (polite, negative, past, passive, causative, volitional, etc.).
2. **Genki-style sentence exercises** (English → Japanese) supporting multiple alternatives, `#name` placeholder replacement, and character-level diff feedback.
3. **Parametric design**: engines are decoupled from datasets. Data lives in typed TS/JSON or plain text files. Use plain test text files as much as possibile to make configuration of new tests easier.

---

## 🛠️ Tech Stack & Architecture
- **Frontend**: React + React Router (v7).
- **Language**: TypeScript (strictly typed).
- **Bundler/Dev Server**: Vite 5 (Node.js v21.7.2 compatible).
- **Styling**: Vanilla CSS with CSS variables and Dark Mode support.

### Directory Structure
```text
src/
├── types.ts                  # Shared types (ConjugationEngine, SentenceItem, HomeConfig, …)
├── engines/
│   ├── verbConjugation.ts    # 11 verb forms + verbEngines map
│   ├── adjConjugation.ts     # 5 adjective forms + adjEngines map
│   ├── sentenceEngine.ts     # Sentence diff + correctness
│   ├── japaneseNumber.ts     # Number → hiragana readings
│   ├── japaneseTime.ts       # Clock time readings
│   ├── readingExerciseEngine.ts  # Romaji IME + ReadingExercisePicker
├── lessons/
│   ├── parseTranslateSessionTxt.ts  # genki-*.txt / sentence-*.txt parser
│   ├── parseReadingExerciseTxt.ts   # reading-*.txt parser
│   ├── genkiTxtLessons.ts / genkiLessons.ts
│   ├── sentenceTxtLessons.ts
│   └── readingTxtLessons.ts
├── data/
│   ├── genki-NN-N.txt        # 115 Genki lesson files (build-time via Vite plugin)
│   ├── sentence-*.txt        # obligation, prohibition, adjectivenouns
│   ├── reading-*.txt         # days, familynames
│   ├── dictConjugationVerbs.ts / dictConjugationAdjectives.ts
│   ├── dictCounters.ts / dictTransitivePairs.ts / dictCountingThings.ts
│   ├── genki_vocabulary.txt / genki_cast.txt
│   └── homeSections.ts       # Home navigation config
├── components/               # ConjugationExercise, SentenceExercise, ReadingExercise, …
├── pages/                    # Home, GenkiLesson, SentenceTxtLesson, verb/adj/numbers, …
├── hooks/useSessionProgress.ts
├── i18n/                     # en.ts, it.ts (UI only; exercise titles from TXT)
├── utils/
└── styles/index.css
api/                          # Vercel: feedback.ts, contact.ts
backup/                       # Archived NaVsNo exercise (not linked from app)
scripts/validate-genki-data.mjs  # CI: * markers + 3-line blocks
test/                         # vitest: sentenceEngine, parseTranslateSessionTxt
```

---

## ✅ What’s Implemented
### Core Application
- Vite + React + TS project set up and working.
- Dark Mode toggle persisted in `localStorage`.
- **Real-time Type Checking**: `vite-plugin-checker` integrated in Vite dev mode to show TypeScript compiler errors on both the terminal console and browser screen.

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
- **Other Interactive Exercises**: Transitive/Intransitive pairs (`TransitivePage`, `dictTransitivePairs.ts`); counting-things; family names; adjectives+nouns (`sentence-adjectivenouns.txt`); obligation/prohibition sentence lessons on home.
- **な vs の Adjectives**: implemented under `backup/` only; route and home entry **removed** (was disabled). `MultipleChoiceEngine` remains in repo but is not wired to any live page.

### Conjugation Exercise Global Options
Implemented in `src/components/ConjugationExercise.tsx`:
- Display toggles (first row): Kanji, Furigana, English, Type, Reverse Q-A.
- Form toggles (second section): engine flags, with Randomize always last.
- Toggle styling was made more compact so the 5 display toggles fit on one line, with no pill background and a bottom border highlight when on.
- Form hint now includes all active form flags (e.g. causative short/passive) and uses per-engine defaults for forms that are inherently polite/negative.
- English and type are displayed above the input: centered if only one is enabled, or on the same row aligned to the input edges if both are enabled.

All the above settings are persisted globally via `localStorage` so they carry across routes/pages.

### Answer Flow
- After submitting an answer, the exercise does NOT auto-advance.
- The next question is shown only after pressing `Enter` again, or by pressing a typing key while the input is focused (the next question starts with an empty input).
- The space for the answer banner is reserved from the start to prevent the page from shifting when the answer is revealed.

### Typography
- Japanese question text (kana/kanji prompts) is rendered at 32px; English prompts keep the smaller size.

### Session Progress
- Type filter buttons were removed to avoid inconsistent states.
- Each exercise page shows a 5px progress line divided into N squares.
  - On each submitted answer, the square for that question is colored green (correct) or red (incorrect).
  - If the same question appears again, its previous square is updated (not appended).
  - The line resets only when the exercise page is restarted (route remount).
  - The score is displayed inline: correct/incorrect on the left of the line and percentage on the right.
  - The percentage is plain text (no badge background) and the progress line stays full-width while the labels are aligned to the card edges.
  - Each updated square plays a strong “pop/glow” animation and a short sound (different for correct vs incorrect).

### Romaji → Hiragana Input
- Answer inputs accept Latin-letter typing and convert it automatically to hiragana while typing (to avoid relying on OS-level Japanese IME kanji conversion).
- IME-like behavior is implemented:
  - `n` is kept as `n` until it becomes a full syllable (e.g. `na` → な) or until it is committed on submit (Enter), where it becomes `ん`.
  - `nn` commits immediately to `ん`.
  - `nna/nni/nny...` become `んな/んに/んにゃ...` (matching typical Japanese IME behavior).

### Keyboard Shortcut
- Pressing `Shift` toggles **Show Furigana** instantly (only when “Show Kanji” is enabled) and persists the setting.

### Numbers & Counters
Implemented routes + pages (mirroring the original app behavior):
- `/counters`: Japanese counters practice with per-counter toggles and **multiple valid readings** accepted.
- `/days`: Days of the month (1日..31日) with a toggle for **1-10 ⟷ 1-31**.
- `/numbers`: Numbers practice with a **digits slider (1..8)** and **Hiragana⇄Number** reverse mode (multiple valid readings accepted where applicable).
- `/time`: Time practice with optional **AM/PM** and multiple valid readings accepted (e.g. pronunciation variants).

### Removed
- The **Kana & Kanji** section was removed from the Home page and is intentionally not planned for implementation.

### Answer diff
A key feature is the diff component that matches the answer provided by the user with the correct one. The diff should be able to match both the kanji or the katakana writing, visually displaying differences and calculating correctness of the answer. The answer is displayed with furigana reading about the kanjis using ruby tags (furigana are manually provided in the text files, if the users writes different kanjis in his answer those ones will not have furigana)
In detail:
- a correct segment is displayed in green
- a wrong segment in displayed in red
- a missing segment is displayed in normal text color
- if a segment matches a kanji both the kanji and furigana will be marked as green, if the users write it using correct hiragana the furigana will be displayed in green and the kanji below in jellow, but the answer will be considered correct.

In sentence style texts (user must translate a sentence from english or italian to japanese) the answer provided may contains different variations that will be considered correct.
Variation are included in the configured response inside curly braces and separated by |. A variation could also be empty meaning that the part should be considered optional. Variations configured should be used every time a different syntax could commonly be used, there are synomin for a specific term, or even for optional or alternatives puntuation forms (e.g. 、 or　。).
Furigana are added in the answer using square brackets.
This is a sample configured phrase:
{私[わたし]は|}猫[ねこ]も好[す]き{です|だ}
Here the first part 私は is considered optional (as it typically should be in nearly every phrases that starts with 私は, since the subject in japanese is optional when can be deducted) and the phrase may finish both with です or だ
When creating a diff with the sentence inputted by the user:
- if any of the segment matches exactly (either with kanji or hiragana) that segment is used
- if none of the segments matches exactly the first option is used for the diff

### i18n
The app supports english and italian. All the content (UI+exercises) must be translated in these 2 languages. Localization uses i18next for UI parts and bilingual tests in exercises data.
Exercise titles in the UI must directly use the translated text from the test data and not duplicate the title using i18n labels.

### Home content review flag (`beta`)
`homeSections.ts` items may set `beta: true` to mark sentence/Genki exercises not yet manually reviewed. The home page shows a small dot (same color as body text) on the top-right of the link card. Remove `beta: true` (or set `beta: false`) after validating that exercise’s TXT content.

### Debug / test mode (hidden)
For content validation, a hidden debug mode can show both EN/IT prompts on sentence (Genki) exercises and extend the feedback panel.

- **Enable**: visit any URL with `?debug=42` (persisted in `localStorage` key `nihongo.debugMode`).
- **Disable**: `?debug=off` clears the flag.
- **Indicator**: small bug icon fixed at bottom-left while active (`DebugModeIndicator`, reuses feedback tab SVG).
- **Sentence exercises** (`SentenceExercise`): when debug is on, the alternate-language prompt appears smaller under the main question (no prefix).
- **Feedback panel** (always): shows the alternate prompt under the current one with prefix `Inglese:` / `Italiano:` (i18n). Question and correct-answer readonly blocks no longer use the dashed input-style border.
- **Utilities**: `src/utils/debugMode.ts`, `src/utils/bilingualPrompt.ts`, `src/hooks/useDebugMode.ts`.
- Future test-only UI can gate on `useDebugMode()` the same way.

### Data format
Most of the exercises (called "sentence" exercises) using the same schema and the same data format. Each of these exercises are configured using a txt file in the src/data folder with the naming genki-xxx.txt or sentence-xxx.txt. The format of the file is the same, the only difference is that genki-xxx files are related to topics matching Genki textbooks and sentence-xxx are for additional exercises with other topics.
The format of the file is the following:

```title in english
title in italian

phrase in english
phrase in italian
phrase in japanese (answer)

phrase in english
phrase in italian
phrase in japanese (answer)
```

Notes:
- often "title in english" or "title in italian" contains japanese expression. In that case that part should not be translated (eg. a title could be "この/その/あの/どの + Noun" in english and "この/その/あの/どの + Sostantivo" in italian)
- the answer contains furigana and alternatives as described in "Answer diff"
- files are parsed at build time, any block of more or less than 3 lines will display an error


### Genki lessons
Most of the tests are focused on the topic from the Genki textbook series, Genki 1 (chapters 1-12, targeted to N5 learners) and Genki 2 (chapters 13-23, targeted to N4 learners).
Exercises are organized by chapter and lesson. A file named genki-02-7.txt indicates "chapter 2, lesson 7".
The title displays the focus of the sentences, e.g. "～てみる" should includes japanese phrases that use the ～てみる sintax "I tried...". 
New phrases should keep the focus on the syntax topic and use a simple vocabulary, targeted to the expected user level (N5 learner for chapters 1-12 and N4 learner for chapters 13-23). 
In particular the usage of terms used in Genki textbooks should be preferred, for this reason the file genki_vocabulary.txt is provided. Each exercise should mostly use terms included in the lessons up to this chapter (e.g. exercise 13-4 should mostly use vocabulary from chapters 1-13 from the genki_vocabulary.txt file). This is only a preference, additional terms could be used while keeping a similar level of complexity.
For people names always select a name from the genki_cast.txt file.
Exercises should never reuse exactly the same phrase used in original Genki exercises or in the reference application steven-kraft.com/projects/japanese due to copyright restrictions.

---

## Implementation Notes
- Ruby stripping behavior:
  - When “Show Kanji” is ON and “Show Furigana” is OFF, `<rt>...</rt>` and `<rb>` tags are removed before display.
- LocalStorage keys for conjugation settings:
  - `nihongo.conj.randomizeForm`
  - `nihongo.conj.reverseQA`
  - `nihongo.conj.showKanji`
  - `nihongo.conj.showFurigana`
  - `nihongo.conj.showType`
  - `nihongo.conj.showEnglish`
  - Legacy: `nihongo.conj.hideType` is migrated to `nihongo.conj.showType` (inverted) on first load.

### Production & tooling
- Deployed on Vercel with `@vercel/analytics`, feedback/contact API routes (`api/`), KV storage for submissions.
- `npm run build` runs vitest, `tsc -b`, then `vite build` (TXT parsed at build time via `genkiTxtPlugin` in `vite.config.ts`).
- `npm run validate:data` runs `scripts/validate-genki-data.mjs` (starred prompts + 3-line blocks).

### Copyright cleanup status (Genki TXT)
Phrases copied from the reference app are marked with a leading `*` on the English prompt line. Replace with original EN/IT/JP triplets (same grammar focus, Genki-level vocab, names from `genki_cast.txt`). Renaming people only is **not** sufficient.

| Metric | Value (last validated) |
|--------|------------------------|
| `genki-*.txt` files | 115 |
| Files with `*` prompts | **0** |
| Starred prompt lines | **0** |

**2025-05 cleanup:** ~587 starred prompts across 76 files were replaced with original EN/IT/JP exercises (chapters 3–20 batches). `npm run validate:data` is part of `npm run build`.

**Genki lesson size:** Each `genki-NN-N.txt` file must contain exactly **10** exercises (3-line EN/IT/JP blocks after the title). Nine lessons previously had only 5; five exercises were added to each (`08-7`, `10-1`, `16-5`, `18-1`, `21-4`, `21-5`, `22-4`, `22-5`, `23-5`). The validate script enforces this count for all Genki files.

After future data edits: run `npm run validate:data` and `npm run build`, update counts here if needed.

### Missing / next steps
- Beta stabilization: bugfixes from user testing.
- Optional post-beta: more `sentence-*.txt` topics; re-enable な vs の from `backup/` if desired.