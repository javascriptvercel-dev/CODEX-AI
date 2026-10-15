import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import { authenticateAccountIntegration } from "../middleware/accountIntegration.js";
import { env } from "../config/env.js";
import {
  createAdminAccount,
  createIntegrationAccount,
  createIntegrationToken,
  getDashboard,
  getToolSettings,
  listIntegrationTokens,
  revokeIntegrationToken,
  saveToolSettings,
} from "../controllers/dashboard.controller.js";

const router = Router();
router.get("/dashboard", attachUser, requireAuth, asyncHandler(getDashboard));
router.get("/dashboard/tool-settings", attachUser, requireAuth, asyncHandler(getToolSettings));
router.put("/dashboard/tool-settings", attachUser, requireAuth, asyncHandler(saveToolSettings));
router.post(
  "/dashboard/admin/accounts",
  attachUser,
  requireAuth,
  (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
    next();
  },
  asyncHandler(createAdminAccount),
);
router.get(
  "/dashboard/admin/integrations",
  attachUser,
  requireAuth,
  requirePremiumFeature,
  (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
    next();
  },
  asyncHandler(listIntegrationTokens),
);
router.post(
  "/dashboard/admin/integrations",
  attachUser,
  requireAuth,
  requirePremiumFeature,
  (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
    next();
  },
  asyncHandler(createIntegrationToken),
);
router.delete(
  "/dashboard/admin/integrations/:id",
  attachUser,
  requireAuth,
  requirePremiumFeature,
  (req, res, next) => {
    if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
    next();
  },
  asyncHandler(revokeIntegrationToken),
);
router.post(
  "/integration/accounts",
  asyncHandler(authenticateAccountIntegration),
  asyncHandler(createIntegrationAccount),
);

function requirePremiumFeature(_req, res, next) {
  if (!env.premiumFeaturesEnabled) {
    return res.status(503).json({ error: "Premium features aren't available yet." });
  }
  next();
}

export default router;
