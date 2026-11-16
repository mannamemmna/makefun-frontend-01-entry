// leaderboard.js — a bounty's leaderboard at #/bounty/<slug>/leaderboard.
// Columns come from the API's own schema (rank, entry, handle and the
// competition's rank_key columns), paginated with ?limit/?cursor.

export default async function leaderboardPage(slug, ui) {
  const { view, crumbTrail, setTitle, get, $money, esc, errBox, setReady } = ui;
  view.innerHTML = `<a class="back" href="#/bounty/${esc(slug)}">← bounty</a><h1>Leaderboard</h1><div class="skeleton"></div><div class="skeleton"></div>`;
  setReady(false);

  let lb, page = 1, entries = [], cursor = null, cols = [];
  try {
    lb = await get(`/competitions/${encodeURIComponent(slug)}/leaderboard?limit=50`);
    entries = lb.entries ?? [];
    cursor = lb.next_cursor ?? null;
    cols = (lb.columns ?? []).filter((c) => !c.hidden);
  } catch (e) {
    view.innerHTML = `<a class="back" href="#/bounty/${esc(slug)}">← bounty</a><h1>Leaderboard</h1>${errBox(e)}`;
    setReady(true);
    return;
  }

  setTitle(lb.competition?.title ? lb.competition.title + ' leaderboard' : 'leaderboard');
  crumbTrail([{ label: 'board', href: '#/' }, { label: lb.competition?.title?.slice(0, 44) ?? slug, href: `#/bounty/${slug}` }, { label: 'leaderboard' }]);

  const cell = (e, col) => {
    const raw = e.display?.[col.key] ?? e.values?.[col.key];
    if (raw == null) return '—';
    if (col.key === 'cost') {
      const usd = Number(e.cost?.micro_usd ?? 0) / 1e6;
      return usd ? '$' + usd.toFixed(2) : '—';
    }
    if (/^\d{4,}$/.test(String(raw))) return Number(raw).toLocaleString('en-US');
    return esc(String(raw));
  };

  const row = (e) => `<tr class="${e.prize_rank && e.prize_rank <= 3 ? 'podium' : ''}${e.baseline || e.house ? ' hl' : ''}">
    <td class="num">${e.rank ?? '—'}</td>
    <td><a href="#/u/${esc(e.handle)}">${esc(e.handle)}</a><div class="muted">${esc(e.title ?? '')}</div></td>
    ${cols.map((c) => `<td class="num">${cell(e, c)}</td>`).join('')}
    <td class="num">${e.status ? esc(e.status) : ''}</td>
  </tr>`;

  const head = `<tr><th class="num">#</th><th>Entry</th>${cols.map((c) => `<th class="num">${esc(c.title)}</th>`).join('')}<th>Status</th></tr>`;

  const render = () => {
    view.innerHTML = `
      <a class="back" href="#/bounty/${esc(slug)}">← bounty</a>
      <h1>${esc(lb.competition?.title ?? slug)} — leaderboard</h1>
      <p class="sub">${lb.title ? esc(lb.title) : 'standings'}${lb.phase?.title ? ' · ' + esc(lb.phase.title) : ''} · ${entries.length}${cursor ? '+' : ''} entries · house/baseline rows shaded</p>
      ${entries.length ? `<div class="tablewrap"><table><thead>${head}</thead><tbody>${entries.map(row).join('')}</tbody></table></div>`
        : '<p class="note">No graded entries yet — check back once entries land.</p>'}
      ${cursor ? '<button class="more" id="more">Load more</button>' : ''}`;
    const btn = document.getElementById('more');
    if (btn) btn.onclick = async () => {
      btn.disabled = true; btn.innerHTML = '<span class="spin"></span>Loading…';
      try {
        const d = await get(`/competitions/${encodeURIComponent(slug)}/leaderboard?limit=50&cursor=${encodeURIComponent(cursor)}`);
        entries = entries.concat(d.entries ?? []); cursor = d.next_cursor ?? null;
        render();
      } catch (e) { btn.outerHTML = errBox(e); }
    };
    setReady(true);
  };
  render();
}
