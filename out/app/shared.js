// Shared display helpers used by every view (pot, fees, countdowns, avatars).

import { date, esc, money, timeLeft, urgency, takingEntries } from './format.js';

export { date, esc, money, timeLeft, urgency, takingEntries };

/** The live reward: the prize pool plus every entry fee paid into it. */
export const pot = (b) => money(b.potUsd ?? b.rewardAmount);

/** The entry fee, when the bounty charges one. */
export const feeRow = (b) => `${money(b.entryFeeUsd)} fee`;

/** An avatar <img> with crossorigin set before src (make.fun images are same-origin policy). */
export function avatar(src, handle, cls = 'avatar') {
  if (!src) return `<span class="${cls} placeholder">${esc((handle ?? '?')[0].toUpperCase())}</span>`;
  return `<img class="${cls}" crossorigin="anonymous" alt="${esc(handle)}'s avatar" loading="lazy" src="${esc(src)}">`;
}
