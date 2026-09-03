---
name: "kamehameha-exercise-authoring"
description: "Authors correct Genki-style sentence exercise TXT files for the kamehameha! Japanese learning app. Invoke when creating or editing genki-*.txt or sentence-*.txt exercise files."
---

# kamehameha! Exercise File Authoring Guide

This skill describes **exactly** how to author valid and correct sentence exercise data files for the kamehameha! Japanese learning SPA.

## 1. File Naming & Location

All files live under `src/data/` in the project root.

| Pattern | Purpose | Required Exercise Count |
|---------|---------|------------------------|
| `genki-NN-N.txt` | Genki textbook chapter exercise. `NN` = chapter (01–23), second `N` = sub-lesson number. | **Exactly 10** exercises |
| `sentence-*.txt` | Additional custom topic exercises (not tied to Genki chapters). | Any positive number |

Examples:
- `genki-21-2.txt` = Chapter 21, sub-lesson 2 (Genki II, N4 level)
- `sentence-obligation.txt` = Custom topic about obligation grammar

## 2. File Structure (Non-Negotiable Format)

The file is plain text. Line **order** and **count** are strictly enforced.

```
<TITLE IN ENGLISH>
<TITLE IN ITALIAN>

<ENGLISH SENTENCE 1>
<ITALIAN SENTENCE 1>
<JAPANESE ANSWER 1>

<ENGLISH SENTENCE 2>
<ITALIAN SENTENCE 2>
<JAPANESE ANSWER 2>

... (repeated)
```

### Structure Breakdown

1. **Line 1**: English title (may include Japanese grammar tokens, e.g. `～てある`)
2. **Line 2**: Italian title (Japanese grammar tokens are NOT translated, e.g. `～てある`)
3. **Line 3**: **Blank line** separating title from exercises
4. **Lines 4+**: Exercise blocks separated by blank lines

### Exercise Block Rules

Every exercise block is **exactly 3 lines**:
```
Line A — English prompt (the sentence to translate)
Line B — Italian prompt (same meaning as line A)
Line C — Japanese answer (with furigana and alternatives)
```

Blocks are separated from each other by **one blank line**.

### Comment Lines

Any line beginning with `#` is treated as a comment and is **skipped** by both the parser and the validator. Comments can appear:
- Between the title and the first exercise block
- Between exercise blocks
- Not inside a 3-line exercise block

Use comments to explain the grammar focus of the lesson (recommended after the title).

### Valid Structure Example

```
～てある
～てある

# Describes a situation intentionally brought about by an unnamed agent.

The lights are turned off.
Le luci sono spente.
電気[でんき]が消[け]してあります

The window is closed.
La finestra è chiusa.
窓[まど]が閉[し]めてあります
```

## 3. Title Rules

- The English and Italian titles are usually **identical** when they contain Japanese grammar tokens (e.g. `～てある`, `～てみる`, `この/その/あの + Noun`).
- If the title is purely descriptive, translate naturally (but this is rare — grammar-token titles are the convention).
- Titles are displayed verbatim in the app UI; do **not** use i18n labels.

## 4. Japanese Answer Format (Line C)

### 4.1 Furigana: Square-Bracket Notation

Use `kanji[furigana]` to attach readings. **Every kanji must have a furigana reading.**

```
Correct:   電気[でんき]が消[け]してあります
Wrong:     電気が消してあります           (missing furigana on kanji)
Wrong:     でんきがけしてあります          (kana-only — use kanji+furigana instead)
```

**Redundancy rule**: Do NOT write kana-only alternatives. The engine already accepts the kana reading derived from the furigana.

```
Wrong:     {電気[でんき]が消[け]してあります|でんきがけしてあります}  ← redundant!
Correct:   電気[でんき]が消[け]してあります                              ← engine handles both
```

### 4.2 Alternatives & Optional Parts: Curly-Brace Notation

Use `{option1|option2|…}` to declare multiple acceptable variants. The engine accepts **any one** option.

| Syntax | Meaning | Use Case |
|--------|---------|----------|
| `{A\|B}` | Exactly one of A or B (both non-empty) | `です\|だ`, `カバン\|鞄[かばん]` |
| `{A\|}` | A is preferred; empty (omit) is also OK | Optional subject `私[わたし]は` |
| `{\|B}` | Empty is preferred; B is accepted too | Optional trailing `？` |

#### Optional Subject

In Japanese, the subject (especially `私[わたし]は`) is almost always inferable and therefore optional.

```
{私[わたし]は|}猫[ねこ]が好[す]きです
```

#### Polite / Plain Copula

Sentences accepting both `です` and `だ`:

```
これは本[ほん]{です|だ}
```

#### Synonyms & Equivalent Writing

```
{カバン|鞄[かばん]}を持[も]ってください
```

#### Optional Question Mark

Never write `{|？|}` (empty / `？` / empty — nonsense). Use:

```
何[なに]{|？}
```

(The first empty position = "prefer no mark, but accept `？`".)

### 4.3 Punctuation Rules

| Punctuation | Rule |
|-------------|------|
| `。` (maru / sentence stop) | **Never** write a trailing `。` in answers, not even as `{。|}`, unless the specific exercise explicitly practices sentence punctuation. |
| `？` (question mark) | Optional; write as `{|？}` (prefer without, accept with). |
| `、` (comma) | Write **literally** `、` when the sentence needs one. Do **not** wrap in `{、|}` or `{|、}`. The parser already treats commas as effectively optional for correctness matching. |

### 4.4 Ruby / Furigana Matching Behavior in Diff

When the user submits an answer, the diff engine compares character-by-character:

- If user writes the **exact kanji** from the answer → both kanji and its furigana turn **green**.
- If user writes the correct **hiragana** for a kanji instead of the kanji itself → furigana above the expected kanji turns **green**, and the kanji below is highlighted **yellow** (answer still counted as correct).
- Wrong or missing characters are shown in **red** or normal color respectively.

### 4.5 Answer Authoring Checklist

Before finalizing an answer line, verify:

- [ ] Every kanji carries `[furigana]`.
- [ ] No kana-only alternative duplicates (no `{漢字[かんじ]|かんじ}`).
- [ ] No trailing `。` (unless explicitly required).
- [ ] Optional `？` written as `{|？}`, never `{|？|}`.
- [ ] Commas written literally as `、` without `{…}` wrapping.
- [ ] `私[わたし]は` wrapped as `{私[わたし]は|}` when inferable.
- [ ] `です` / `だ` variants written as `{です|だ}` when both should be accepted.

## 5. Prompt Quality Guidelines (Lines A & B)

### Grammar Focus Constraint

The title declares the grammar point of the lesson. **Every single exercise in the file must feature that grammar point in the Japanese answer.**

Example for title `～てある`:
```
✅ 電気[でんき]が消[け]してあります   (uses ～てある)
❌ 弟[おとうと]にパソコンを使[つか]わせてあげました   (uses ～てあげる — wrong grammar!)
```

### Vocabulary Level

| File Range | Target Level | Vocabulary Source |
|------------|-------------|-------------------|
| `genki-01-*` to `genki-12-*` | N5 | `genki_vocabulary.txt` chapters 1–12 |
| `genki-13-*` to `genki-23-*` | N4 | `genki_vocabulary.txt` chapters 1–23 |

Prefer words in the Genki vocabulary list up to the exercise's chapter. Adding a few simple, common words outside this list is acceptable as long as the difficulty stays the same.

### Personal Names

When an exercise needs a Japanese person's name, **always** pick one from `src/data/genki_cast.txt`. Do **not** invent names.

### Copyright / Originality Rule

**CRITICAL**: Exercise prompts (English, Italian, and Japanese together) must be **original creations**.

- ❌ Do **not** copy exercises verbatim from the Genki textbooks.
- ❌ Do **not** copy from the reference app at `steven-kraft.com/projects/japanese/`.
- ❌ Renaming the people in a copied sentence is **not** enough; the sentence itself must be original.
- ✅ Create entirely new sentences that simply practice the same grammar.

The validator will flag any English prompt line beginning with `*` — historically this marked copyrighted sentences. Ensure no `*` markers remain.

### English ↔ Italian Prompt Relationship

- The English (line A) and Italian (line B) prompts must express **the same meaning**.
- One should be a faithful translation of the other.
- The choice of which is the "user-facing" prompt depends on the app's current language setting — both are shown interchangeably in the UI, and in debug mode both appear together.

## 6. Validation

After authoring or editing **any** `genki-*.txt` or `sentence-*.txt` file, run:

```bash
npm run validate:data
```

This script (located at `scripts/validate-genki-data.mjs`) checks:

1. **No `*`-prefixed prompts** (copyright markers) — counts and reports them.
2. **Block structure**: every exercise block has exactly 3 lines, and the title section is correct.
3. **Genki exercise count**: every `genki-NN-N.txt` file contains exactly 10 exercises.

The script exits with code 1 on any failure. It also runs automatically as part of `npm run build`.

### Troubleshooting Common Validator Errors

| Error Message | Fix |
|---------------|-----|
| `expected blank line after title` | Ensure line 3 is blank between the two title lines and the first exercise. |
| `incomplete block at line N` | The exercise starting at line N is missing 1 or 2 lines, or there's a blank line **inside** the 3-line block. Blocks need 3 consecutive non-blank, non-comment lines. |
| `expected 10 exercises, found N` | Add or remove exercises until exactly 10 remain in the `genki-*.txt` file. `sentence-*.txt` files have no 10-count requirement. |
| `Starred prompts (*): X` | One or more English prompts still start with `*`. Rewrite those exercises with original content. |

## 7. Full Workflow: Creating or Editing a Lesson File

1. **Open / Create** the target `.txt` file under `src/data/`.
2. **Write the title** (2 lines) + blank line. Add a `#` comment describing the grammar focus.
3. **Write 10 original exercise blocks** for a `genki-*` file (any number for `sentence-*`):
   - 3 lines each (EN / IT / JP answer).
   - Separated by blank lines.
   - Every Japanese answer features the grammar point from the title.
   - Furigana on all kanji; alternatives & optionals with `{…|…}`; no trailing `。`.
   - Names from `genki_cast.txt`, vocab preferring the chapter range.
4. **Run** `npm run validate:data`. Fix any reported errors.
5. **Run** `npm run build` (optional but recommended) to confirm the whole pipeline passes (tests, types, validation, and Vite build including the TXT parser).

## 8. Complete Example: A Valid 10-Exercise `genki-21-2.txt` (～てある)

```
～てある
～てある

# You can use the te-form of a verb + the helping verb to 3 to characterize a situation
# that has been brought about on purpose by somebody who remains unnamed in the sentence.

The lights are turned off.
Le luci sono spente.
電気[でんき]が消[け]してあります

The air conditioner is on.
L'aria condizionata è accesa.
エアコンがつけてあります

The curtains are open.
Le tende sono aperte.
カーテンが開[あ]けてあります

The name is written.
Il nome è scritto.
名前[なまえ]が書[か]いてあります

The window is closed.
La finestra è chiusa.
窓[まど]が閉[し]めてあります

The present is wrapped.
Il regalo è incartato.
プレゼントが包[つつ]んであります

The poster is hung on the wall.
Il poster è attaccato al muro.
ポスターが壁[かべ]に貼[は]ってあります

The door is open.
La porta è aperta.
ドアが開[あ]けてあります

Tea is prepared.
Il tè è stato preparato.
お茶[ちゃ]が入[い]れてあります

The book is placed on the desk.
Il libro è posizionato sulla scrivania.
本[ほん]が机[つくえ]の上[うえ]に置[お]いてあります
```
