# Contributing

## Documentation First

When adding or changing a feature, update the relevant docs:

- `docs/status.md` for shipped behavior.
- `docs/roadmap.md` or `suggestions.md` for future work.
- `docs/eylf-curriculum-feature-map.md` when curriculum mapping changes.
- `docs/content-bundle-schema.md` when optional content shape changes.

## Optional Word Lists

Adding `phonicWords` through `content/bundle.json` can speed up authoring, but cultural and Australian education context matters. Never bulk-generate culturally specific content unchecked.

Rows that reference Aboriginal or Torres Strait Islander stories, languages, landmarks, naming, children's images, or community practices require appropriate human review alongside families and educators familiar with context.

Validate before pull request or commit:

```bash
node scripts/validate-content.mjs content/bundle.json
```

## Child Experience Rules

- Keep child-facing copy short and gentle.
- Keep parent/educator curriculum language in parent assist areas.
- Avoid pressure, streak anxiety, or failure-heavy feedback.
- Test with touch-sized controls after UI changes.
