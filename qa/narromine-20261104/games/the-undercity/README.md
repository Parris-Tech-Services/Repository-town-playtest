# The Undercity

**A playable, original, gothic narrative RPG for your browser.**

In a city beneath a sealed stone sky, memories can be traded, lamps burn on peculiar fuel and official records erase people who are still alive. You start in the Bell-Cage, choose your past and faction, escape by one of four approaches, and decide who should learn the truth about the sky.

## Play now

**Current updated playtest: https://undercity-playtest.parris-neathaustralia.workers.dev/**

The original https://the-undercity.vercel.app deployment is currently behind GitHub because Vercel reached its daily Free-plan deployment limit. The Cloudflare alternative has passed an external HTTP smoke check on game HTML, rules JS, and new late-ambition content. The two sites use different browser-local save storage; export a JSON save before switching.

The current tested game is published from this repository on Cloudflare Workers as a pinned GitHub-source snapshot. Vercel remains a secondary, older deployment. No sign-in or payment is required. Saves are **local to the browser and device** you use, not synchronised across phones and computers. Export a JSON save from **Settings** before clearing browser data or switching devices.

## Narrative production pipeline

**[Open the QBN Studio CMS](tools/cms/index.html)**\n\n**[Groq AI writing assistant — setup and safety](tools/cms/GROQ_AI.md)**: 14 creative and editorial workflows, private server-side Groq gateway, proposal review, and AI-ready handoff exports for both games. Groq generation requires two private Cloudflare Worker secret bindings; no credentials are stored in this repository. to draft branching stories and export review packets.

**[Narrative Studio](docs/narrative-studio/README.md)** defines our pitch → midflight skeleton → prose → four QA reviews → human approval process. Its 40-topic spoilers ledger tracks reveal depth and deliberately conflicting witness accounts. Use `npm run studio:validate` before releasing new storylets; editorial drafts are not loaded by the running game.

## What is playable

- Story-driven onboarding: four backgrounds, five factions, four ability-based escape routes leading to distinct districts.
- A connected city map with clear roads and unlock requirements. Collect **2 leads** for the Forgotten Stairs and **4 leads** for the Listening Edge.
- A four-stage city investigation about the Council's sealed sky, with different world outcomes.
- **Four original personal ambitions**, now with **32 consecutive storylets apiece**. The Moth King's later chapters are authored in versioned JSON; River, Mirror and Ember each have 24 new later chapters in a separate narrative module, with ending choices and persistent consequences.
- **Four seven-stage Making Your Name reputations**, one for each ability, with distinct progress and end rewards.
- The four abilities **Observation, Guile, Persuasion and Resolve**, using the level-70 CP pyramid, parameterised Broad and fixed Narrow checks, rare-success rolls, and 1–2 CP awards.
- **34 professions** (10 Tier 1, eight Tier 2, eight Tier 3, eight Tier 4). Senior careers require in-world promotion storylets, relevant reputation and previous office; each has its own pay, shift stories and professional equipment.
- **20 destinies** (9 ordinary, 11 greater), with eligibility gates and permanent selection.
- **9 character quirks**, **3 three-stage exceptional stories**, and **6 rotating seasonal events**.
- **352 storylets and 854 authored choice branches**, plus 18 opportunity cards, including multiple stat-gated and origin-dependent decisions. See the [full content tracker](docs/CONTENT_TRACKER.md).
- **20 equipment slots**, at least one purchasable item for each, additive skill bonuses, and a buy/sell Bazaar with 20 goods. Selling equipped gear removes its active bonus.
- Four **Living Stories** using a persistent, author-defined event queue with quality triggers, hour delays, related story IDs, and visible countdowns in Messages.
- Ten-minute action regeneration with a starting cap of 10 and an unlockable cap of 20; four-minute opportunity-card regeneration with six-card hand limit. **Settings → Playtest mode** removes waiting/paid card-draw costs for testing.
- Four pyramidal Menaces (**Suspicion, Notoriety, Wounds, Delirium**) with zero-action arrival scenes, three recovery methods per hub, and a permanent arrest Record capped at seven. Fourteen quality categories are registered in the narrative schema. Card draw rules include urgent-card bypass, unlock-condition weighting and full-hand pause.

The UI includes semantic navigation landmarks, a keyboard skip link, adjustable persistent text size, and a colorblind/high-contrast option. Actual automated Chromium smoke and axe WCAG A/AA checks passed at 390px and 1280px. Manual TalkBack, VoiceOver, NVDA and real-device testing remain outstanding.

## How to playtest

1. Begin at the Bell-Cage, choose an origin and faction, and take one of the four escape routes.
2. Use **City map** for explicit connections. Lantern Court links to the main starting districts.
3. At Lantern Court, speak to the clockmaker to begin the city-wide investigation, and choose a **personal ambition** using *A question no clerk can answer*.
4. Open **Paths & callings** to see the next stage and district for your ambition, all four reputations, career options, quirks, exceptional stories and destiny requirements.
5. Visit **Possessions** to equip owned gear, and **Messages** for delayed Living Stories.
6. Test success and failure, a full opportunity hand and a menace-triggered recovery detour. Use **Settings → Playtest mode** if you want to inspect content without waiting.
7. Export your save JSON before restarting or switching browsers.

## Narrative authoring and checks

- The **JSON-authored** late Moth chapters live in `content/storylets/ambitions/moth.json`. The River, Mirror and Ember late-main arcs are authored in `content/storylets/ambitions/late-main.v1.json` and compiled to `content/late-ambitions.js` by `scripts/build-late-main.mjs`. Another 66 optional investigations use versioned JSON in `content/storylets/ambitions/second-acts.v1.json`, compiled by `scripts/build-second-acts.mjs`. The coalition conclusion in each arc requires earlier independent evidence and protected witnesses.
- `node scripts/build-content.mjs`, `node scripts/build-second-acts.mjs` and `node scripts/build-late-main.mjs` compile the canonical JSON content. Use `--check` to catch out-of-date browser bundles.
- `node scripts/validate-content.mjs` validates story references, locations, challenge qualities, item effects and chain gates.
- `node scripts/content-tracker.mjs` updates `docs/CONTENT_TRACKER.md` with every story, choice, card, location and profession; use `--check` to detect drift.
- GitHub Actions runs the checks and game tests on each push. Vercel's project build command is configured to run all three validation steps as well.

## Repository and checks

The game is dependency-free plain HTML/CSS/JavaScript. The canonical QBN engine lives in `src/game/rules.js` (ES module); `rules.global.js` is its byte-verified classic-script build loaded by the browser. Existing v1 local saves are migrated into the richer qualities schema without resetting progress. Narrative data is in `content/`. Tests in `tests/` run through GitHub Actions on each push. Run locally with `node --test tests/*.test.mjs` (Node 22+) and serve the repository with `python -m http.server 8000` if you want to test it on a local server.

## Specification scope and remaining work

The supplied 64-page research PDF is much larger than a single release. **All four ambitions now meet the 30–40 chapter count target**, but further authored branching, character-specific dialogue and NPC consequences are still needed for the full depth requested. Early-stage stories and some other content still use JavaScript predicates, and there is no web-based CMS, cross-player social system, cloud account/save service, or fully developed crafting economy. The story and mechanics remain independently authored.

See [Specification coverage and roadmap](docs/SPEC_PROGRESS.md) for explicit implemented/partial/not-yet-built status and the next planned systems. The setting, characters and prose are independently authored rather than copied from other games.


## Narrative CMS · QBN Studio

The same no-code editorial workflow is available in the [Undercity Studio](https://the-undercity.vercel.app/tools/cms/), adapted to Observation, Guile, Persuasion and Resolve, the city's own locations and local save-compatible runtime. Create branches, challenge gates and outcomes, export drafts, and use stage-specific AI briefs without an exposed API key.

Read the [studio workflow](tools/cms/WORKFLOW.md), [world bible](tools/cms/bible.md), [proposed secrets ledger](tools/cms/secrets.md) and [style guide](tools/cms/style.md). Human-approved individual JSON enters `content/storylets/cms/<story-id>.json`; run `npm run cms:build && npm run cms:check && npm test`, then refresh the content tracker. Drafts stay in the author's browser until exported. Current collaboration is file/PR-based rather than simultaneous editing.
