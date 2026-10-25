# Status — JoshPlatform

## What works now
- **Static showcase landing** (`showcase.html`): purpose statement + 3 demo app cards with status badges.
- **Vite client builds cleanly** (`npm run build:client` → `dist/`, verified).
- React routes present: dashboard, tasks, reviews, decisions, opportunities, social.
- Repo hygiene: Replit `.local/` state removed from tracking; `.gitignore` covers `.local/`, `.env`, `node_modules`, `dist`, caches, logs.

## Known gaps
- `npm run dev` / `npm run build` reference a missing Express server (`server/index.ts`) and Drizzle (`db:push`). Use `build:client` until the backend is restored or the app is made client-only.
- Package is still named `rest-express` (Replit starter).

## Next steps
- Decide: restore the Express/Drizzle backend, or convert to a client-only static app.
- Wire the showcase cards to the live React routes (or embed mini-apps directly).
- Rename the package to `joshplatform`.
