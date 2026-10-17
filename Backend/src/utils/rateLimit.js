// Fixed-window in-memory rate limiter for the auth endpoints.
// Keyed per process; fine for a single backend instance (Render/Pterodactyl).
const buckets = new Map();
const MAX_BUCKETS = 20_000;

export function createRateLimiter({ windowMs, max, keyBy = "ip" }) {
  return function rateLimit(req, res, next) {
    const now = Date.now();
    const parts = [req.ip || "unknown"];
    if (keyBy === "email" && typeof req.body?.email === "string") {
      parts.push(req.body.email.trim().toLowerCase().slice(0, 254));
    }
    const key = `${parts.join("|")}:${Math.floor(now / windowMs)}`;

    if (buckets.size > MAX_BUCKETS) {
      for (const [bucketKey, bucket] of buckets) {
        if (bucket.resetAt <= now) buckets.delete(bucketKey);
      }
      if (buckets.size > MAX_BUCKETS) buckets.clear();
    }

    const bucket = buckets.get(key) || { count: 0, resetAt: now + windowMs };
    bucket.count += 1;
    buckets.set(key, bucket);

    if (bucket.count > max) {
      res.set("Retry-After", String(Math.max(1, Math.ceil((bucket.resetAt - now) / 1000))));
      return res.status(429).json({
        error: "Too many attempts. Please wait a few minutes and try again.",
      });
    }
    next();
  };
}
