// Basic in-memory limiter: 5 submissions per IP per 10 minutes.
// Note: serverless instances don't share memory, so this is best-effort. For stricter limits, use Upstash/Vercel KV.
const hits = new Map<string, number[]>();
const WINDOW = 10 * 60 * 1000;
const MAX = 5;

export function rateLimited(ip: string): boolean {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW);
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW)) hits.delete(k);
  return recent.length > MAX;
}
