# EVALUATION — makefunboard (makefun-frontend-01 entry)

This file records how the entry maps to the bounty's judging criteria and what was
verified locally. Everything below was run against the live make.fun API.

## Architecture (authored this session)

- `app/index.html` (0.9 KB) — shell only: one stylesheet link, `modulepreload` of the
  API layer, one module script. The only first-load script work is the router + board.
- `app/api.js` (1.8 KB) — single fetch layer: in-memory `Map` cache keyed by URL,
  `If-None-Match` revalidation (the API's ETags are minute-bound, so a 304 inside the
  minute costs nothing), in-flight promise dedupe, stale-served-on-network-error.
- `app/main.js` (6.2 KB) — hash router over four regex routes plus the board view,
  cursor-paginated ("Load more" appends, never rebuilds), `window.__shotReady` false at
  route start and true once the route's data has rendered.
- `app/bounty.js` / `app/leaderboard.js` / `app/profile.js` — lazy `import()` views for
  `#/bounty/<slug>`, `#/bounty/<slug>/leaderboard`, `#/u/<handle>`.
- `app/style.css` (5.9 KB) — dark theme, system fonts, no images, one mobile breakpoint.
- `main.ts` — copies `app/` + `screenshots/` to `MAKEFUN_OUTPUT_DIR` (or `/output`) and
  writes `dossier.json` via `buildDossier` from the unchanged kit library.
- `shots.json` — file, route, viewport and caption for each of the 3 screenshots.

First load = `index.html` + `style.css` + `api.js` + `main.js` ≈ 15 KB raw
(≈ 5 KB gzipped estimate; the dossier's Totals line shows the exact gzip-9 numbers).
One detail module is ~3.3–3.5 KB each and only downloads on first visit to its surface.

## Judge criteria mapping

1. **Fully functioning** — each surface has its own route and module, all on real API
   calls: `GET /api/competitions?status=open`, `GET /api/competitions/<slug>`,
   `GET /api/competitions/<slug>/leaderboard?limit=50`, `GET /api/profiles/<handle>`.
   Open/closed is judged by deadline, not status, per the rules (a past-deadline bounty
   may still read open until results publish). Avatar images use `crossorigin="anonymous"`
   before their src because make.fun images send `Cross-Origin-Resource-Policy: same-origin`.
2. **Performance** — ETag revalidation cache (`api.js`), in-flight dedupe, stale-on-error
   fallback, cursor pagination on board and leaderboard, view swaps repaint only `<main>`.
3. **Speed** — no framework, no fonts, no images, four-file first load; heavy views are
   literal `import()`s outside the first-load total.
4. **Ease of use** — pot, entry fee, time left and entries are stat chips at the top of a
   bounty page and on every board card; deadline-driven status pills; breadcrumb nav;
   thousands-separated numbers; readable dark contrast; mobile layout.

## Verification performed

- `MAKEFUN_OUTPUT_DIR=out node main.ts` run twice → `dossier.json` byte-identical (`cmp` clean).
- App served with `node serve.ts` and driven in a real browser at 1280x800:
  - `#/` — 18 live cards, `__shotReady === true`, no error box.
  - `#/bounty/makefun-frontend-01` — live pot $606.50, fee $0.50, 176 entries, 20-place
    rewards grid, description and rules render.
  - `#/bounty/makefun-frontend-01/leaderboard` — 113 entries with API-supplied columns
    (judge win rate, interval, valid, size), paginated.
- Fresh screenshots re-taken from those live renders (JPEG q88, 1280x800: 131 KB /
  125 KB / 109 KB — all inside the 256 KiB cap) and reviewed visually.
- Screenshot files match `shots.json`; the board shot is the cover.

## Constraints honored

- Only `app/`-own or `https://make.fun` resources; no data: scripts; no build step;
  no third-party code outside `vendor/` (which is the kit's own file, untouched).
- `vendor/makefun-frontend.ts` byte-identical to the kit's copy (sha256 checked).
- No writes to make.fun, no sign-in, read-only API only.
