# The Undercity agent instructions (7-agent collaboration)

**Read first:** [Seven-agent production plan](docs/SEVEN_AGENT_PRODUCTION.md), [README](README.md), [specification coverage](docs/SPEC_PROGRESS.md), and the [Narrative Studio production process](docs/narrative-studio/README.md).

1. Agents **2–7 work only on their assigned feature branch** (`agent/<number>-<feature>`) and send PRs. **Agent 1 owns final merges and Vercel production promotion.** No direct `main` pushes or silent deployments by feature agents.
2. **Agent 5 owns Undercity story content**; **Agent 6 owns game mechanics/economy**; **Agent 7 owns UI and user-experience changes**; **Agent 4 owns authoring tools and schema validation**. Agent 1 coordinates shared integration. Do not race edits to the same file.
3. `index.html` currently contains a large mixed UI/runtime implementation; **Agent 7 is the only direct UI editor** there. Agent 6 should expose engine hooks/modules and ask Agent 1 to integrate, not overwrite the same monolithic file.
4. `src/game/rules.js` is the canonical rules module. Rebuild/verify its generated `rules.global.js` rather than editing the generated bundle by hand. Preserve local-save export, migrations and gameplay.
5. Run `npm test`, the relevant content build/validator/tracker checks described in README and appropriate browser/manual playtests before asking for a merge.
6. Only original gothic narrative writing and game assets. The lore bible and 40-entry secret ledger govern spoiler depth and continuity; no copying premium reference-game stories.
7. Follow pitch → skeleton → prose → content/design/mechanical/continuity QA → **genuine human sign-off**. Editorial packets are not automatically playable.
8. Report branch, changed files, player-visible difference, exact tests, and save/deployment risks in every PR. Escalate blocking bugs and ownership conflicts immediately.

All role definitions and acceptance criteria: [Seven-agent production plan](docs/SEVEN_AGENT_PRODUCTION.md).
