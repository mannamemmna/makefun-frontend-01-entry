// api.js — the one fetch layer. GET-only against https://make.fun/api with
// If-None-Match revalidation: the API binds ETags to the minute, so a 304 costs
// nothing and a same-minute revisit never re-downloads. Responses are cached in
// memory for the session and deduplicated while a request is in flight.

const BASE = 'https://make.fun/api';

// url -> { etag, data, at }
const cache = new Map();
// url -> in-flight promise (single request per URL, shared by callers)
const pending = new Map();

async function get(path, opts = {}) {
  const url = BASE + path;
  const hit = cache.get(url);
  const headers = { Accept: 'application/json' };
  if (hit?.etag) headers['If-None-Match'] = hit.etag;

  const inflight = pending.get(url);
  if (inflight && (!hit || opts.fresh !== true)) return inflight;

  const p = (async () => {
    let res;
    try {
      res = await fetch(url, { headers, mode: 'cors' });
    } catch {
      pending.delete(url);
      if (hit) return hit.data; // serve stale when the network is down
      throw new Error('network unreachable');
    }
    pending.delete(url);
    if (res.status === 304 && hit) {
      hit.at = Date.now();
      return hit.data;
    }
    if (!res.ok) {
      const body = await res.json().catch(() => null);
      const msg = body?.error?.[0]?.message || `HTTP ${res.status}`;
      const err = new Error(msg);
      err.status = res.status;
      throw err;
    }
    const data = await res.json();
    cache.set(url, { etag: res.headers.get('ETag'), data, at: Date.now() });
    return data;
  })();
  pending.set(url, p);
  return p;
}

// paged list with cursor: list('/competitions?status=open&limit=48')
async function list(path) {
  const d = await get(path);
  return { items: d.items ?? [], cursor: d.next_cursor ?? null };
}

export { get, list };
