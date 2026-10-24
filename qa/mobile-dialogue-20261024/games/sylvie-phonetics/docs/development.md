# Sylvie Phonics Adventure Development

## Stack

- Static HTML/CSS/JavaScript.
- No package manager required for the app itself.
- Optional Node script for content validation.
- Browser `localStorage`.
- Browser Speech Synthesis API.

## Commands

Serve locally:

```bash
python -m http.server 8000
```

Validate an optional content bundle:

```bash
node scripts/validate-content.mjs content/bundle.json
```

Run the static release smoke check:

```bash
node scripts/smoke-check.mjs
```

## Main Files

- `index.html`: complete app bundle.
- `docs/eylf-curriculum-feature-map.md`: curriculum mapping.
- `docs/eylf-implementation-tasks.md`: completed EYLF implementation checklist.
- `suggestions.md`: future feature backlog.
- `content/bundle.example.json`: example optional content.
- `scripts/validate-content.mjs`: optional content validator.
- `vercel.json`: static deployment configuration.

## Release Checklist

- Open the app locally and run Today's Path.
- Smoke test at least one literacy, movement, numeracy, and review mode.
- Toggle child/parent mode.
- Toggle touch/keyboard mode.
- Confirm local progress still loads.
- If content changed, run the validator.
- Update status, roadmap, or EYLF docs when feature behavior changes.
