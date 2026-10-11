import { Router } from "express";
import { env } from "../config/env.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import {
  createFaqDraft,
  listPublishedFaqs,
} from "../controllers/assistantFaq.controller.js";

const router = Router();
const submissions = new Map();
const WINDOW_MS = 60_000;
const MAX_SUBMISSIONS = 10;

router.get("/", asyncHandler(listPublishedFaqs));

router.post("/suggestions", (req, res, next) => {
  const forwarded = String(req.headers["x-forwarded-for"] || "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const clientIp =
    (env.banCheck.proxyHops > 0 &&
      forwarded[forwarded.length - env.banCheck.proxyHops]) ||
    req.socket.remoteAddress ||
    "unknown";
  const now = Date.now();
  const recent = (submissions.get(clientIp) || []).filter(
    (timestamp) => now - timestamp < WINDOW_MS,
  );
  if (recent.length >= MAX_SUBMISSIONS) {
    return res.status(429).json({ error: "Please wait before sending more questions." });
  }
  recent.push(now);
  submissions.set(clientIp, recent);
  if (submissions.size > 1000) {
    for (const [key, timestamps] of submissions) {
      if (!timestamps.some((timestamp) => now - timestamp < WINDOW_MS)) {
        submissions.delete(key);
      }
    }
  }
  return next();
}, asyncHandler(createFaqDraft));

export default router;
