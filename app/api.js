// make.fun's public API client: read-only GETs, open to any origin (CORS).
// Every answer is cached against its ETag: within the minute a repeat request
// sends If-None-Match and gets a 304 (no body, no JSON parse), so a view
// revisited within the minute costs one round trip and nothing else.
// Tags are keyed to the minute, so the cache lives per path, not per tag.

const API = 'https://make.fun/api';

/** path -> Promise of the response (in-flight de-duplication). */
const inflight = new Map();
/** path -> {data, tag} last known good answer. */
const cache = new Map();

async function get(path) {
  if (inflight.has(path)) return inflight.get(path);
  const cached = cache.get(path);
  const headers = cached ? { 'If-None-Match': cached.tag } : undefined;
  const p = (async () => {
    const res = await fetch(API + path, { headers });
    if (res.status === 304 && cached) return cached.data;
    if (!res.ok) throw new Error(`make.fun API ${res.status} ${res.statusText}`);
    const data = await res.json();
    const tag = res.headers.get('etag');
    if (tag) cache.set(path, { data, tag });
    return data;
  })().finally(() => inflight.delete(path));
  inflight.set(path, p);
  return p;
}

/** The open bounties: { items: [...] } (activity=times leaves out the activity a board does not show). */
export const getBounties = () => get('/competitions?status=open&activity=times');

/** One bounty, by its slug. */
export const getBounty = (slug) => get(`/competitions/${encodeURIComponent(slug)}`);

/** A bounty's leaderboard (the judge view by default). */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** An account's public profile, by handle. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);

/** Warm the cache for a path without rendering it. */
export const prefetch = (path) => get(path).catch(() => {});
