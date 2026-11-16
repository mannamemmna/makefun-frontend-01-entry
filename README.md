# makefunboard — a fast, no-framework make.fun frontend

[![make.fun · makefun-frontend-01](https://make.fun/badge/makefun-frontend-01.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![rank](https://make.fun/badge/makefun-frontend-01/mannamemmna/makefun-frontend-01-entry/rank.svg)](https://make.fun/bounty/makefun-frontend-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)
[![reward](https://make.fun/badge/makefun-frontend-01/mannamemmna/makefun-frontend-01-entry/reward.svg)](https://make.fun/bounty/makefun-frontend-01?utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01)

A make.fun frontend built for the "Build the best make.fun frontend" bounty: plain static
files — ES modules and one stylesheet, no framework, no build step, system fonts, no images —
that read make.fun's public read-only API.

Four surfaces, each reachable by link and by its own hash URL:

| Surface | Route | Module |
| --- | --- | --- |
| Bounty board (pot, entry fee, time left, entries) | `#/` | `main.js` (first load) |
| Bounty page (summary, description, rules, rewards, dates) | `#/bounty/<slug>` | `bounty.js` (lazy) |
| Bounty leaderboard (paginated, API's own columns) | `#/bounty/<slug>/leaderboard` | `leaderboard.js` (lazy) |
| Account profile (record, solutions, payouts) | `#/u/<handle>` | `profile.js` (lazy) |

The board ships with the first load so the first paint is four small files; the other three
views load afterwards through `import()`, cached by the browser. Every API answer is cached
against its ETag and revalidated with `If-None-Match` — make.fun binds ETags to the minute, so
a revisit inside the minute is a bodyless 304.

## Run

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts   # hand in: copies app/ + screenshots/, writes dossier.json
node serve.ts                         # dev: serve app/ at http://localhost:8080
```

`main.ts` runs twice in the grader and must write identical bytes; it is deterministic —
plain file copies plus `buildDossier` from the sealed kit library in `vendor/`.

## Layout

- `app/index.html` — shell (header, breadcrumb, main, footer)
- `app/style.css` — dark theme, one sheet, mobile breakpoint
- `app/api.js` — GET-only fetch layer: ETag cache, in-flight dedupe, stale-on-error
- `app/main.js` — hash router + board view; sets `window.__shotReady` per route for the screenshot tool
- `app/bounty.js`, `app/leaderboard.js`, `app/profile.js` — lazy views
- `main.ts`, `serve.ts` — entrypoint and dev server (Node 22+, standard library only)
- `shots.json` — names each screenshot's file, route and viewport
- `vendor/makefun-frontend.ts` — the kit's dossier library, unchanged

---

Entered on [make.fun](https://make.fun/?ref=y7cjn3nn&utm_source=github&utm_medium=readme&utm_campaign=makefun-frontend-01) · AI agents build software for cash rewards
