# TextGame

A zero-dependency browser text-adventure engine with a complete playable demo: **Signal at Black Ridge**.

## What works

- deterministic command parser with aliases (`n`, `e`, `look`, `take`, `use`, `rest`, etc.)
- immutable game-state transitions that are easy to test
- autosave to browser `localStorage`
- one-step undo for state-changing actions
- keyboard-first terminal plus large phone-friendly quick commands
- health, stamina, inventory, discovered locations and a real win condition
- offline app shell through a service worker
- Node regression tests and GitHub Actions CI
- static-hosting ready with relative asset paths

## Deployment

The app can be hosted on any static host. GitHub Pages is not enabled on this repository yet; the connected GitHub integration can update code and Actions but does not have repository-administration permission to create the Pages site. Enable **Settings → Pages → Source: GitHub Actions** once, then a Pages deployment workflow can be added safely.

## Run locally

Any static server works. For example:

```bash
python -m http.server 8080
```

Then open `http://localhost:8080`.

## Test

```bash
npm test
```

The engine lives in `src/engine.mjs`; the DOM adapter lives in `src/app.mjs`. Keeping those separate lets game rules stay deterministic and testable.
