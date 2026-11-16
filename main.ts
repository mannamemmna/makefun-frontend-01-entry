// Entrypoint for the makefun-frontend-01 entry. Node 22, standard library only.
//
// The frontend itself is the static files under app/ (index.html, ES modules,
// one stylesheet) — served as-is, no build step, reading make.fun's public API.
// This program hands the entry to the grader: it copies app/ and screenshots/
// into the output directory and writes dossier.json, the summary the judge
// reads, using the kit's vendored library. Outside the grader container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
//
// The grader runs this twice and requires both runs to write identical bytes;
// the copy and buildDossier are deterministic, so nothing here depends on time,
// ordering or the environment.

import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const root = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Mirror app/ and screenshots/ into the output dir (the scorer's caps: at most
// 993 files / 16 MiB under app/, 3 screenshots at 256 KiB each).
mkdirSync(out, { recursive: true });
cpSync(join(root, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(join(root, 'screenshots'), join(out, 'screenshots'), { recursive: true });

// The dossier the judge reads: screenshots sheet + load totals + source outline.
// The scorer rebuilds it with its own copy of the vendored library and requires
// a byte-for-byte match, so vendor/makefun-frontend.ts is never modified.
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 3, max_bytes: 262144 },
    app_max_files: 993,
    app_max_bytes: 16777216,
  }),
);
