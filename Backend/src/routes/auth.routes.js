import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import { createRateLimiter } from "../utils/rateLimit.js";
import {
  signup,
  login,
  logout,
  me,
  updateNotifications,
  uploadAvatar,
  deleteAccount,
  githubStart,
  githubCallback,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});

// Brute-force and email-bombing protection. Counters are per IP (and per
// email for login), reset when their window rolls over.
const signupLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8 });
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyBy: "email" });
const forgotLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });

const router = Router();
router.post("/signup", signupLimiter, asyncHandler(signup));
router.post("/login", loginLimiter, asyncHandler(login));
router.post("/logout", asyncHandler(logout));
router.post("/forgot-password", forgotLimiter, asyncHandler(forgotPassword));
router.post("/reset-password", asyncHandler(resetPassword));
router.get("/me", attachUser, asyncHandler(me));
router.patch(
  "/notifications",
  attachUser,
  requireAuth,
  asyncHandler(updateNotifications),
);
router.post(
  "/avatar",
  attachUser,
  requireAuth,
  upload.single("avatar"),
  asyncHandler(uploadAvatar),
);
router.delete("/account", attachUser, requireAuth, asyncHandler(deleteAccount));
router.get("/github", githubStart);
router.get("/github/callback", asyncHandler(githubCallback));
export default router;
