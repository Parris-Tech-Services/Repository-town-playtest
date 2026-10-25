# ★ StarHaven ★

A **Star Wars–themed text RPG** that runs entirely in the browser. No build step, no dependencies — a single self-contained `index.html`.

You play a Rebel operative arriving at StarHaven Station and must choose one of three branching missions, each with multiple paths, consequences, and endings.

## Game concept

- **Three missions**, each a full branching story:
  - **Rescue** — break a captured Jedi Master out of a detention block.
  - **Infiltration** — steal stolen fleet coordinates from an Imperial courier.
  - **Negotiation** — bargain with (or strong-arm) Slugga the Hutt.
- Choices affect **Health**, **Credits**, and a **Light/Dark alignment** stat.
- **8 distinct endings** across the three branches.

## Controls

- Click the on-screen **choice buttons** to advance the story.
- A typewriter effect prints each passage; choices appear when it finishes.
- Reach an ending, then use **[ Play Again ]** to start over.

## Saved progress

Endings you discover are saved in your browser via **localStorage** and shown as
`ENDINGS DISCOVERED: N / 8` beneath the game. Clearing site data resets this.

## How to run

Just open `index.html` in any modern browser — double-click it, or serve the folder:

```bash
# optional local server
python -m http.server 8000
# then visit http://localhost:8000
```

## Status

**Playable and complete.** All three mission branches and 8 endings are implemented.
Lightweight by design — this is a self-contained narrative game, not an engine.

## Possible future improvements

- Mid-mission save/resume (currently only endings are tracked).
- Sound effects / ambient audio toggle.
- Additional missions or a station hub between runs.
