// The bounty board: the first-load view, HTML-string based for a small, fast
// first paint. Every row links to the bounty page; its entries link ahead too.

import { esc, money, pot, feeRow, timeLeft, urgency, takingEntries } from './shared.js';

/** One row of the board. */
function row(b, i) {
  const open = takingEntries(b);
  const u = urgency(b.deadline);
  return `
  <li class="row${open ? '' : ' closed'}" data-slug="${esc(b.slug)}">
    <a class="title" href="#/bounty/${encodeURIComponent(b.slug)}">${i + 1}. ${esc(b.title)}</a>
    <p class="summary">${esc(b.summary ?? '')}</p>
    <p class="stats">
      <span class="pot"><strong>${pot(b)}</strong> pot</span>
      ${b.entryFeeUsd ? `<span class="fee">${feeRow(b)}</span>` : '<span class="fee free">free entry</span>'}
      <span class="left ${u}" data-deadline="${esc(b.deadline)}">${timeLeft(b.deadline)}</span>
      <a class="entries" href="#/bounty/${encodeURIComponent(b.slug)}/leaderboard">${b.submissionCount} entries</a>
      <span class="status">${open ? 'open' : 'judging'}</span>
    </p>
  </li>`;
}

export function board(data) {
  const items = data.items ?? [];
  if (!items.length) return '<p class="empty">No open bounties right now.</p>';
  return `
    <h1>Open bounties <span class="count">${items.length}</span></h1>
    <ul class="board">${items.map(row).join('')}</ul>`;
}
