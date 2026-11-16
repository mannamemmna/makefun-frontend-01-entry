// bounty.js — one bounty's page: summary, description and rules, the rewards
// table with the live pot, entry fee, dates and status. Loaded by import() on
// first visit to any #/bounty/<slug> URL; cached in memory afterwards.

export default async function bountyPage(slug, ui) {
  const { view, crumbTrail, setTitle, get, $money, $timeleft, $open, esc, md, errBox, setReady } = ui;
  view.innerHTML = `<a class="back" href="#/">← board</a><h1>Loading bounty…</h1>
    <div class="skeleton"></div><div class="skeleton"></div><div class="skeleton"></div>`;
  setReady(false);
  let c;
  try {
    c = await get(`/competitions/${encodeURIComponent(slug)}`);
  } catch (e) {
    view.innerHTML = `<a class="back" href="#/">← board</a><h1>Bounty</h1>${errBox(e)}`;
    setReady(true);
    return;
  }

  const open = $open(c);
  setTitle(c.title);
  crumbTrail([{ label: 'board', href: '#/' }, { label: c.title.slice(0, 60) }]);

  const rewards = c.rewardsNow?.length
    ? c.rewardsNow.map((r) => ({ place: r.place, amount: r.amountUsd ?? r.baseUsd }))
    : Object.entries(c.rewards ?? {}).map(([p, a]) => ({ place: p, amount: a }));

  const phases = (c.phases ?? []).map((p) => `<tr><td>${esc(p.title)}</td>
      <td>${esc((p.startsAt || '').slice(0, 10))}</td>
      <td>${esc((p.endsAt || '').slice(0, 10))}</td>
      <td>${p.scoresVisible ? 'scores visible' : 'scores hidden'}</td></tr>`).join('');

  view.innerHTML = `
    <a class="back" href="#/">← board</a>
    <h1>${esc(c.title)}</h1>
    <p class="sub">${c.sponsor ? esc(c.sponsor.name) : ''}${c.category ? ' · ' + esc(c.category) : ''} · <span class="tag ${open ? 'open' : 'closed'}">${open ? 'taking entries' : 'not taking entries'}</span></p>
    <div class="stats">
      <div class="stat"><div class="k">Live pot</div><div class="v money">${$money(c.potUsd ?? c.rewardAmount)}</div></div>
      <div class="stat"><div class="k">Base reward</div><div class="v">${$money(c.rewardAmount)}</div></div>
      <div class="stat"><div class="k">Entry fee</div><div class="v fee">${c.entryFeeUsd != null ? $money(c.entryFeeUsd) : 'free'}</div></div>
      <div class="stat"><div class="k">Time left</div><div class="v tleft${open ? '' : ' past'}">${$timeleft(c.deadline)}</div></div>
      <div class="stat"><div class="k">Entries</div><div class="v">${c.submissionCount ?? (c.submissions?.length ?? 0)}</div></div>
      <div class="stat"><div class="k">Deadline</div><div class="v">${esc((c.deadline || '').slice(0, 16).replace('T', ' '))} UTC</div></div>
    </div>
    ${rewards.length ? `<h2>Rewards</h2><div class="rewards">${rewards.map((r) =>
      `<div class="reward"><div class="p">${r.place === 1 ? '1st place' : r.place === 2 ? '2nd place' : r.place === 3 ? '3rd place' : r.place + 'th place'}</div><div class="a">${$money(r.amount)}</div></div>`).join('')}</div>` : ''}
    ${c.summary ? `<h2>Summary</h2><div class="prose">${md(c.summary)}</div>` : ''}
    <h2>Description</h2>
    <div class="prose">${md(c.description || 'No description provided.')}</div>
    ${c.rules ? `<h2>Rules</h2><div class="prose">${md(c.rules)}</div>` : ''}
    ${phases ? `<h2>Phases</h2><div class="tablewrap"><table><thead><tr><th>Phase</th><th>Starts</th><th>Ends</th><th>Scores</th></tr></thead><tbody>${phases}</tbody></table></div>` : ''}
    <p class="sub">Enter on <a href="https://make.fun/bounty/${esc(c.slug)}" rel="noopener">make.fun</a> ·
      <a href="#/bounty/${esc(c.slug)}/leaderboard">leaderboard</a></p>`;
  setReady(true);
}
