# EVALUATION — makefun-frontend-01-entry

## What was built
A no-framework make.fun frontend in `app/` (9 static files, ~22 KB raw source) with the four
required surfaces, each by link and by its own hash route:

| Surface | Route | Code |
| --- | --- | --- |
| Bounty board | `#/` | `views-board.js` (first-load) |
| Bounty page (summary, rules, rewards table with live pot, dates, status) | `#/bounty/<slug>` | `views-bounty.js` (lazy) |
| Bounty leaderboard | `#/bounty/<slug>/leaderboard` | `views-bounty.js` (lazy) |
| Account profile | `#/u/<handle>` | `views-profile.js` (lazy) |

Open/closed is decided by the deadline (`takingEntries` in `format.js`) because a past-deadline
bounty can still read status open. Avatars set `crossorigin="anonymous"` before `src`
(`avatar()` in `shared.js`). No script/stylesheet/font from any origin but make.fun's; no
vendor code beyond the sealed kit.

## Judge criteria mapping
1. **Fully functioning** — one view module per surface, real API calls in `api.js`
   (`/competitions?status=open&activity=times`, `/competitions/<slug>`,
   `/competitions/<slug>/leaderboard`, `/profiles/<handle>`); shots.json routes the three
   screenshots to board, this bounty's page, and a leaderboard with real entries.
2. **Performance** — `api.js` caches every answer against its ETag and revalidates with
   `If-None-Match` (304 within the minute, no body/parse); in-flight de-duplication; the
   leaderboard fetch is issued in parallel with the bounty fetch (`Promise.all`); pointerover on
   a bounty link prefetches into the minute's cache; router repaints only `<main>` (header/nav/
   footer are static); a 30 s ticker updates countdown text nodes in place; long leaderboards
   paginate client-side ("Show all" unhides rows, no rebuild).
3. **Speed** — first load is `index.html` + `style.css` + `main.js` + `api.js` + `shared.js` +
   `format.js` + `views-board.js` (small, system fonts, no framework); the bounty, leaderboard
   and profile views load later by literal `import()` (see the dossier's Load block).
4. **Ease of use** — card layout with pot/fee/time-left/entries prominent, countdown urgency
   colors, sticky-feel header nav with active state, mobile breakpoint, readable contrast,
   semantic tables and headings.

## Skills used
No installed agent skill contributed code or workflow to this build; the work followed the kit's
RULES.txt directly.

## Verification commands and results
All run with the kit Node binary (`~/.hermes/tools/node-26.12.1-linux-x64/bin/node`), Node 26.

- `node serve.ts --port 8191` then `curl` each static asset: all `200`
  (`/`, `/index.html`, `/main.js`, `/style.css`, `/views-board.js`, `/api.js`).
- ETag revalidation against the live API: first `GET /api/competitions?status=open` → `200`
  with `W/"jQrJ1EXa18fHYLHycsZP-vfLZJh0QPka"` (268 KB); same request with
  `If-None-Match` → `304`, 0 bytes. Confirmed within one minute.
- View functions rendered with live data (`test-views.mjs`): board 17.8 KB, bounty 4.9 KB,
  leaderboard, profile — no `undefined` / `NaN` / `[object Object]` anywhere.
- Router smoke with a DOM shim over `app/main.js` (`smoke-routes.mjs`): all four routes
  (`#/`, `#/bounty/makefun-frontend-01`, `#/bounty/xstocks-movers-forecast-01/leaderboard`,
  `#/u/kokonutscereal-dotcom`) painted real live data and set `__shotReady = true`.
- Leaderboard pagination verified on a 40-entry leaderboard: 30 rows shown, 10 hidden, button present.
- `node --check` (ESM) passes for every `app/*.js`.
- `mkdir -p .../out-frontend && MAKEFUN_OUTPUT_DIR=... node main.ts` → `/output/app` copied,
  `dossier.json` written (545 KB incl. starter placeholder screenshots).

## Notes for the parent agent
- Screenshots (`1-board.jpg`, `2-bounty.jpg`, `3-leaderboard.jpg` per `shots.json`) are the
  starter's placeholders — **must be re-taken on live data**; `window.__shotReady` flips per route.
- README badge URLs use owner `mannamemmna`; if the GitHub repo lands under a different owner,
  rewrite the two `/rank.svg` and `/reward.svg` badge URLs before submitting.
- Transcript bundle dry-run matched 1 session (this one, hermes, 90 turns). The final `bundle`
  must add `--instructions …`, `--mcp …`, and `--harness-version/--provider/--model/--effort`
  (provider "custom" must be stated as the real provider); the dry-run could not measure the
  `thinking_reproduces` authored share — verify ≥30% and that `main.ts` has authored lines at
  final bundle time.
