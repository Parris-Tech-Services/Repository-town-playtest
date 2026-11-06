# Dungeon Crawler Carl Game Build Plan

## Purpose

Build the current text-and-grid tutorial prototype into a full video game adaptation plan for *Dungeon Crawler Carl* that is as accurate to the books as possible while remaining practical, testable, and legally safe.

This plan assumes one of two paths:

1. **Official/licensed adaptation:** the game may use book-specific names, characters, dialogue, setting details, designs, factions, items, quests, and direct references after rights clearance.
2. **Fan/internal prototype:** the project can study the books for structure and tone, but should avoid distributing copyrighted story text, exact dialogue, official art, audiobook performance, trademarked branding, or protected character/material usage without permission.

The strongest version of the game is the licensed path. The strongest unlicensed prototype is a faithful systems prototype inspired by the structure, with placeholder names and original text.

## Current Prototype Summary

The provided Python prototype contains:

- A 12x12 grid tutorial guild room.
- Carl as the player character.
- Princess Donut following one tile behind Carl.
- Mordecai behind a service desk.
- Basic wall and desk collision.
- Proximity-triggered dialogue.
- Simple flavor text and status display.

This is a good seed because it already captures three crucial pillars:

- **Companion presence:** Donut is not just flavor; she follows and reacts.
- **Systemized dungeon logic:** movement, barriers, NPC proximity, status, and announcements can become formal mechanics.
- **Tutorial guild framing:** Mordecai introduces game rules through in-world stress and exposition.

## Accuracy Principles

### Canon First

Every feature should be traceable to a canon reference before being marked final.

Create a private **Lore Bible** with:

- Source book.
- Chapter or approximate scene location.
- Canon status: confirmed, inferred, contradiction, invented-for-gameplay.
- Gameplay translation.
- Risk rating: low, medium, high.

Example:

| Feature | Canon Status | Game Translation | Risk |
|---|---|---|---|
| Carl starts poorly equipped | Confirmed | Opening loadout has minimal armor and improvised gear | Low |
| Donut follows Carl and comments frequently | Confirmed | Companion AI, banter, social stat hooks | Low |
| Exact book dialogue | Protected text | Replace with original game dialogue unless licensed | High |
| Tutorial floors as constrained early-game spaces | Confirmed | Floor 1 and Floor 2 onboarding arc | Low |

### Accuracy Does Not Mean Literal Copying

The game should reproduce:

- Rules and consequences.
- Character roles.
- Floor identity.
- The escalation curve.
- The absurd, cruel, televised RPG structure.
- Carl and Donut's relationship dynamic.

The game should not reproduce large blocks of book prose or audiobook performance unless licensed.

### Player Experience Over Scene Checklist

Do not build a museum of book scenes. Build the systems that make the player feel like they are surviving the crawl:

- Forced choices.
- Dungeon timers.
- Announcements.
- Loot temptation.
- Viewer pressure.
- Exploitable rules.
- Sponsor/show mechanics.
- Risky progression.
- Carl-and-Donut tactical partnership.

## Core Game Vision

### Genre

Tactical action RPG / survival roguelite with party-based companion systems, dungeon-floor progression, loot, quests, class growth, and televised-show pressure.

### Camera Options

Recommended target:

- **Phase 1:** 2D top-down grid or tile-based tactics.
- **Phase 2:** Isometric 2.5D with animated characters.
- **Phase 3:** Full 3D only if the team has the budget for animation, level art, AI, and cinematic staging.

The prototype should evolve through 2D first. It lets the team validate rules, dialogue, quests, and floor design before committing to expensive visuals.

### Platform

Recommended initial platform:

- PC first.
- Controller support later.
- Console only after the combat, UI, and content pipeline are stable.

### Engine Recommendation

Best practical options:

- **Godot:** excellent for 2D/isometric tactics, fast iteration, open source, good scripting.
- **Unity:** stronger asset ecosystem and commercial pipeline, but more overhead.
- **Unreal:** best for 3D spectacle, least suitable for an early small-team systems prototype.

Recommendation: **Godot for the first serious vertical slice**, unless the team already has strong Unity expertise.

## Adaptation Scope

### Minimum Complete Game

The most realistic "complete game" should adapt the opening arc through the early dungeon experience rather than all published books.

Recommended first complete release:

- Surface collapse/opening survival.
- Floor 1 tutorial dungeon.
- Floor 2 training escalation.
- Floor 3 class/race/guild systems as the first major hub transformation.
- End with a major boss/escape/set-piece that feels like a season finale.

This creates a game with a beginning, progression arc, and climax without attempting to cram eight books into one impossible project.

### Expansion Model

Use episodic or seasonal expansion structure:

- Game 1: Tutorial and early crawl.
- Expansion 1: Over City and class identity.
- Expansion 2: rail/network floor systems.
- Expansion 3: faction/show politics.
- Later expansions: higher-floor special rules.

This mirrors the book structure better than one enormous open-world game.

## Required Research Track

### Canon Source Set

Use the books as the primary source. As of the latest checked official author site, the listed mainline books include:

- *Dungeon Crawler Carl*
- *Carl's Doomsday Scenario*
- *The Dungeon Anarchist's Cookbook*
- *The Gate of the Feral Gods*
- *The Butcher's Masquerade*
- *The Eye of the Bedlam Bride*
- *This Inevitable Ruin*
- *A Parade of Horribles*

Secondary sources are useful for navigation but must not override the books:

- Official author site.
- Official game/TTRPG/card-game announcements.
- Wiki summaries.
- Author interviews.
- Audiobook/Immersion Tunnel only for tone reference, not copied performance.

### Lore Bible Workflow

1. Read or re-read the target book section.
2. Add every relevant mechanic, character, item, location, faction, race, class, status effect, achievement, and quest to the lore bible.
3. Mark whether it is essential, optional, or background.
4. Convert it into gameplay rules.
5. Review for contradictions.
6. Rewrite all dialogue as original game text unless licensed.
7. Playtest whether the feature feels like the books, not merely whether it references them.

## Main Systems

### 1. Character System

Core character data:

- Name.
- Species/race.
- Class.
- Level.
- Stats.
- Skills.
- Equipment slots.
- Inventory.
- Status effects.
- Achievements.
- Titles.
- Faction relationships.
- Sponsor/viewer modifiers.

Carl-specific early profile:

- Starts under-equipped.
- Improvised melee and explosive tactics.
- High survivability through rule exploitation.
- Strong environmental interaction.
- Tactical, angry, protective decision-making.

Donut-specific early profile:

- Companion character, not a pet cosmetic.
- Starts vulnerable but becomes increasingly central.
- Social/showmanship mechanics.
- Ranged/magic/charisma-style contribution depending on progression point.
- Banter and morale pressure.
- Independent danger if separated, ignored, or targeted.

Mordecai-specific role:

- Tutorial guide.
- System explainer.
- Rules interpreter.
- Crafting/build advisor later.
- Should feel overworked, trapped, knowledgeable, and reluctant.

### 2. Party and Companion AI

Donut should never feel like a static follower.

Features:

- Follow behavior with spacing options.
- Avoid hazards.
- React to loot, enemies, smells, status effects, and bad choices.
- Contextual banter.
- Combat role automation with player-issued commands.
- Panic or refusal states.
- Relationship trust meter.
- Rescue and protect mechanics.

Command examples:

- Stay close.
- Hold position.
- Hide.
- Attack target.
- Use ability.
- Interact.
- Retreat.

### 3. Dungeon Floor System

Each floor should be generated or authored from a data model:

- Floor number.
- Theme.
- Legal rules.
- Timer.
- Stairwell rules.
- Monster tables.
- Quest pool.
- Loot tables.
- Environmental hazards.
- Safe rooms.
- Guilds.
- Shops.
- Special floor mechanics.
- Broadcast modifiers.

Floor design must avoid generic dungeon sameness. Every floor needs one dominant rule twist.

### 4. System AI and Announcements

The System AI is a core feedback layer.

Mechanics:

- Achievement popups.
- Quest alerts.
- Reward notifications.
- Trap warnings.
- Invasive commentary.
- Tutorial hints.
- Viewer-facing spectacle language.
- Escalating obsession/instability tone.

Implementation:

- Build an event-driven announcement manager.
- Each event has variables, severity, timing, and repetition limits.
- Use original written lines unless licensed.
- Maintain tone categories: tutorial, mocking, celebratory, punishment, commercial, obsessive.

### 5. Combat

Recommended combat style:

- Real-time with tactical pause, or grid-based turn tactics.

For first build, choose **grid-based tactical turns** because it evolves naturally from the prototype.

Combat rules:

- Position matters.
- Environmental objects matter.
- Improvised weapons matter.
- Explosives and traps are high-risk/high-reward.
- Donut and Carl must synergize.
- Enemy telegraphs should be readable.
- Bosses should be puzzle-like, not just high-health enemies.

Core combat actions:

- Move.
- Attack.
- Use item.
- Use ability.
- Shove/pull.
- Interact with environment.
- Defend.
- Command companion.
- Flee.

### 6. Loot and Inventory

Loot should feel dangerous, funny, and strategic.

Item model:

- Name.
- Rarity.
- Slot.
- Stats.
- Active effect.
- Passive effect.
- Curse/side effect.
- Description.
- Source.
- Canon status.

Inventory principles:

- Limited capacity creates decisions.
- Gear should visibly affect character identity.
- Some rewards should be jokes mechanically useful in unexpected ways.
- Item descriptions should be original but in the series tone.

### 7. Quest System

Quest data:

- Title.
- Trigger.
- Objectives.
- Timer.
- Failure state.
- Rewards.
- Hidden consequences.
- Announcement lines.
- Canon reference.

Quest types:

- Survival.
- Escort/protect.
- Kill target.
- Puzzle.
- Social/broadcast.
- Crafting.
- Escape.
- Optional chaos quest.

### 8. Class, Race, and Progression

The game must delay full build identity until the canon-appropriate point.

Progression stages:

- Pre-class survival.
- Basic leveling and stats.
- Tutorial rewards.
- Race/class selection.
- Skill specialization.
- Build-defining synergies.

Do not give Carl and Donut late-book capabilities in the opening game unless the project intentionally becomes a non-canon sandbox.

### 9. Viewer, Sponsor, and Show Mechanics

This is where the game becomes *Dungeon Crawler Carl* rather than a normal dungeon RPG.

Systems:

- Viewer interest score.
- Sponsor offers.
- Popularity boosts.
- Broadcast events.
- Audience-favored behavior.
- Corporate interference.
- Reputation tags.
- Risk/reward spectacle bonuses.

Player tension:

- The safest action is not always the most rewarded action.
- Entertaining choices can unlock benefits but create danger.
- Refusing spectacle should sometimes be possible, but costly.

### 10. Dialogue and Narrative

Dialogue requirements:

- Branching conversations.
- Banter while exploring.
- Reactive dialogue after major events.
- NPC memory of choices.
- Companion interruptions.
- System messages as separate narrative channel.

Accuracy method:

- Use the books to define what characters know, want, fear, and hide.
- Write new game dialogue that expresses those traits.
- Avoid copying book passages unless licensed.

Carl voice:

- Dry.
- Protective.
- Frustrated.
- Practical.
- Increasingly strategic.

Donut voice:

- Dramatic.
- Opinionated.
- Socially aware.
- Proud.
- Often funny but not stupid.

Mordecai voice:

- Stressed.
- Explanatory.
- Cynical.
- Professionally trapped.
- Protective under protest.

### 11. UI

UI must feel like an alien reality-show RPG interface.

Required screens:

- Character sheet.
- Companion sheet.
- Inventory.
- Equipment.
- Quests.
- Achievements.
- Floor map.
- Announcements log.
- Combat timeline.
- Loot comparison.
- Settings/accessibility.

Prototype UI rule:

- Every book-like system message becomes a structured UI event.
- The player can open an archive of announcements and rewards.

### 12. Save System

Needed early:

- Manual save in safe areas.
- Autosave at room transitions.
- Combat restart option for prototype.
- Later: harsher survival modes.

Data to save:

- Floor state.
- Entity positions.
- Inventory.
- Character stats.
- Dialogue flags.
- Quest flags.
- Achievements.
- Generated dungeon seed.

## Content Plan by Milestone

### Milestone 0: Clean Prototype

Goal: convert the current Python script into a maintainable prototype.

Tasks:

- Split code into modules: world, entity, input, rendering, dialogue, data.
- Add JSON/YAML data files for characters, dialogue, maps, and items.
- Add collision layers.
- Add event log.
- Add save/load.
- Add unit tests for movement and collision.

Deliverable:

- Playable terminal tutorial room with clean architecture.

### Milestone 1: Tutorial Guild Vertical Slice

Goal: make the first room feel like a real game scene.

Features:

- Mordecai interaction menu.
- Donut follow AI with collision-aware pathing.
- System announcement popup.
- Inventory with initial loadout.
- Basic character sheet.
- Tutorial chest.
- Quest: speak to guide, inspect inventory, open chest, reach exit.
- Original placeholder dialogue.

Deliverable:

- 10-15 minute playable tutorial.

### Milestone 2: First Combat Loop

Goal: prove combat, companion control, and rewards.

Features:

- Turn-based grid combat.
- Enemy AI.
- Carl melee action.
- Donut support/ranged action.
- Consumable item.
- Environmental hazard.
- Victory reward.
- Failure/retry.
- Achievement trigger.

Deliverable:

- One combat encounter that feels dangerous and funny.

### Milestone 3: Floor 1 Mini-Dungeon

Goal: create a complete early dungeon loop.

Features:

- 8-12 rooms.
- Branching paths.
- Locked door or puzzle.
- Safe room.
- Loot table.
- 3 enemy types.
- 1 mini-boss.
- Quest chain.
- Timed objective.
- Exit/stairwell.

Deliverable:

- 45-60 minute playable demo.

### Milestone 4: Progression and Build Identity

Goal: make leveling and choices matter.

Features:

- Experience.
- Level rewards.
- Stat choices.
- Skill unlocks.
- Gear comparison.
- Donut progression.
- Achievement rewards with effects.

Deliverable:

- Replayable demo with different builds.

### Milestone 5: Visual Engine Transition

Goal: move from terminal/grid to visual game.

Options:

- Godot tilemap.
- Unity 2D grid.
- Web prototype with Canvas/PixiJS.

Minimum visuals:

- Animated Carl token.
- Animated Donut token.
- NPC sprites.
- Tilemap rooms.
- UI panels.
- Announcement overlays.
- Basic combat VFX.

Deliverable:

- Visual version of the tutorial guild and first combat.

### Milestone 6: Licensed Canon Pass

Goal: only after rights are clarified, replace placeholders with approved canon material.

Tasks:

- Rights review.
- Character/name approval.
- Dialogue approval.
- Visual design approval.
- Brand/logo approval.
- Book-scene adaptation checklist.
- Sensitivity and rating review.

Deliverable:

- Canon-approved vertical slice.

## Data Architecture

Recommended project structure:

```text
game/
  data/
    characters/
    dialogue/
    floors/
    items/
    quests/
    achievements/
    enemies/
    lore_bible/
  src/
    core/
    combat/
    dialogue/
    dungeon/
    ui/
    save/
  tests/
  tools/
```

### Example Entity Data

```json
{
  "id": "carl",
  "displayName": "Carl",
  "role": "player",
  "canonStatus": "licensed-required",
  "stats": {
    "strength": 5,
    "dexterity": 4,
    "constitution": 6,
    "intelligence": 4
  },
  "tags": ["crawler", "human", "improviser"]
}
```

### Example Announcement Data

```json
{
  "id": "first_bad_choice",
  "trigger": "player_bumps_barrier",
  "tone": "mocking",
  "licensedText": false,
  "lines": [
    "Achievement unlocked: You found the wall. It was there the whole time."
  ],
  "reward": null
}
```

## Accuracy Checklist

Before any feature becomes final:

- Does this appear in the books or official material?
- If yes, where?
- Is the implementation mechanically faithful?
- Is the timing/order faithful?
- Does the character know this yet?
- Does this create contradictions with later events?
- Is the dialogue original or licensed?
- Are names/visuals safe to use for the intended release?
- Does it feel like the dungeon is exploiting the characters for entertainment?

## Corrections to the Current Prototype

The prototype is useful, but several details should be treated as placeholders until checked against canon:

- Mordecai's exact form and phrasing should be verified against the relevant book scene.
- The Tutorial Guild layout should be reconstructed from book evidence instead of invented as a 12x12 square.
- Carl and Donut's starting stats and titles should be separated into "known at start" versus "earned later."
- Donut should not merely trail Carl; she needs autonomous reactions and eventually combat/social mechanics.
- Direct quote-style dialogue should be rewritten as original placeholder lines unless licensed.
- "No Pants Armor Penalty" should be a humorous internal placeholder until the actual stat/equipment rules are defined.

## Legal and Production Risk

High-risk without license:

- Title/logo use in a distributed game.
- Carl, Donut, Mordecai, and other named characters.
- Direct book dialogue.
- Official cover art or audiobook voices.
- Exact floor/event recreation with protected expression.
- Marketing as an official game.

Lower-risk for private prototyping:

- Internal mechanics prototype.
- Placeholder characters.
- Original dialogue.
- Systems inspired by LitRPG dungeon progression.
- Private lore notes not distributed.

Recommended next step:

- If this is for a private prototype, keep working with placeholder/legal-safe assets.
- If this is intended for release, pursue licensing before investing heavily in exact canon adaptation.

## Team Roles Needed

Minimum indie team:

- Game designer/systems designer.
- Programmer.
- Writer/narrative designer.
- 2D artist or technical artist.
- UI designer.
- QA/playtester.

Larger team:

- Combat designer.
- Level designer.
- Producer.
- Audio designer.
- Composer.
- Voice director.
- Legal/licensing contact.

## Development Roadmap

### Month 1

- Clean prototype architecture.
- Build lore bible template.
- Create data-driven map, entity, and dialogue systems.
- Add save/load.

### Month 2

- Build tutorial guild vertical slice.
- Add inventory, quest log, character sheet.
- Add event-driven announcements.

### Month 3

- Add turn-based combat.
- Add first enemy.
- Add Donut commands.
- Add loot/reward loop.

### Month 4

- Build Floor 1 mini-dungeon.
- Add multiple rooms, hazards, and mini-boss.
- Add playtest telemetry.

### Month 5

- Move into visual engine.
- Recreate vertical slice with sprites/tilemap/UI.
- Keep data files portable.

### Month 6

- Polish vertical slice.
- Lore accuracy review.
- Legal review.
- Decide: fan prototype, pitch deck, or licensed production.

## Definition of Done for the First Serious Demo

The first demo is complete when:

- The player can start, learn controls, talk to the guide, manage inventory, fight, loot, complete quests, and exit the floor section.
- Donut meaningfully reacts and participates.
- System announcements respond to player behavior.
- The dungeon has a timer or pressure mechanic.
- At least one encounter can be solved creatively through environment/item use.
- The UI clearly exposes RPG stats, quests, loot, and achievements.
- Every canon-derived element has a lore bible entry.
- No direct book text is included unless licensed.

## Interactive Plan Addendum

This section incorporates the tabbed game-plan material from `dungeon_crawler_carl_game_plan.html` into the master build plan.

### Foundation: Tutorial Guild

The first build phase turns the existing prototype into a book-accurate Tutorial Guild scene.

Core engine requirements:

- Grid-based movement on a 12x12 map.
- Carl starts in boxer shorts and leather jacket, with no pants.
- Donut starts as Level 0 and explicitly civilian, not combat-ready.
- Mordecai appears in Chupacabra form behind the desk.
- Collision, proximity triggers, and dialogue cycling all work.

Book-accurate additions:

- Add the System interface as dungeon-OS-style pop-up notifications.
- Treat Carl's leather jacket as a specific named inventory item, not generic clothing.
- Display Donut's Grand Champion pedigree title in her stat block.
- Increase Mordecai's stress level with each dialogue cycle.
- Escalate Donut's complaints about smell, dirt, and indignity as the scene progresses.

### Class and Stats System

The dungeon's class selection is book-critical and must not be treated as a generic RPG menu.

Carl's path:

- Starts classless.
- Receives class-selection UI through the System.
- Must choose before deeper progression.
- Candidate class framework should include crawler-style baseline options plus physical, rogue, healer, enchanter, monk, and brawler-adjacent paths as data-driven records.
- Carl's long-term combat identity leans physical, improvised, and explosive rather than formal magic.
- The no-pants state creates a named armor penalty, not only a joke.

Donut's path:

- Starts Level 0, civilian, and classless.
- Unlocks progression separately from Carl.
- Develops toward magic, support, social power, and viewer appeal.
- Cat traits include agility bonus, low carry weight, claws, small-body navigation, and vulnerability to heavy direct damage.
- Grand Champion status grants cosmetic fame, social leverage, and viewer-interest modifiers.

### Floor 1: The Savannas

Floor 1 should be a fully playable first dungeon floor rather than a generic cave.

Environment requirements:

- Open grassland-style biome.
- Sky-lit or illusion-lit presentation rather than ordinary underground tunnels.
- Scattered ruins and biome transition zones.
- Early enemies such as kobolds, goblin scouts, and small-to-mid-sized dungeon wildlife where canon-supported.
- Saferooms with lockable doors, shops, rest, and NPC interaction.
- Visible floor collapse deadline.

Key Floor 1 elements:

- Introduction of explosive items.
- Carl discovers improvised weapons and explosive crafting.
- Gladiator-arena-style side content if licensed and canon-verified.
- Viewer sponsorships begin as item drops or reward events.
- Donut earns experience and begins moving from civilian liability to active co-protagonist.

### Syndicate and Viewer System

The show-within-a-game layer must be a real mechanical system.

Viewer sponsorships:

- Alien viewers watch the dungeon as entertainment.
- Sponsorships drop items into the dungeon in real time.
- Popularity affects drop quality and frequency.
- Donut is more naturally popular, which the player must manage.
- Controversial, funny, creative, or shocking actions spike viewership.
- Different viewer factions should prefer different behaviors.

Syndicate faction:

- Organized criminal and economic presence inside the dungeon.
- Can be allied with, betrayed, avoided, or exploited.
- Saferoom economy should feel influenced by Syndicate control where canon-supported.
- Donut's social skills unlock dialogue paths Carl cannot access.
- Carl's bluntness can close social routes while opening intimidation or direct-action options.

### Deeper Floors and End State

The first complete game should escalate through early-book content while avoiding scope explosion.

Planned escalation:

- Floor 2: more urban, ruined, or constructed spaces with vertical navigation and more complex NPC factions, pending canon verification.
- Floor 3: celebrity-crawler status, major hub play, class/race identity, guild systems, and advanced social mechanics.
- Floor 4 and beyond: environmental rules become more specific and punishing; bosses become character-specific instead of generic fights.
- Lore collectibles gradually reveal the dungeon's deeper purpose.

### Lore Accuracy Requirements

The following details are mandatory accuracy targets:

- Carl's jacket is not optional flavor. It must be a named, stats-bearing item with durability and plot relevance.
- Donut's breed and Grand Champion title matter mechanically. They influence charisma, fame, social checks, viewer popularity, and her identity.
- The System is a character, not a neutral HUD. It mocks crawlers, hypes deaths, editorializes outcomes, gates features, and frames the game as entertainment.
- The dungeon is a literal alien TV show. Viewer counts, sponsor drops, popularity, and faction tastes must affect play.
- Mordecai's stress is both comedy and tragedy. He is competent, trapped, protective, and limited in what he can reveal.
- Carl's lack of pants is a named debuff with armor consequences.
- Explosive crafting is Carl's core combat identity and should be discovery-based, improvisational, and dangerous.
- Floor collapse timers must create real pacing pressure. Players cannot grind forever.

### Core Systems Breakdown

Critical systems:

- **System interface:** sarcastic, personality-driven dungeon-OS notifications for achievements, kills, timers, class selection, rewards, and failures.
- **Dual protagonist system:** Carl and Donut have separate stat sheets, class trees, reputations, inventories or carry constraints, and dialogue affordances.

High-priority systems:

- **Improvised explosive crafting:** combine dungeon materials, discover recipes through experimentation, vary yield by components, allow limited combat improvisation.
- **Viewer popularity and sponsorships:** live popularity meter, audience factions, action-specific spikes, and sponsor drops.

Important systems:

- **Floor timer and collapse mechanic:** visible countdown changes pacing, NPC behavior, prices, and risk tolerance.
- **Saferoom economy:** shops, rest, NPCs, lockable safety, Syndicate-influenced pricing, and items that hint at future hazards.

### Character Specs

Carl Estanza:

- Starts in boxer shorts, leather jacket, socks, and little else.
- No class at the beginning.
- Physical, explosive, improvisational combat identity.
- Socially blunt, accidentally honest, and more effective than expected.
- Refuses to quit even when quitting is the rational choice.
- Treats Donut like a responsibility while gradually accepting her as a partner.

Princess Donut:

- Persian show cat and Grand Champion.
- Starts as Level 0 civilian with no combat experience.
- High charisma and fame potential from the beginning.
- Complains about smell, dirt, indignity, status, and treatment.
- Becomes more popular with viewers faster than Carl.
- Develops magic/support/social capabilities.
- Loves Carl deeply while expressing it through attitude, demands, and loyalty.

Mordecai:

- Appears in Chupacabra form in the Tutorial Guild where canon-confirmed.
- Starts stressed and becomes more frantic as danger rises.
- Deeply competent.
- Knows more than he can safely explain.
- Shows affection through exasperated guidance.
- Should feel like a tragic character forced to play a comedy role.

### World Design

Floor 1:

- Grassland or savanna-like environment if canon-verified.
- Sky-lit illusion or artificial biome presentation.
- Intro enemies and environmental hazards.
- Early arena or side-content hooks where canon-supported.
- First improvised explosive success.
- Donut's early XP and viewer-awareness moments.

Floor 2:

- More complex navigation and stronger faction presence.
- Urban, ruined, constructed, or training-floor structure must be verified before finalization.
- Carl and Donut's reputation begins to travel ahead of them.
- Viewer factions and social stakes grow more complex.

Floor 3:

- Major hub and celebrity-status escalation.
- Class, race, guild, and advanced social systems become central.
- Donut's star power should materially affect options.
- Alliances and betrayals become more important.

Saferooms:

- Present across floors.
- No enemies inside.
- Lockable doors.
- Shop, rest, and NPC interaction.
- Prices and inventory respond to floor danger and faction influence.
- Stock can subtly foreshadow the next floor's needs.

### Tech Stack and Data Architecture

Recommended paths:

- **Pygame or terminal Python:** best for extending the prototype directly.
- **Godot 4:** best long-term indie choice for a tile-based or isometric game.
- **Unity 2D:** better if the team wants a CRPG-like presentation and already knows C#.

Modular data requirements:

- Dialogue stored in JSON or another data format, never hard-coded.
- Stats, debuffs, items, classes, achievements, quests, and notifications stored as data.
- Floor maps authored in a tile editor or structured map format.
- System notifications built from templates that accept variables such as crawler name, item, kill type, and reward.
- Crafting recipes represented as a graph so combinations and discovery can expand without rewriting code.

First milestone target:

- Playable Tutorial Guild plus Floor 1 entry corridor.
- System interface with sarcastic notifications.
- Donut following Carl with her own stat display.
- Named leather jacket item.
- No-pants debuff.
- Mordecai stress progression.
- One working crafting combination that produces an explosion.

## Immediate Next Build Task

Transform the current Python file into a data-driven prototype:

1. Create `crawler.py` as the runner.
2. Create `data/characters.json`.
3. Create `data/tutorial_guild_map.txt`.
4. Create `data/dialogue.json`.
5. Add save/load.
6. Add a quest log.
7. Add an announcement manager.
8. Add a tutorial chest.
9. Add a first enemy encounter in a separate room.
10. Add simple tests for movement, collision, following, and dialogue triggers.

That gives the project a real spine: the story can grow through data, and the engine can later move to Godot or Unity without throwing away the core design.
