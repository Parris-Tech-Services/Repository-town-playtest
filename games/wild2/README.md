# DOVAHKIIN — The Last Dragonborn

A **Skyrim / Elder Scrolls–themed text adventure** that runs entirely in the browser. No build step, no dependencies — a single self-contained `index.html`.

You begin bound for the executioner's block at Helgen and rise to become the Last Dragonborn, choosing your path through the main saga to one of several endings.

## Game concept

- **Choose your race** (Nord, Dunmer, or Khajiit) — each grants different stat bonuses and changes story flavour.
- Branching journey through familiar beats: Helgen, your first Shout, Bleak Falls Barrow, High Hrothgar, the Companions, and the confrontation with Alduin.
- Stats — **HP**, **Stamina**, and **Shouts known** — shift with your choices.
- **Multiple endings**, including triumph, mercy, and a darker vampire path.

## Controls

- Click the on-screen **choice buttons** to advance.
- A typewriter effect prints each passage; choices appear when it finishes.
- At an ending, use **▶ Play Again** to restart.

## Saved progress

Endings you reach are saved in your browser via **localStorage** and shown as
`ENDINGS DISCOVERED: N / 3` beneath the game. Clearing site data resets this.

## How to run

Open `index.html` in any modern browser — double-click it, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Status

**Playable and complete.** Race selection, the branching main quest, and multiple
endings are implemented. Intentionally lightweight — a narrative game, not an engine.

## Possible future improvements

- Mid-quest save/resume (currently only endings are tracked).
- More side branches (Thieves Guild, Dark Brotherhood, civil war).
- Ambient audio toggle.
