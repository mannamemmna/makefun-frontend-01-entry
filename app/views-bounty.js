// A bounty's page and its leaderboard: loaded by import() when first routed,
// so the board's first load stays small.

import { date, esc, money, pot, feeRow, timeLeft, urgency, takingEntries } from './shared.js';

/** Markdown-ish description: paragraphs on blank lines, safe HTML. */
function prose(text) {
  return String(text ?? '')
    .split(/\n{2,}/)
    .map((p) => `<p>${esc(p).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

/** The rewards table with the live pot. */
function rewardsTable(b) {
  const rewards = b.rewardsNow ?? b.rewards ?? {};
  const total = Number(b.potUsd ?? b.rewardAmount ?? 0);
  const rows = Object.entries(rewards)
    .map(([place, amount]) => {
      const pct = total > 0 ? (100 * Number(amount)) / total : 0;
      return `<tr><td class="place">${esc(place)}</td><td>${money(amount)}</td><td>${pct ? `${pct.toFixed(1)}%` : ''}</td></tr>`;
    })
    .join('');
  return `<table class="rewards">
    <caption>Rewards — live pot <strong>${pot(b)}</strong>${b.entryFeeUsd ? ` (includes fees: ${money(b.entryFeesUsd ?? 0)})` : ''}</caption>
    <thead><tr><th scope="col">Place</th><th scope="col">Reward</th><th scope="col">Share</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`;
}

export function bounty(b) {
  const open = takingEntries(b);
  const u = urgency(b.deadline);
  return `
  <p class="crumb"><a href="#/">← All bounties</a></p>
  <header class="bounty-head">
    <h1>${esc(b.title)}</h1>
    <p class="stats">
      <span class="pot"><strong>${pot(b)}</strong> pot</span>
      ${b.entryFeeUsd ? `<span class="fee">${feeRow(b)}</span>` : '<span class="fee free">free entry</span>'}
      <span class="left ${u}" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>
      <a class="entries" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">${b.submissionCount} entries</a>
      <span class="status">${open ? 'open for entries' : 'closed — judging'}</span>
    </p>
    <p class="summary">${esc(b.summary ?? '')}</p>
    <p class="deadline">Deadline ${date(b.deadline)} · opened ${date(b.opensAt ?? b.publishedAt)}</p>
  </header>
  ${rewardsTable(b)}
  <nav class="tabs"><a href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">Leaderboard →</a></nav>
  <section><h2>Description &amp; rules</h2><div class="description">${prose(b.description)}</div></section>`;
}

/** One leaderboard row: rank, entrant, what it is, its score columns. */
function lbRow(e) {
  const cols = e.display ?? {};
  const cells = Object.entries(cols)
    .map(([k, v]) => `<td>${esc(v?.display ?? v ?? '')}</td>`)
    .join('');
  const hidden = e.source_withheld ? '' : `<a class="repo" href="${esc(e.repo_url ?? '')}">repo</a>`;
  return `<tr><td class="place">${e.rank ?? ''}</td>
    <td class="who"><a href="#/u/${encodeURIComponent(e.handle ?? '')}">${esc(e.handle ?? '')}</a></td>
    <td class="entry">${esc(e.title ?? '')} ${hidden}</td>${cells}
    <td class="cost">${e.cost ? money(e.cost) : ''}</td></tr>`;
}

export function leaderboard(lb, slug) {
  const cols = (lb.columns ?? []).map((c) => `<th scope="col">${esc(c.title)}</th>`).join('');
  const rows = (lb.entries ?? []).map(lbRow).join('');
  return `
  <p class="crumb"><a href="#/bounty/${encodeURIComponent(slug)}">← Bounty</a></p>
  <h1>Leaderboard <span class="count">${lb.entries?.length ?? 0}</span></h1>
  <p class="muted">${esc(lb.title ?? '')} · ranked by ${esc(lb.rank_key ?? '')}${lb.phase ? ` · ${esc(lb.phase.title ?? '')} phase` : ''}</p>
  <div class="tablewrap"><table class="lb">
    <thead><tr><th scope="col">#</th><th scope="col">Account</th><th scope="col">Entry</th>${cols}<th scope="col">Cost</th></tr></thead>
    <tbody>${rows || '<tr><td colspan="9">No entries yet.</td></tr>'}</tbody>
  </table></div>`;
}
