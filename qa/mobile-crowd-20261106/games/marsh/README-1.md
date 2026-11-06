# Grey March: Lanterns of Sanctum

A static-browser prototype that combines three layers into one campaign:

- hex overland travel
- ASCII town exploration
- tactical encounter combat

## What is in this build

This is a fresh combined game, not a direct raw merge of the three original codebases.
It keeps the key shape of the idea:

- **Zoom 1:** overworld hex travel in the Grey March
- **Zoom 2:** town exploration via ASCII maps
- **Zoom 3:** tactical encounters with a 4-person party
- shared NPC memory, lore, faction reputation, quests, inventory, party wounds, and time

## Controls

### World
- Click a neighbouring hex to move
- Enter settlements from the side panel
- Explore marked sites from the side panel

### Town
- Use the North / South / East / West buttons
- Arrow keys also work on desktop
- Talk to nearby NPCs or enter nearby buildings from the actions panel

### Combat
- Use the action buttons for the active hero
- Click highlighted board cells to move or target
- End turn when done

## Core content in this prototype

- 4 settlements: Hearthwick, Sanctum, Gloam Ferry, Brindlewatch
- 4 wilderness sites
- 5 questlines with shared lore and repeated NPC references
- 3 factions
- persistent party health and conversation memory
- local save/load

## Files

- `index.html`
- `style.css`
- `content.js`
- `game.js`
- `manifest.webmanifest`
- `sw.js`
- `LICENSE`

## Run locally

Open `index.html` in a browser.

For service worker testing, serve the folder from a simple local server, for example:

```bash
python -m http.server 8080
```

Then open:

```text
http://localhost:8080/
```

## Publish to GitHub Pages

```powershell
cd "C:\path\to\grey-march-combined"
git init
git branch -M main
git add .
git commit -m "Initial combined game"
git remote add origin https://github.com/<your-user>/<your-repo>.git
git push -u origin main
```

Then set GitHub Pages to deploy from the `main` branch root.
