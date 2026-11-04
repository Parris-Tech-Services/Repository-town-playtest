# SylviePhonetics Research Implementation Roadmap

Source research: `C:\dev\SylvieElias_AppDesign_Research.txt`, prepared 2026-06-04.

This roadmap translates the literacy, phonics, EYLF, and therapy-context research into a practical upgrade plan for SylviePhonetics. Sylvie is 4 years and 3 months old, so the strongest evidence supports playful phonological awareness, audio-first modelling, scaffolded feedback, and parent/therapist alignment.

## Evidence Summary

| Research Finding | SylviePhonetics Design Implication |
|------------------|------------------------------------|
| Systematic explicit phonics is the evidence-based foundation for reading. | Keep a documented sequence and avoid random mode progression. |
| At age 4, phonological awareness precedes formal decoding. | Prioritize rhyme, syllables, onset-rime, and phoneme isolation before grapheme-heavy tasks. |
| Audio-first phoneme modelling matters. | Let Sylvie hear the sound before seeing or choosing the letter where possible. |
| Scaffolded feedback outperforms generic praise. | Use hint, model, retry, then move on gently. |
| Australian pronunciation matters. | Prefer parent/therapist-reviewed audio or clear AU-style speech settings. |
| App practice should support, not replace, therapy or educator guidance. | Add parent/therapist review notes and exportable practice summaries. |

## Product Goal

Make SylviePhonetics a short, playful, evidence-aligned between-session practice tool for early phonological awareness and phonics. It should feel like sound investigation, not testing or drilling.

## Priority 1: Sequence and Curriculum Safety

### 1. Make the Learning Sequence Explicit

Document and implement a default sequence:

1. Rhyme recognition.
2. Syllable clapping.
3. Onset-rime awareness.
4. First/last sound isolation.
5. Phoneme blending and segmenting.
6. Grapheme-phoneme correspondence.
7. Decodable word building and reading.

Acceptance criteria:

- Today's Path follows the sequence unless parent chooses otherwise.
- Parent assist mode explains why the sequence matters.
- Grapheme-heavy modes do not dominate early practice.

### 2. Add a "Sylvie's Name" Anchor

Add a parent-guided intro prompt:

```text
Sylvie starts with /s/. Can you hear /s/ in Sylvie?
```

Use this as a warm start, not a repeated quiz.

### 3. Review Decodable Word Lists

Audit word lists for:

- simple CVC words first
- clear sound-letter mapping
- no early sight-word memorization pressure
- Australian pronunciation compatibility
- age-appropriate vocabulary

## Priority 2: Audio-First and Feedback

### 4. Add Audio-First Interaction Pattern

For sound identification tasks:

1. Play the sound.
2. Show picture choices.
3. Reveal letters only after the child engages or parent enables letter view.

Acceptance criteria:

- Sound-first is the default in early modes.
- Visual letters remain available for parent-supported practice.
- Speech rate and robot voice settings still apply.

### 5. Standardize Scaffolded Feedback

Feedback ladder:

1. Hint: "Listen again. /m/ starts with your lips together."
2. Model: "This is /m/. Mmm, moon."
3. Retry: "Try one more."
4. Gentle close: "We will come back to that sound."

Avoid:

- red X failure states
- long correction lectures
- "wrong" as the main feedback
- generic "good job" without sound information

### 6. Add Australian Voice Guidance

Because browser TTS varies, document and support:

- parent modelling as the preferred sound source
- slower speech-rate setting
- therapist-approved word/sound lists
- optional recorded audio in future content bundles

## Priority 3: Session Design and Co-Play

### 7. Add Session Timing Rules

Target:

- 8-10 minute ordinary practice.
- Soft stop at 12 minutes.
- Hard transition at 15 minutes.

Closing copy:

```text
Sound practice is finished. Find one thing in the room that starts with your favorite sound.
```

### 8. Add Co-Play Prompts

Parent assist mode should cue:

- "Say the sound first, then let Sylvie copy."
- "If she misses it twice, model and move on."
- "Keep it playful. One good minute is enough."

### 9. Add Physical Sound Hunts

Bridge prompts:

- "Find something that starts with /s/."
- "Clap the beats in your name."
- "Say two rhyming silly words together."
- "Build the word with blocks or magnetic letters."

## Priority 4: EYLF, NSW, and Therapy Alignment

### 10. Strengthen Parent/Educator Notes

For each mode, include parent-facing metadata:

- EYLF Outcome link.
- Skill focus.
- Sequence stage.
- Suggested adult phrase.
- When to stop.

Example:

```text
Skill: phoneme isolation. Say the sound clearly, accept attempts, and model rather than test.
```

### 11. Add Therapist Review Workflow

Create a simple document/export summary for sharing with speech or OT supports:

- modes used
- sounds practiced
- words missed or reviewed
- parent observations
- regulation notes

Position the app as between-session home practice, not independent therapy.

### 12. Keep Cultural and Regional Context Safe

Maintain the optional content bundle rules:

- no bulk-generated culturally specific content
- human review for Aboriginal and Torres Strait Islander references
- offline-friendly content for regional use
- parent/educator review before publishing new word/image sets

## Priority 5: QA and Measurement

### 13. Add Research QA Checklist

For each mode, check:

- Does it fit the sequence?
- Is audio modelled before letter demand?
- Is feedback scaffolded?
- Is the child UI uncluttered?
- Does it end with a real-world bridge?
- Can a parent understand why the mode exists?

### 14. Add Gentle Progress Indicators

Track skill exposure without pressure:

- sounds explored
- modes touched
- review sounds
- parent notes

Avoid:

- streak pressure
- speed scoring
- leaderboards
- failure totals in child view

## Evidence-Graded Implementation Checklist

| Priority | Task | Evidence |
|----------|------|----------|
| P0 | Confirm sequence from rhyme/syllables to phoneme/grapheme work | A: reading science and Australian phonics guidance |
| P0 | Add audio-first modelling in early modes | A: phonological awareness and phonics research |
| P0 | Standardize scaffolded feedback | A: science of learning |
| P1 | Session soft stop at 12 minutes and close by 15 minutes | A: attention and screen-time guidance |
| P1 | Parent co-play prompts | A: AAP Five Cs and social interaction research |
| P1 | Physical sound hunt bridges | B: play-based transfer research |
| P1 | Therapist/educator summary | A/B: therapy coordination and NQF documentation |
| P2 | Optional recorded AU audio path | B: pronunciation quality and accessibility |

## Release Order

1. Sequence audit and Today's Path ordering.
2. Audio-first and scaffolded-feedback pass.
3. Session timing and physical sound bridge prompts.
4. Mode-level parent metadata with EYLF/sequence notes.
5. Therapist/educator summary export and optional audio improvements.

## Definition of Done

SylviePhonetics is research-aligned when a typical practice session:

- follows a clear phonological sequence
- starts from sound before print when appropriate
- lasts about 8-12 minutes
- uses scaffolded hint/model/retry feedback
- invites parent modelling
- bridges into real-world sound play
- can be explained to educators or therapists as purposeful home practice
