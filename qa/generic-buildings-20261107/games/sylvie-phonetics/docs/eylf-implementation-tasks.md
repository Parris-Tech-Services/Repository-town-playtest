# EYLF gap closure — 10 implementation tasks for Sylvie Phonics

Numbered backlog for coders closing the **largest** gaps vs *Belonging, Being & Becoming: The Early Years Learning Framework for Australia (V2.0)* — especially **Outcome 3 (Wellbeing)** where the app is weak, **Outcome 4 (Patterns / disposition language)** partly weak, **Outcome 5 (Phoneme-level work)** under-served versus letter-counting, **Partnerships / continuity** (home ↔ educator), **Equity & inclusion**, and **transparent framing** for families.

Implementation target is primarily `index.html` (single-bundle app). Update [`eylf-curriculum-feature-map.md`](eylf-curriculum-feature-map.md) §6–§7 after shipping.

---

## 1. Phoneme “sound boxes” game (fixes Outcome 5 literacy depth)

**Goal:** Separate **speech sounds** (phonemes) from **printed letters** (current `count` mode counts letters only). Mirrors EYLF evidence on sounds of language & segmentation.

**Subtasks:**

- [x] Add a new game id (e.g. `phonemeBoxes`) plus one-line entry to `GAMES` with Australian copy.
- [x] Author `PHONEME_BOX_ROUNDS[]`: `{ word, emoji, phonemes[] (or labels), ... }` — CVC-only v1 (`cat` → 3 sounds).
- [x] Extend `startGame('phonemeBoxes')` with round-pick logic matching other modes.
- [x] Implement `renderPhonemeBoxesRound()`: N sound slots + equal number of tappable/draggable counters (mirror `blocks` or tap-to-fill).
- [x] Implement Check: validate placement; speak sounds then whole word; `recordResult` + `nextRound`.
- [x] Wire `renderRound()` → `phonemeBoxes` branch.
- [x] Parent coach (`setCoachLine` / `setCoachScript`) for segmentation cue.
- [x] Keyboard help for slot/counter navigation if applicable.
- [x] Add round type into `daily` mixed lesson composer.
- [x] Smoke-test gentle/brave + any localStorage review hooks.

---

## 2. Light numeracy strand — repeating patterns + sort-by-one-attribute (Outcome 4 / 5 “pattern systems”)

**Goal:** Addresses the curriculum map gap where maths language (pattern, compare, sort) is almost absent.

**Subtasks:**

- [x] Add `patterns` (`patternRepeat`): `PATTERN_ROUNDS[]`; MC next-tile answer.
- [x] Add `sort` (`sortOneRule`): two-group tap with food/toy metaphors (`SORT_ROUNDS`).
- [x] Reuse `choiceGridClass`, `shuffle`, `bindChoiceButtons` patterns where possible.
- [x] Cap items per round; cap choice count per `gentle|growing|brave`.
- [x] Centralise UI strings if you foresee translation.
- [x] Register modes in `GAMES`, `startGame`, nav grid, and any favourites storage.
- [x] One adult-only line Coach: ties to counting/sorting-talk in early years maths.

---

## 3. Wellbeing micro-break interstitial (Outcome 3)

**Goal:** Explicit nod to wellbeing / self-regulation — “pause the brain before the next round.”

**Subtasks:**

- [x] Extend saved state: `microBreaks: 'off'|'3'|'5'` (or `{ enabled, interval }`).
- [x] Settings panel: toggle + interval select.
- [x] Implement `maybeShowMicroBreak(counter)` hooked from shared `nextRound` / victory flow.
- [x] Overlay markup + minimal CSS (`position:fixed`, single primary button dismiss).
- [x] Rotate prompt copy array (hydration, stretch, gaze distance, silly move).
- [x] Gate animations when `prefers-reduced-motion: reduce`.
- [x] Central guard: skip on final victory screen / user disabled.

---

## 4. Early-years context picker — state names + programme labels (Partnerships / vocabulary alignment)

**Goal:** Honour Kindergarten vs Preschool vs Pre-Prep without pretending to enforce policy.

**Subtasks:**

- [x] Add `earlyYearsRegion` enum + defaults in persisted state object.
- [x] Build `REGION_LABELS` map (VIC Pre-Prep, NSW Preschool, etc. + generic).
- [x] Substitute `%PROGRAMME_LABEL%` (or template fn) only in hero / coach headline strings.
- [x] Exclude substitution from compact child-only game chrome.
- [x] Load/save in existing hydration block.
- [x] Coach footnote reminding families names differ by state/service.

---

## 5. Adult-only EYLF outcome tags on games (Transparency + educator conversations)

**Goal:** Helps families/educators see *why* a mode exists without turning child UI into a compliance poster.

**Subtasks:**

- [x] Extend `GAMES` meta: `eylfOutcomes: number[]` (or string codes).
- [x] Implement chip renderer component (inline spans, low contrast border).
- [x] Show chips only when `state.adultMode === 'coach'`.
- [x] Add `<details>` legend block on picker screen (coach mode only).
- [x] Omit chips for `adultMode === 'kid'` (or equivalent).
- [x] Tag pseudo-game `daily` with multi-outcome array.

---

## 6. Session handover recap — clipboard + print (Continuity / Partnerships)

**Goal:** Bridges home practice to kindergarten documentation culture.

**Subtasks:**

- [x] Instrument session accumulator (push mode id each round completion + timestamps if cheap).
- [x] Victory/finish path: populate `#sessionRecap` or modal DOM from accumulator.
- [x] Copy button → `navigator.clipboard` + textarea fallback for `file://`.
- [x] Print button → `window.print()`; add `@media print { ... }` to hide nav/shell chrome.
- [x] Confirm recap uses only local data — no outbound requests.
- [x] Coach-suggested line about sharing with early childhood educator when useful.

---

## 7. Accessibility & equity knobs (Framework principles — equity, wellbeing, ICT safe use hints)

**Goal:** Larger hit targets ≠ enough; align with respectful digital posture.

**Subtasks:**

- [x] CSS `@media (prefers-reduced-motion: reduce)` — tame transitions/animations on tiles and hero orbs.
- [x] Persist `speechRate` (slider); apply in central `speak()` wrapper to `SpeechSynthesisUtterance.rate`.
- [x] Add `large-touch` body class doubling `--tile` / button min-height overrides.
- [x] Pass descriptive `aria-label` into dynamic choice `<button>`s where wording won’t spoil answers for SR kids—prefer parent-tested phrasing.
- [x] Robot voice control: pair `aria-describedby` with helper text hidden visually if needed.
- [x] README or coach blurb listing TTS/OS limits (offline, voice variance).

---

## 8. Coach content pack — growth mindset + co-play scaffolds (Outcome 1 / Outcome 4)

**Goal:** Intentional teaching lines that echo EYLF “effort over product” without bloating every round.

**Subtasks:**

- [x] Add `COACH_SNIPPETS` record keyed by `effort|retry|celebrate|coplay|transfer`.
- [x] Implement `coachContextLine(tag)` or extend `setCoachScript(msg, variant)`.
- [x] Author ≥6 lines/tag; parent-directed second person (“Try…”, “Say…”).
- [x] Trigger `coplay`: first daily round + streak of 2 misses (`state` counter).
- [x] Trigger `transfer` after rounds where generalisation fits (`spy`, `hunt`, `env`).
- [x] Keep literals in single top-of-script block or `CONSTANTS.coach`.

---

## 9. Content externalisation hook (Respect for diversity — **process**, not placeholder culture)

**Goal:** Coders enable safe rotation of word lists & image URLs without shipping unchecked “multicultural” assets.

**Subtasks:**

- [x] On DOMContentLoaded, optional async `fetch` of `./content/bundle.json` with try/catch.
- [x] Validate shape (`Array.isArray`, required keys); merge into globals if valid else log console warn.
- [x] Fallback path: bundled arrays unchanged (`file://` offline).
- [x] Add short `docs/content-bundle-schema.md` field list + example JSON.
- [x] Optional Node validator `scripts/validate-content.mjs` (stdin or path).
- [x] CONTRIBUTING note: cultural/ATSI rows need human review—not LLM-fill.

---

## 10. Extend blending scaffolding coverage (Outcome 5 — auditory discrimination & blending parity)

**Goal:** Robot / segmented speech is uneven if some modes bypass `robotizeText` path.

**Subtasks:**

- [x] Inventory all utterance creators (`grep` SpeechSynthesis / `speak(`).
- [x] Table modes vs robot coverage; mark misses.
- [x] Introduce `speakLesson(text, { robot?: boolean })` using `robotizeText` when `state.robotVoice`.
- [x] Migrate call sites gradually; preserve edge cases (single-letter sounds vs whole sentences).
- [x] First-enable tooltip or coach popover explaining segmented blending for carers.
- [x] Manual QA matrix: Robot on/off × `build`, `read`, `story`, `blocks`, `listen`.

---

## Suggested sequencing (optional)

| Phase | Tasks |
|-------|-------|
| A — literacy core | **1**, **10** |
| B — maths + wellbeing | **2**, **3** |
| C — inclusion & honesty | **4**, **5**, **7** |
| D — continuity & authoring | **6**, **8**, **9** |

---

## Definition of done (global)

- [x] Settings that change behaviour persist across reload consistent with existing storage.
- [x] Child paths stay uncluttered; policy/curriculum language stays **adult-first** unless explicitly a teaching line.
- [x] Update [`docs/eylf-curriculum-feature-map.md`](eylf-curriculum-feature-map.md) game table and §6 planned items when tasks land.

---

*This list is implementation guidance only; it does not certify NQF or EYLF compliance.*
