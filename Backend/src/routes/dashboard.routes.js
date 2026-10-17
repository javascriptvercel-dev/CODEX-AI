import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import {
  createAdminAccount,
  getDashboard,
  getToolSettings,
  saveToolSettings,
} from "../controllers/dashboard.controller.js";

const router = Router();

const requireAdmin = (req, res, next) => {
  if (req.user.role !== "admin") return res.status(403).json({ error: "Administrator access is required." });
  next();
};

router.get("/dashboard", attachUser, requireAuth, asyncHandler(getDashboard));
router.get("/dashboard/tool-settings", attachUser, requireAuth, asyncHandler(getToolSettings));
router.put("/dashboard/tool-settings", attachUser, requireAuth, asyncHandler(saveToolSettings));
router.post(
  "/dashboard/admin/accounts",
  attachUser,
  requireAuth,
  requireAdmin,
  asyncHandler(createAdminAccount),
);

export default router;
