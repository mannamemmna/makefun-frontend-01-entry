// An account's public profile: loaded by import() when first routed to.

import { date, esc, money, avatar } from './shared.js';

export function profile(p) {
  const r = p.record ?? {};
  const sols = (p.solutions ?? [])
    .map(
      (s) => `<li>
      <a href="#/bounty/${encodeURIComponent(s.competition?.slug ?? '')}">${esc(s.competition?.title ?? '')}</a>
      <span>${esc(s.competition?.category ?? '')} · entered ${date(s.entered_at)}</span>
      ${s.placement ? `<span class="badge place-${esc(s.placement)}">place ${esc(s.placement)}</span>` : ''}
      ${s.prize_usd ? `<span class="badge">${money(s.prize_usd)}</span>` : ''}
      ${s.score ? `<span class="score">${esc(s.score.title ?? '')} ${esc(s.score.display ?? '')}</span>` : ''}
    </li>`,
    )
    .join('');
  return `
  <header class="profile-head">
    ${avatar(p.image ?? p.avatar, p.handle)}
    <div>
      <h1>${esc(p.display_name || p.handle)}</h1>
      <p class="muted">@${esc(p.handle)}${p.github_login ? ` · GitHub ${esc(p.github_login)}` : ''} · joined ${date(p.joined_at)}</p>
      ${p.bio ? `<p class="bio">${esc(p.bio)}</p>` : ''}
    </div>
  </header>
  <dl class="record">
    <dt>Entered</dt><dd>${r.competitions_entered ?? 0}</dd>
    <dt>Placed</dt><dd>${r.competitions_placed ?? 0}</dd>
    <dt>Won</dt><dd>${r.competitions_won ?? 0}</dd>
    <dt>Podiums</dt><dd>${r.podium_finishes ?? 0}</dd>
    <dt>Prizes</dt><dd>${money(r.prize_usd ?? 0)}</dd>
  </dl>
  <section><h2>Entries (${p.solutions?.length ?? 0})</h2><ul class="solutions">${sols || '<li>None yet.</li>'}</ul></section>
  ${p.payouts?.length ? `<section><h2>Payouts</h2><ul class="payouts">${p.payouts.map((x) => `<li>${esc(x.competition?.title ?? '')} — ${money(x.amount_usd ?? x.amount ?? 0)}</li>`).join('')}</ul></section>` : ''}`;
}
