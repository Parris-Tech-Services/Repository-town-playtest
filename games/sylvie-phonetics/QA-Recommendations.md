# SylviePhonetics QA Recommendations

This document records the QA audit findings for SylviePhonetics and the recommended changes to align the app with early childhood learning, neurodiversity-aware design, and family co-play goals.

## Key Audit Findings
- Missing scaffolded feedback on wrong answers.
- No session timer or natural closing ritual.
- No movement or breathing breaks between games.
- Phonological tasks and grapheme tasks are mixed too early.
- Parent co-play prompts are not built into gameplay.
- Some interactions are too small on mobile and keyboard mode can confuse young children.

## Recommendations
1. Add scaffolded error feedback.
   - Gentle hint after an incorrect response.
   - Model the target phoneme without adding a schwa.
   - Invite the child to try again.
   - **Acceptance**: every wrong answer triggers a specific hint before the correct answer is shown.

2. Add a session timer and closing ritual.
   - After 10–12 minutes, show a calm transition screen.
   - Prompt the child to share progress with a parent and move to offline play.
   - **Acceptance**: the app pauses and offers a friendly end-of-play animation after the timer.

3. Insert movement or breathing breaks.
   - Every 5–7 minutes, present a short interstitial screen.
   - Use simple movement instructions or breathing prompts.
   - **Acceptance**: the app invites the child to pause, move, or breathe before continuing.

4. Separate phonological awareness from letter tasks.
   - Keep rhyme and sound games free of letters until phoneme isolation is secure.
   - Avoid mixing letters and pictures in early levels.
   - **Acceptance**: each mini-game targets one learning stage only.

5. Add in-context parent co-play prompts.
   - Encourage adults to say words, listen together, or act out sounds.
   - Make prompts visible in game screens rather than hidden settings.
   - **Acceptance**: each game includes at least one caregiver prompt.

## Implementation Notes
- Use locally stored audio and avoid external streaming.
- Improve mobile tap areas for selectable answers and feedback controls.
- Consider an optional audio/caption mode for accessibility.

## Suggested Roadmap
- `P1`: scaffolded hints, timer, closing ritual
- `P2`: movement/breathing breaks, parent prompts
- `P3`: sound-only phonological sequence, accessibility mode

## Status
- [ ] Add scaffolded hints and error coaching
- [ ] Add session timer and closing ritual
- [ ] Add movement/breathing breaks
- [ ] Separate sound tasks from letter tasks
- [ ] Add visible parent prompts

## Appendix: Audit & Research Excerpts
### QA Audit for Child Apps (relevant SylviePhonetics findings)
- SylviePhonetics is engaging and covers multiple phonological tasks, but inconsistent feedback and occasional silent errors limit educational value and risk frustration.
- Strengths: variety of games, large tap targets, parent assist mode, calm audio feedback, and rough phonics progression from syllables to phoneme identification.
- Missing supports: no clear session timer or closing ritual; wrong answers produce generic “no” or silence without scaffolded hints; no movement or breathing breaks; no co-regulation prompts inside activities.
- Developmental gap: many tasks rely on letter guessing instead of sound processing; mixing letters and pictures in early tasks can blur phonological awareness vs letter recognition.
- Recommendations excerpt: add three-step scaffolded feedback; introduce session timers with natural closing rituals; insert brief movement or breathing breaks; separate phonological tasks from grapheme tasks; add parent co-play prompts within games.

### SylvieElias_AppDesign_Research (relevant SylviePhonetics findings)
- Phonics sequence: begin with rhyme recognition, syllable segmentation, onset-rime, phoneme isolation, phoneme blending, then grapheme-phoneme correspondence.
- Design principles: sequence matters; use the child’s own name as an anchor; decodable words only in early stages; audio-first modelling before graphemes; scaffolded feedback if wrong — hint, model, never just show an X.
- Four Pillars of Learning: Active Involvement, Contingent Feedback, Meaningful Experiences, Social Interaction.
- Session length: 4-year-olds should target 8–12 minute structured sessions, with a natural closing ritual; multiple short sessions outperform one long session.
- Reward guidance: use informational praise, avoid variable-ratio reward schedules, choose narrative completion over points, and never shame mistakes.

### Evidence-based guidance for SylviePhonetics
- Keep early phonics tasks audio-first and separate phonological awareness from grapheme teaching until the child shows mastery.
- Provide immediate contingent feedback and model the target phoneme without adding a schwa.
- Include visible parent prompts and co-play invitations on launch and within game screens.
- Use a calm voice and support optional audio/caption modes for accessibility.
