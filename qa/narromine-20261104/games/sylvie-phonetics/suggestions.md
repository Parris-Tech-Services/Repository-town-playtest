# Sylvie Phonics Future Feature Backlog

Each item is a concrete future feature idea with implementation subtasks. These are not defects; they are optional extensions for later product depth.

## Issue 1: Add I Spy Sound Game

- [ ] Add a new game mode called `I Spy Sound`.
- [ ] Create prompts like `I spy something that begins with /b/`.
- [ ] Show image or letter choices that begin with several sounds.
- [ ] Add logic to select a random target sound, then filter choices so only one correct option matches that initial sound.
- [ ] Add audio playback of the clue in sound-only form (`b-b-b`) and optional text.
- [ ] Track success and give positive feedback when the child taps the right object.

## Issue 2: Add Multisensory Letter Tracing

- [ ] Add a tracing activity screen with a letter outline.
- [ ] Render each letter as a large touch/cursor trace path.
- [ ] Add stroke detection or trace progress when the user drags along the path.
- [ ] Play the letter sound as the child traces.
- [ ] Add alternative sand, cream, or paint styles using a visual overlay and tactile-looking animation.
- [ ] Provide a done button and reinforcement message when tracing is complete.

## Issue 3: Add Sound Scavenger Hunt

- [ ] Add a scavenger hunt mode with an initial sound target like `/s/`.
- [ ] Show a set of household object pictures or names.
- [ ] Ask the child to pick every item that starts with the target sound.
- [ ] Add a find-more screen with multiple rounds and a counter of found items.
- [ ] Optionally offer a real-world mode that uses pictures of spoon, sock, sun, etc.

## Issue 4: Add Blending With Sound Blocks

- [ ] Add a draggable block-based builder for CVC words.
- [ ] Display letter blocks that the child can drag into a row.
- [ ] When blocks are placed into order, speak each sound separately then blend them together.
- [ ] Add a slide-together animation to show the blocks joining into a word.
- [ ] Offer target words from the existing phonics list and gradually increase complexity.

## Issue 5: Add Robot Voice Blending

- [ ] Add a robot voice toggle/button in blending or reading games.
- [ ] When activated, speak words in segmented form: `d - o - g` then blended: `dog`.
- [ ] Use the same `SpeechSynthesisUtterance` path, but with short gaps between phonemes.
- [ ] Add a label or icon so adults know this is a blending support mode.
- [ ] Apply it to word reading, word building, and sentence reading modes.

## Issue 6: Add Rhyming Pairs Game

- [ ] Add a rhyming match mode that shows word pairs.
- [ ] Present one word and several choices; ask `Which word rhymes with cat?`.
- [ ] Use a grid or card flip interface for matching pairs.
- [ ] Add audio prompts and a same-ending-sound explanation.
- [ ] Track correct rhymes and optionally introduce simple rhyme families like `-at`, `-og`, `-ip`.

## Issue 7: Add Interactive Sound Songs

- [ ] Add a song/chant mode for letter sounds.
- [ ] Build short vocal loops like `What does the /s/ say? /s/ /s/ /s/`.
- [ ] Display a letter and animate bouncing sound icons while the app sings.
- [ ] Add repeat and next-sound controls so the child can listen to sets of letters.
- [ ] Include a sing-with-me prompt to reinforce auditory memory.

## Issue 8: Add Initial Sound Jump

- [ ] Add a game where letters appear on the floor or tiles.
- [ ] Prompt the child with a sound: `Jump on the letter that says /m/`.
- [ ] Make the answer selection visual and active, such as big tiles or buttons arranged like stepping stones.
- [ ] Add keyboard shortcuts or touch zones for jumping.
- [ ] Provide an animated jump response and congratulatory feedback.

## Issue 9: Add Word Mapping With Counters

- [ ] Add a phoneme segmentation activity.
- [ ] Show a word and empty boxes for each sound.
- [ ] Provide draggable counters or dots.
- [ ] Ask the child to move one counter into each box while saying each sound.
- [ ] After placement, speak each sound again and blend into the whole word.
- [ ] Use simple CVC words first, then longer words as difficulty increases.

## Issue 10: Add Environmental Print Reading

- [ ] Add a mode that uses familiar logos, food labels, and signs.
- [ ] Show real-world word graphics and ask `What sound does this start with?`.
- [ ] Build a mini gallery of simple labels with obvious initial sounds.
- [ ] Add a spot-the-sound prompt rather than focusing on letter names.
- [ ] Reinforce that letters represent sounds in everyday print.

## Implementation Notes

- Use the existing app structure: new game IDs, render functions, and state routing.
- Reuse audio/speech helpers and the current `startGame` logic.
- Persist new game mode settings in local storage only when they change future behavior.
- Where possible, add these features as optional modes so the app stays gentle for four-year-olds.
