import { Router } from "express";
import { env } from "../config/env.js";
import { BanCheckError, checkNumber, cleanNumber } from "../tools/banCheck.js";

const router = Router();

/* ------------------------------ utilities ------------------------------ */

/** Sliding-window rate limiter, in memory. */
function createRateLimiter({ max, windowMs }) {
  const hits = new Map();
  setInterval(() => {
    const cutoff = Date.now() - windowMs;
    for (const [key, list] of hits) {
      const fresh = list.filter((t) => t > cutoff);
      if (fresh.length) hits.set(key, fresh);
      else hits.delete(key);
    }
  }, windowMs).unref();

  return {
    take(key) {
      const now = Date.now();
      const list = (hits.get(key) || []).filter((t) => t > now - windowMs);
      if (list.length >= max) {
        hits.set(key, list);
        return { ok: false, retryAfter: Math.max(1, Math.ceil((list[0] + windowMs - now) / 1000)) };
      }
      list.push(now);
      hits.set(key, list);
      return { ok: true };
    },
  };
}

/**
 * The visitor's IP. Behind `proxyHops` trusted proxies, the client is the
 * entry that many places from the right of X-Forwarded-For (anything to
 * its left can be forged by the visitor).
 */
function clientIp(req) {
  const hops = env.banCheck.proxyHops;
  if (hops > 0) {
    const parts = String(req.headers["x-forwarded-for"] || "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean);
    const ip = parts[parts.length - hops];
    if (ip) return ip;
  }
  return req.socket.remoteAddress || "unknown";
}

/* ------------------------------ ban checker ------------------------------ */

const limiter = createRateLimiter({ max: env.banCheck.rateLimitPerMin, windowMs: 60_000 });
const cache = new Map(); // digits -> { at, result }

router.post("/ban-check", async (req, res) => {
  const limit = limiter.take(clientIp(req));
  if (!limit.ok) {
    res.set("Retry-After", String(limit.retryAfter));
    return res
      .status(429)
      .json({ error: "Too many checks. Please wait a moment and try again." });
  }

  let digits;
  try {
    digits = cleanNumber(req.body?.number);
  } catch (err) {
    return res.status(400).json({ error: err.message, code: err.code });
  }

  const hit = cache.get(digits);
  if (hit && Date.now() - hit.at < env.banCheck.cacheMs) {
    return res.json({ ...hit.result, cached: true });
  }

  try {
    const result = await checkNumber(digits);
    cache.set(digits, { at: Date.now(), result });
    if (cache.size > 500) cache.delete(cache.keys().next().value);
    return res.json(result);
  } catch (err) {
    if (err instanceof BanCheckError) {
      const status =
        err.code === "INVALID_NUMBER" ? 400 :
        err.code === "RATE_LIMITED" ? 429 :
        err.code === "TIMEOUT" ? 504 :
        err.code === "NO_API_KEY" ? 503 : 502;
      // Never leak configuration details to the browser.
      const message =
        err.code === "NO_API_KEY" ? "The checker is not available right now." : err.message;
      if (err.code === "NO_API_KEY") console.error("[tools] BANCHECK_API_KEY is not set.");
      return res.status(status).json({ error: message, code: err.code, requestId: err.requestId });
    }
    console.error("[tools] ban-check failed:", err);
    return res.status(500).json({ error: "The check could not be completed." });
  }
});

export default router;
