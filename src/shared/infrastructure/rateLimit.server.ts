/**
 * Fixed-window limit per key (e.g. client IP), in memory: one Node instance
 * (multi-instance hosting needs a shared store). Beyond `maxKeys` tracked
 * keys every new key is refused, so a flood cannot grow memory.
 */
export function fixedWindowLimiter({ windowMs, max, maxKeys = 100_000 }: { windowMs: number; max: number; maxKeys?: number }) {
  const hits = new Map<string, { start: number; count: number }>();
  let lastSweep: number | null = null;

  return function isLimited(key: string, now = Date.now()): boolean {
    if (lastSweep === null) lastSweep = now;
    if (now - lastSweep >= windowMs) {
      hits.forEach((b, k) => {
        if (b.start <= now - windowMs) hits.delete(k);
      });
      lastSweep = now;
    }
    const bucket = hits.get(key);
    if (!bucket || bucket.start <= now - windowMs) {
      if (hits.size >= maxKeys) return true;
      hits.set(key, { start: now, count: 1 });
      return false;
    }
    bucket.count += 1;
    return bucket.count > max;
  };
}

/**
 * The visitor's IP as the trusted edge reports it. With `CLIENT_IP_HEADER` set
 * (e.g. `cf-connecting-ip` behind Cloudflare) only that header counts: Cloudflare
 * keeps a client's own X-Forwarded-For and appends the real address, so the first
 * value there could be anything. Without it: first X-Forwarded-For value, then X-Real-IP.
 */
export const clientIp = (headers: Headers, trusted = process.env.CLIENT_IP_HEADER?.trim().toLowerCase()) =>
  (trusted
    ? headers.get(trusted)?.trim()
    : headers.get("x-forwarded-for")?.split(",")[0]?.trim() || headers.get("x-real-ip")?.trim()) || "unknown";
