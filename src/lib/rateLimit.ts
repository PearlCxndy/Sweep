/**
 * Per-IP cap, in memory. Ten searches a minute is generous for onboarding and
 * stops a scraped endpoint turning into an invoice.
 *
 * In-process means it resets on deploy and does not span instances. That is
 * the right trade for a single-instance case study; a real deployment would
 * put this in Redis or at the edge. It is a cost guard, not a security
 * boundary, and it should never be the only thing standing between a public
 * route and a paid API.
 */
const WINDOW_MS = 60_000;
const MAX_REQUESTS = 10;

const hits = new Map<string, number[]>();

export function rateLimit(key: string): { ok: boolean; retryAfter: number } {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);

  if (recent.length >= MAX_REQUESTS) {
    const oldest = recent[0];
    return { ok: false, retryAfter: Math.ceil((WINDOW_MS - (now - oldest)) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep the map from growing without bound on a long-running process.
  if (hits.size > 5000) {
    for (const [k, times] of hits) {
      if (times.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
    }
  }

  return { ok: true, retryAfter: 0 };
}

export function clientKey(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0]!.trim();
  return req.headers.get("x-real-ip") ?? "unknown";
}
