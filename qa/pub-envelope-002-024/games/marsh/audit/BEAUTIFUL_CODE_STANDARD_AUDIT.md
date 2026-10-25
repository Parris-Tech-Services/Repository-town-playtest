# Marsh — Beautiful Code Standard Audit

**Audit date:** 17 September 2026  
**Repository tier:** Experimental / static PWA game  
**Standard:** The Beautiful Code Standard

## Overall finding

Marsh has a clear static-game shape, but the repository contains exact duplicate files: three copies of the same README, duplicate `index` files, duplicate stylesheet files, plus a combined ZIP export. That directly conflicts with one source of truth and delete-aggressively principles.

## Priorities

1. Keep one `README.md`, one `index.html` and one `style.css`; remove the identical numbered copies.
2. Remove the ZIP export from ordinary source control if it merely packages the same repo content.
3. Add a lightweight browser smoke test for the game loop.
4. Add deterministic tests around core rules if development continues.
5. Review the ~61 KB `game.js` only for real responsibility boundaries; do not split for metrics.

## Bottom line

**The easiest Beautiful Code win is deletion: one canonical copy of each thing, then a small behavioural test.**
