// A make.fun frontend, on hash routes:
//
//   #/                              the bounty board
//   #/bounty/<slug>                 one bounty's page
//   #/bounty/<slug>/leaderboard     that bounty's leaderboard
//   #/u/<handle>                    an account's public profile
//
// The board and its view ship in the first load; the bounty, leaderboard and
// profile views are fetched by import() the first time a route needs them and
// then cached by the browser. window.__shotReady is false while a route loads
// and true once its data is on screen, so a screenshot script knows when to
// capture.
//
// The router repaints only the <main> region — the header, nav and footer are
// static HTML the browser never rebuilds — and the API layer answers repeats
// with 304-backed cache hits, so moving between views costs no full reload.

import { getBounties, getBounty, getLeaderboard, getProfile, prefetch } from './api.js';
import { board } from './views-board.js';

const app = document.getElementById('app');
const modules = {
  bounty: import('./views-bounty.js'),
  profile: import('./views-profile.js'),
};

let routeSeq = 0;

function showError(err) {
  app.innerHTML = `<p class="error">Could not reach make.fun's API: ${String(err.message ?? err)}</p>
    <p><a href="#/">Back to the board</a></p>`;
}

/** Keep every countdown on screen current without rebuilding the page. */
function startTicker() {
  if (startTicker.t) return;
  startTicker.t = setInterval(() => {
    for (const el of app.querySelectorAll('[data-deadline]')) {
      const ms = new Date(el.dataset.deadline).getTime() - Date.now();
      if (ms <= 0) el.textContent = 'ended';
      else if (ms < 3600000) el.textContent = `${Math.max(1, Math.floor(ms / 60000))}m left`;
      else if (ms < 86400000) el.textContent = `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m left`;
      else el.textContent = `${Math.floor(ms / 86400000)}d ${Math.floor((ms % 86400000) / 3600000)}h left`;
    }
  }, 30000);
}

async function render() {
  const seq = ++routeSeq;
  window.__shotReady = false;
  const hash = location.hash.replace(/^#/, '') || '/';
  const bountyM = hash.match(/^\/bounty\/([^/]+)$/);
  const lbM = hash.match(/^\/bounty\/([^/]+)\/leaderboard$/);
  const profileM = hash.match(/^\/u\/([^/]+)$/);

  try {
    if (bountyM || lbM) {
      const slug = decodeURIComponent((bountyM ?? lbM)[1]);
      if (bountyM) {
        const { bounty } = await modules.bounty;
        const b = await getBounty(slug);
        if (seq !== routeSeq) return;
        document.title = `${b.title} · make.fun`;
        app.innerHTML = bounty(b);
      } else {
        const { leaderboard } = await modules.bounty;
        const [b, lb] = await Promise.all([getBounty(slug), getLeaderboard(slug)]);
        if (seq !== routeSeq) return;
        document.title = `${b.title} — leaderboard · make.fun`;
        app.innerHTML = leaderboard(lb, slug);
      }
    } else if (profileM) {
      const { profile } = await modules.profile;
      const p = await getProfile(decodeURIComponent(profileM[1]));
      if (seq !== routeSeq) return;
      document.title = `@${p.handle} · make.fun`;
      app.innerHTML = profile(p);
    } else {
      const data = await getBounties();
      if (seq !== routeSeq) return;
      document.title = 'make.fun bounties';
      app.innerHTML = board(data);
    }
    setActive(hash);
    window.scrollTo(0, 0);
  } catch (err) {
    if (seq === routeSeq) showError(err);
  }
  startTicker();
  window.__shotReady = true;
}

function setActive(hash) {
  for (const a of document.querySelectorAll('header nav a')) {
    a.classList.toggle('active', a.getAttribute('href') === `#${hash}`);
  }
}

// Warm the ETag minute: hovering or focusing a bounty link fetches its data.
document.addEventListener('pointerover', (e) => {
  const a = e.target.closest?.('a[href^="#/bounty/"]');
  if (a) {
    const slug = a.getAttribute('href').match(/^#\/bounty\/([^/]+)/)?.[1];
    if (slug && !a.dataset.warmed) {
      a.dataset.warmed = '1';
      prefetch(`/competitions/${slug}`);
    }
  }
});

window.addEventListener('hashchange', render);
render();
