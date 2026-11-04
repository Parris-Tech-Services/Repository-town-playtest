# Optional Content Bundle (`content/bundle.json`)

The app optionally fetches `./content/bundle.json` after initial load. If the file is missing, unavailable from `file://`, or invalid, bundled words are used unchanged.

## Root Shape

| Field | Type | Required |
|-------|------|----------|
| `phonicWords` | array | yes |

Other keys are ignored today but may be used later.

## `phonicWords[]` Entries

Each object must include:

- `word` (string): lowercase target word, such as `"sun"`.
- `letters` (string array): graphemes mapped to pronunciation for simple CVC work, such as `["s", "u", "n"]`.

Recommended fields:

- `emoji` (string): display glyph.
- `promptWord` (string): optional speech/display variant.
- `difficulty` (number): 1-18; filters by literacy age picker.

Example:

```json
{
  "phonicWords": [
    {
      "word": "sun",
      "emoji": "sun",
      "letters": ["s", "u", "n"],
      "promptWord": "sun",
      "difficulty": 1
    }
  ]
}
```

## Validation

Validate before publishing:

```bash
node scripts/validate-content.mjs content/bundle.json
```

## Cultural Safety

Treat every added row like curriculum content. Use culturally appropriate human review, not bulk LLM-fill. Respect Aboriginal and Torres Strait Islander perspectives and seek community guidance before publishing themed assets or language.
