// make.fun's public API client: read-only GETs, open to any origin (CORS).
// Every answer is cached against its ETag and revalidated with If-None-Match:
// within the minute the server answers 304 (no body, no JSON parse), past the
// minute it answers 200 with a new tag even when nothing changed — so a route
// revisited soon costs one cheap round trip, and one in flight is shared by
// every caller of the same path (the Promise in `inflight`).

const API = 'https://make.fun/api';

/** path -> Promise of the parsed answer (in-flight de-duplication). */
const inflight = new Map();
/** path -> {data, tag} last known good answer for that path. */
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

/** A bounty's leaderboard (the judge's view by default). */
export const getLeaderboard = (slug) => get(`/competitions/${encodeURIComponent(slug)}/leaderboard`);

/** An account's public profile, by handle. */
export const getProfile = (handle) => get(`/profiles/${encodeURIComponent(handle)}`);

/** Warm the cache for a path without rendering it (a pointerover prefetch). */
export const prefetch = (path) => get(path).catch(() => {});
