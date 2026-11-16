// profile.js — an account's public record at #/u/<handle>: identity, record,
// solutions (entries placed in competitions) and recent payouts.

export default async function profilePage(handle, ui) {
  const { view, crumbTrail, setTitle, get, $money, esc, errBox, setReady } = ui;
  view.innerHTML = `<a class="back" href="#/">← board</a><h1>Profile</h1><div class="skeleton"></div>`;
  setReady(false);

  let p;
  try {
    p = await get(`/profiles/${encodeURIComponent(handle)}`);
  } catch (e) {
    view.innerHTML = `<a class="back" href="#/">← board</a><h1>Profile</h1>${errBox(e)}`;
    setReady(true);
    return;
  }

  setTitle(p.display_name || handle);
  crumbTrail([{ label: 'board', href: '#/' }, { label: '@' + handle }]);

  const rec = p.record ?? {};
  const avatar = p.image || p.avatar;
  const solutions = (p.solutions ?? []).map((s) => `<tr>
      <td><a href="#/bounty/${esc(s.competition?.slug)}">${esc(s.competition?.title ?? '')}</a>
        ${s.competition?.status === 'open' ? '<span class="tag open">open</span>' : '<span class="tag closed">closed</span>'}</td>
      <td>${esc(s.title ?? '')}</td>
      <td class="num">${s.placement ? '#' + s.placement : '—'}</td>
      <td class="num">${s.score?.display ? esc(s.score.display) : '—'}</td>
      <td class="num">${s.prize_usd ? $money(s.prize_usd) : '—'}</td>
    </tr>`).join('');

  const payouts = (p.payouts ?? []).slice(0, 12).map((x) => `<tr>
      <td><a href="#/bounty/${esc(x.competition?.slug)}">${esc(x.competition?.title ?? '')}</a></td>
      <td class="num">${x.place ? '#' + x.place : '—'}</td>
      <td class="num">${$money(x.amount_usd)}</td>
      <td class="num">${esc((x.paid_at || '').slice(0, 10))}</td>
    </tr>`).join('');

  view.innerHTML = `
    <a class="back" href="#/">← board</a>
    <div class="phead">
      <div class="avatar">${avatar && String(avatar).startsWith('http') ? `<img src="${esc(avatar)}" alt="" crossorigin="anonymous" referrerpolicy="no-referrer">` : ''}</div>
      <div><h1>${esc(p.display_name || handle)}</h1>
        <p class="muted">@${esc(p.handle)}${p.house ? ' · house' : ''} · joined ${esc((p.joined_at || '').slice(0, 10))}</p></div>
    </div>
    ${p.bio ? `<p class="sub">${esc(p.bio)}</p>` : ''}
    <div class="stats">
      <div class="stat"><div class="k">Entered</div><div class="v">${rec.competitions_entered ?? 0}</div></div>
      <div class="stat"><div class="k">Placed</div><div class="v">${rec.competitions_placed ?? 0}</div></div>
      <div class="stat"><div class="k">Wins</div><div class="v">${rec.competitions_won ?? 0}</div></div>
      <div class="stat"><div class="k">Best place</div><div class="v">${rec.best_placement ? '#' + rec.best_placement : '—'}</div></div>
      <div class="stat"><div class="k">Prizes</div><div class="v money">${$money(rec.prize_usd ?? 0)}</div></div>
    </div>
    ${solutions ? `<h2>Solutions</h2><div class="tablewrap"><table><thead><tr><th>Competition</th><th>Entry</th><th class="num">Place</th><th class="num">Score</th><th class="num">Prize</th></tr></thead><tbody>${solutions}</tbody></table></div>`
      : '<p class="note">No public solutions yet.</p>'}
    ${payouts ? `<h2>Payouts</h2><div class="tablewrap"><table><thead><tr><th>Competition</th><th class="num">Place</th><th class="num">Amount</th><th class="num">Paid</th></tr></thead><tbody>${payouts}</tbody></table></div>` : ''}
    <p class="sub">Profile on <a href="https://make.fun/profile/${esc(p.handle ?? handle)}" rel="noopener">make.fun</a></p>`;
  setReady(true);
}
