import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";
import {
  createShortLink,
  deleteShortLink,
  generateBotBase,
  listShortLinks,
  redirectShortLink,
} from "../controllers/tools.controller.js";
import { BanCheckError, checkNumber, cleanNumber } from "../tools/banCheck.js";
import { enforceToolRateLimit } from "../tools/rateLimit.js";

const router = Router();
const cache = new Map();

router.post(
  "/bot-base-generator",
  attachUser,
  requireAuth,
  asyncHandler(generateBotBase),
);

router.get("/short-links", attachUser, requireAuth, asyncHandler(listShortLinks));
router.post(
  "/short-links",
  attachUser,
  requireAuth,
  asyncHandler(createShortLink),
);
router.delete(
  "/short-links/:id",
  attachUser,
  requireAuth,
  asyncHandler(deleteShortLink),
);
router.get("/s/:code", asyncHandler(redirectShortLink));

router.post(
  "/ban-check",
  attachUser,
  requireAuth,
  asyncHandler(async (req, res) => {
    if (
      !(await enforceToolRateLimit(req, res, {
        tool: "wa-ban-checker",
        userLimit: env.banCheck.rateLimitPerMin,
        windowSeconds: 60,
      }))
    ) {
      return;
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
          err.code === "INVALID_NUMBER"
            ? 400
            : err.code === "RATE_LIMITED"
              ? 429
              : err.code === "TIMEOUT"
                ? 504
                : err.code === "NO_API_KEY"
                  ? 503
                  : 502;
        const message =
          err.code === "NO_API_KEY"
            ? "The checker is not available right now."
            : err.message;
        if (err.code === "NO_API_KEY") {
          console.error("[tools] BANCHECK_API_KEY is not set.");
        }
        return res
          .status(status)
          .json({ error: message, code: err.code, requestId: err.requestId });
      }
      console.error("[tools] ban-check failed:", err);
      return res.status(500).json({ error: "The check could not be completed." });
    }
  }),
);

export default router;
