# 🧩 JoshPlatform — Mini App Platform / Experiment Runtime

**Live app:** https://joshuaparris-max.github.io/JoshPlatform/

The GitHub page you are reading is only the repository README. The live site above has the actual **🎧 Podcasts** control and Spotify player.

A lightweight platform for **launching and documenting mini-apps**: one shell for small
prototypes, reusable UI patterns, and personal tools — instead of a new repo per idea. Each
"app" is a self-contained module carrying a **status badge** so it's clear what's finished, a
prototype, or just an idea.

## Two front doors

- **Live GitHub Pages app** — `index.html`, with the visible podcast player and browser-saved Prototype Notes.
- **React + Vite app** (`client/`) — the richer interactive runtime with platform routes
  (dashboard, tasks, reviews, decisions, opportunities, social). Its Pages workflow is now manual-only so it cannot race the public branch-based deployment.

## Demo apps

| App | Status | What it is |
|---|---|---|
| Reflection Tool | prototype | Short guided reflection → next step |
| Mini Task Board | prototype | The few tasks that matter today |
| Prototype Notes | live | Browser-saved scratch notes for experiments |

## Run

```bash
npm install
npm run build:client     # builds the richer Vite client to dist/
python -m http.server 8000   # serves the static public front door locally
```

> The `dev`/`build` scripts reference an Express server (`server/index.ts`) that isn't in the
> repo yet, so use `build:client` for the richer front end. See STATUS.md.

## Hygiene

Replit local state (`.local/`) and build artifacts are removed from tracking and ignored via
`.gitignore` (`.local/`, `.env`, `node_modules`, `dist`, caches, logs).

## Status

See [STATUS.md](STATUS.md).
