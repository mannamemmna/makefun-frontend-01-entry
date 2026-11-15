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

## Parent verification + blocker (2026-11-15)

- Screenshots taken by parent from local serve at 1280x800 via CDP (jpeg q85): 1-board.jpg 156 KB, 2-bounty.jpg 79 KB, 3-leaderboard.jpg 70 KB — all verified visually rendering live data.
- main.ts hardened (d864005): copies only shots.json-named screenshots, fails fast on a missing shot.
- Full check passes 13/13 locally at d864005 with bundle sha 4404736c... (repo pushed, About set, owner.json + SPDX MIT + README template done).
- BLOCKER: makefun-frontend-01 is strict-transcripts: it takes NO transcript upload - the gate runs on sealed makefun record recordings, which only stream [CC] / Codex sessions. Neither claude nor codex CLI is installed, and both require credentials not available without the user. Quota unspent; no submission made.
- NEXT ACTION (needs user): install/auth [CC] or Codex CLI, then run a genuine witnessed improvement pass with record --competition makefun-frontend-01 --source ~/makefun/makefun-frontend-01-entry -- claude -p "<task>" ..., then submit --competition makefun-frontend-01 --repo-url https://github.com/mannamemmna/makefun-frontend-01-entry --commit <sha> --keypair ../makefun-keypair.json. Deadline 2026-11-17T12:30:00Z, quota 3/day.
