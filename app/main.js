// main.js — hash router + the board view. The board ships in the first load so
// the first paint needs only index.html + style.css + api.js + main.js; the
// bounty, leaderboard and profile views load later through cached import().
// window.__shotReady flips to true once the active route's data has rendered,
// so screenshot tooling can wait for real content.

import { get, list } from './api.js';

const view = document.getElementById('view');
const crumbs = document.getElementById('crumbs');

// --- shared formatting -------------------------------------------------------

const $money = (usd) => {
  const n = Number(usd ?? 0);
  return '$' + (Number.isInteger(n) ? n.toLocaleString('en-US') : n.toLocaleString('en-US', { maximumFractionDigits: 2 }));
};

const $timeleft = (deadline) => {
  const ms = Date.parse(deadline) - Date.now();
  if (Number.isNaN(Date.parse(deadline))) return '—';
  if (ms <= 0) return 'ended';
  const m = Math.floor(ms / 60000);
  const d = Math.floor(m / 1440), h = Math.floor((m % 1440) / 60), min = m % 60;
  return d ? `${d}d ${h}h left` : h ? `${h}h ${min}m left` : `${min}m left`;
};

const $open = (c) => !Number.isNaN(Date.parse(c.deadline)) && Date.parse(c.deadline) > Date.now();

const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));

// tiny markdown → html for bounty rules/description (headings, code, lists, bold)
const md = (text) => esc(text)
  .replace(/```([\s\S]*?)```/g, (_, c) => `<pre>${c.trim()}</pre>`)
  .replace(/`([^`\n]+)`/g, '<code>$1</code>')
  .replace(/^### (.*)$/gm, '<h3>$1</h3>')
  .replace(/^## (.*)$/gm, '<h2>$1</h2>')
  .replace(/^# (.*)$/gm, '<h2>$1</h2>')
  .replace(/\*\*([^*\n]+)\*\*/g, '<b>$1</b>')
  .replace(/^- (.*)$/gm, '<li>$1</li>')
  .replace(/(<li>[\s\S]*?<\/li>)(?!\s*<li>)/g, '<ul>$1</ul>')
  .replace(/\n\n+/g, '<br><br>');

function crumbTrail(parts) {
  crumbs.innerHTML = parts.map((p, i) =>
    p.href ? `<a href="${p.href}">${esc(p.label)}</a>` : `<span>${esc(p.label)}</span>`
  ).join('<span class="sep">/</span>');
}

function setTitle(t) { document.title = t + ' — makefun board'; }

// --- loading / error scaffolding ---------------------------------------------

function skeleton(n = 6) {
  view.innerHTML = `<h1>Live bounties</h1><p class="sub">Loading make.fun…</p>` +
    Array.from({ length: n }, () => '<div class="skeleton"></div>').join('');
}

const errBox = (e) =>
  `<div class="err">Something went wrong: ${esc(e.message || e)}. <a href="#/">Retry the board</a></div>`;

// --- board (first-load view) --------------------------------------------------

function cardHTML(c) {
  const open = $open(c);
  const fee = c.entryFeeUsd != null ? `<span class="fee">fee ${$money(c.entryFeeUsd)}</span>` : '';
  return `<a class="card" href="#/bounty/${esc(c.slug)}">
    <div class="t">${esc(c.title)}</div>
    <div class="row">
      <span class="pot">${$money(c.rewardAmount)}</span>
      <span>${(c.submissionCount ?? 0).toLocaleString('en-US')} entries</span>
      <span class="tleft${open ? '' : ' past'}">${$timeleft(c.deadline)}</span>
      ${fee}
      <span class="tag ${open ? 'open' : 'closed'}">${open ? 'open' : 'ended'}</span>
      ${c.category ? `<span class="cat tag">${esc(c.category)}</span>` : ''}
    </div>
  </a>`;
}

async function boardPage() {
  crumbTrail([{ label: 'board' }]);
  setTitle('live bounties');
  skeleton();
  window.__shotReady = false;
  try {
    let items = [], cursor = null, shown = 0;
    const page = await list('/competitions?status=open&limit=48');
    items = page.items; cursor = page.cursor;
    const render = (first) => {
      if (first && !items.length) {
        view.innerHTML = `<h1>Live bounties</h1><p class="note">No bounties are open right now. Check back soon — <a href="https://make.fun">make.fun</a> posts new ones daily.</p>`;
        window.__shotReady = true;
        return;
      }
      view.innerHTML = `<h1>Live bounties</h1>
        <p class="sub">${items.length} open${cursor ? '+' : ''} · sorted by deadline · reward, fee, time left and entries live from make.fun</p>
        <div class="cards">${items.map(cardHTML).join('')}</div>
        ${cursor ? '<button class="more" id="more">Load more</button>' : ''}`;
      const btn = document.getElementById('more');
      if (btn) btn.onclick = async () => {
        btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Loading…';
        try {
          const next = await list(`/competitions?status=open&limit=48&cursor=${encodeURIComponent(cursor)}`);
          items = items.concat(next.items); cursor = next.cursor;
          render(false);
        } catch (e) { btn.outerHTML = errBox(e); }
      };
      window.__shotReady = true;
    };
    render(true);
  } catch (e) {
    view.innerHTML = `<h1>Live bounties</h1>${errBox(e)}`;
    window.__shotReady = true;
  }
}

// --- router -------------------------------------------------------------------

const routes = [
  [/^$/, boardPage],
  [/^bounty\/([^/]+)\/leaderboard$/, async (m) => (await import('./leaderboard.js')).default(m[1], { view, crumbTrail, setTitle, get, $money, esc, errBox, setReady: (v) => { window.__shotReady = v; } })],
  [/^bounty\/([^/]+)$/, async (m) => (await import('./bounty.js')).default(m[1], { view, crumbTrail, setTitle, get, $money, $timeleft, $open, esc, md, errBox, setReady: (v) => { window.__shotReady = v; } })],
  [/^u\/([^/]+)$/, async (m) => (await import('./profile.js')).default(m[1], { view, crumbTrail, setTitle, get, $money, esc, errBox, setReady: (v) => { window.__shotReady = v; } })],
];

async function route() {
  const hash = location.hash.replace(/^#\/?/, '');
  decodeURIComponent(hash); // fail fast on malformed escapes
  window.__shotReady = false;
  for (const [re, handler] of routes) {
    const m = hash.match(re);
    if (m) {
      try { await handler(m); }
      catch (e) { view.innerHTML = errBox(e); window.__shotReady = true; }
      return;
    }
  }
  view.innerHTML = `<h1>Not found</h1><p class="note">No such page. <a href="#/">Back to the board</a></p>`;
  window.__shotReady = true;
}

window.addEventListener('hashchange', route);
route();
