# Sylvie Phonics Adventure

Sylvie Phonics Adventure is a calm, offline-first phonics and early literacy practice app for home co-play and educator-informed practice. It is a static single-page app that can run from `index.html` without a build step.

Repository: https://github.com/joshualparris/SylviePhonetics.git

## Current State

The app is a feature-rich static phonics suite with touch and keyboard modes, parent assist mode, child play mode, speech synthesis, local progress, accessibility controls, EYLF-informed curriculum mapping, optional content bundles, and session recap tools.

See:

- [Status](docs/status.md)
- [Roadmap](docs/roadmap.md)
- [Content and Safety](docs/content-and-safety.md)
- [Development](docs/development.md)
- [EYLF Curriculum Feature Map](docs/eylf-curriculum-feature-map.md)
- [EYLF Implementation Tasks](docs/eylf-implementation-tasks.md)
- [Optional Content Bundle Schema](docs/content-bundle-schema.md)

## Feature Summary

- 28 game modes plus Today's Path.
- Touch mode and keyboard mode.
- Sylvie play mode and Parent assist mode.
- Gentle/growing/brave garden levels.
- Literacy age selector.
- Uppercase/lowercase display settings.
- Speech speed controls and robot voice blending support.
- Large touch, focus, high contrast, and dark mode controls.
- Micro-break settings.
- Early-years region/programme label picker.
- Local-only session recap with copy and print.
- Optional `content/bundle.json` loading.

## Run Locally

Open `index.html` directly in a browser, or serve the folder locally:

```bash
python -m http.server 8000
```

Then open:

```text
http://localhost:8000
```

## Deploy

This is a static app. GitHub Pages, Vercel, Netlify, or any static host can serve the project root.

Vercel settings:

- Framework preset: Other or Static.
- Build command: leave blank.
- Output directory: leave blank or root.

## Safety Model

- Progress is stored locally in the browser.
- Child data is not uploaded to a server.
- Speech uses the device/browser speech synthesis.
- Curriculum references are EYLF-informed and NSW transition-aware, not official certification.
- Culturally specific content requires appropriate human review before publication.
