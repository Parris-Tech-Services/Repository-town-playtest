# Dungeon Crawler Carl Game Prototype

<p align="left">
	<img src="https://img.shields.io/github/actions/workflow/status/joshuaparris-max/carl/ci.yml?branch=main" alt="CI" />
	<a href="https://carl-opal.vercel.app/"><img src="https://img.shields.io/badge/deploy-Vercel-black?style=flat&logo=vercel" alt="Vercel"/></a>
</p>

This project currently has two playable forms:

- A data-driven Python terminal prototype.
- A single-file browser prototype in `index.html`.

The Python version is the systems testbed. The browser version proves the visual direction. The next production target is a Phaser 3 web build.

## Run

Python prototype:

```powershell
python crawler.py
```

Browser prototype:

Open `index.html` in a modern browser.

## Controls

- `W/A/S/D`: move Carl
- `X`: attack an adjacent enemy
- `U`: use a combat item
- `T`: talk
- `O`: open nearby object
- `I`: inventory
- `C`: craft
- `E`: equip the first available unequipped gear
- `P`: pick up an item on Carl's tile
- `B`: buy from a nearby shop
- `F`: set Donut to follow
- `H`: set Donut to hide
- `R`: set Donut to retreat
- `V`: save
- `L`: load
- `K`: restore checkpoint from the last save
- `Q`: quit

## Current Goal

Talk to Mordecai, inspect Carl's inventory, open the tutorial chest, craft the first crude explosive, pick up pants, equip them, buy from the tutorial shop, trigger a hazard, and defeat the training enemy.

All story text here is original placeholder game text for prototyping.

## Design Foundations

The research and design foundation docs now live in `docs/`:

- `docs/architecture.md`: current code architecture, data flow, validation, event loop, and testing shape.
- `docs/aaa_indie_solo_roadmap.md`: honest solo-dev roadmap from prototype to polished demo.
- `docs/aaa_indie_status.md`: current status and next Phaser milestone.
- `docs/engine_choice_phaser.md`: Phaser 3 engine decision and migration plan.
- `docs/game_feel_and_audio_spec.md`: movement, combat, UI juice, and audio priorities.
- `docs/visual_art_direction.md`: pixel art direction, palette, sprites, tiles, and UI art.
- `docs/content_depth_plan.md`: Tutorial Guild expansion, Floor 1 plan, enemies, saferooms, crafting, and timer.
- `docs/ux_polish_release_plan.md`: screens, contextual controls, accessibility, save UX, release checklist.
- `docs/solo_dev_12_week_backlog.md`: week-by-week solo development backlog.
- `docs/lore_bible.md`: canon tracking, source references, gameplay translation, and legal risk.
- `docs/design_pillars.md`: tone, player experience, and core adaptation pillars.
- `docs/system_design.md`: character progression, floor rules, companion behavior, viewer pressure, and announcements.
- `docs/playable_features.md`: floor authoring, encounters, hazards, loot, crafting, dialogue, banter, and quests.

Structured lore entries are also stored in `data/lore_bible.json` so future tools can validate content against canon status and legal risk.

## Tests

```powershell
python -m unittest discover -s tests
```

The current suite covers data validation, movement, collision, quests, announcements, item handling, equipment, pickups, shops, hazards, combat, events, turns, save/load, checkpoints, lore labels, and tutorial scenario flows.

## Project Plan

This prototype is currently scoped as a **fan/internal prototype**. It uses book-inspired themes and mechanics while avoiding exact copyrighted dialogue and protected branding.

For the first playable version, the focus is:
- opening survival and registration sequence
- Floor 1 tutorial guild segment
- Floor 2 escalation and training floor
- early hub transformation or first major transition

The long-term roadmap is:
- Phase 1: systems prototype in Python
- Phase 2: polished 2D release
- Phase 3: expanded content or 3D conversion

Planned platform and engine path:
- PC-first release
- Python terminal prototype for fast systems iteration and tests
- single-file browser prototype for immediate visual/playtest iteration
- recommended production engine: Phaser 3, web-first
- later desktop packaging: Electron or Tauri

## Current Roadmap

The next serious production sequence is:

1. Port the Python/browser logic into a Phaser 3 project.
2. Add movement/combat/UI juice before adding more content.
3. Replace placeholder visuals with 16x16 pixel art.
4. Build Floor 1 as the first complete floor.
5. Add title, pause, game-over, transition, victory, options, and accessibility screens.
6. Package/share a demo for playtesting.
