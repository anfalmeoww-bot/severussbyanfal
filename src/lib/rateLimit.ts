/**
 * In-memory sliding-window rate limiter. Good enough for a single-process
 * deployment; if you later run multiple server instances behind a load
 * balancer, swap this for a shared store (e.g. Redis) — the interface below
 * is intentionally tiny so that's a drop-in change.
 */

interface Bucket {
  hits: number[];
}

const buckets = new Map<string, Bucket>();

// Periodically forget old buckets so memory doesn't grow forever.
setInterval(() => {
  const cutoff = Date.now() - 60 * 60 * 1000;
  for (const [key, bucket] of buckets) {
    bucket.hits = bucket.hits.filter((t) => t > cutoff);
    if (bucket.hits.length === 0) buckets.delete(key);
  }
}, 5 * 60 * 1000).unref();

/**
 * Returns true (and records a hit) if the caller is still within the
 * allowed `limit` hits per `windowMs`. Returns false without recording a
 * new hit if the limit has already been reached.
 */
export function allowRequest(key: string, limit: number, windowMs: number): boolean {
  const nowTs = Date.now();
  const bucket = buckets.get(key) ?? { hits: [] };
  bucket.hits = bucket.hits.filter((t) => t > nowTs - windowMs);
  if (bucket.hits.length >= limit) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.hits.push(nowTs);
  buckets.set(key, bucket);
  return true;
}

export function msUntilNextAllowed(key: string, limit: number, windowMs: number): number {
  const bucket = buckets.get(key);
  if (!bucket || bucket.hits.length < limit) return 0;
  const oldest = Math.min(...bucket.hits);
  return Math.max(0, oldest + windowMs - Date.now());
}
