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
  updateProfile,
  changePassword,
  confirmEmailChange,
  cancelEmailChange,
  uploadAvatar,
  requestAccountDeletion,
  confirmAccountDeletion,
  githubStart,
  githubCallback,
  googleStart,
  googleCallback,
  forgotPassword,
  resetPassword,
} from "../controllers/auth.controller.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 2 * 1024 * 1024 },
});
const acceptAvatarUpload = (req, res, next) => {
  upload.single("avatar")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Profile photos must be 2 MB or smaller." });
    }
    console.error("Avatar upload parsing failed", error);
    return res.status(400).json({ error: "The photo upload could not be processed." });
  });
};

// Brute-force and email-bombing protection. Counters are per IP (and per
// email for login), reset when their window rolls over.
const signupLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 8 });
const loginLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10, keyBy: "email" });
const passwordLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });
const forgotLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 5 });
const accountDeletionRequestLimiter = createRateLimiter({ windowMs: 60 * 60 * 1000, max: 3 });
const accountDeletionConfirmLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, max: 10 });

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
router.patch(
  "/profile",
  attachUser,
  requireAuth,
  passwordLimiter,
  asyncHandler(updateProfile),
);
router.post("/confirm-email", attachUser, passwordLimiter, asyncHandler(confirmEmailChange));
router.delete("/pending-email", attachUser, requireAuth, asyncHandler(cancelEmailChange));
router.post(
  "/password",
  attachUser,
  requireAuth,
  passwordLimiter,
  asyncHandler(changePassword),
);
router.post(
  "/avatar",
  attachUser,
  requireAuth,
  acceptAvatarUpload,
  asyncHandler(uploadAvatar),
);
router.post(
  "/account/deletion-request",
  attachUser,
  requireAuth,
  accountDeletionRequestLimiter,
  asyncHandler(requestAccountDeletion),
);
router.post(
  "/account/deletion-confirm",
  attachUser,
  accountDeletionConfirmLimiter,
  asyncHandler(confirmAccountDeletion),
);
router.get("/github", githubStart);
router.get("/github/callback", asyncHandler(githubCallback));
router.get("/google", googleStart);
router.get("/google/callback", asyncHandler(googleCallback));
export default router;
