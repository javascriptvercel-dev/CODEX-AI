import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import {
  listPlugins,
  getPluginById,
  submitPlugin,
  mySubmissions,
} from "../controllers/plugin.controller.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const router = Router();
router.get("/", asyncHandler(listPlugins));
router.post(
  "/submissions",
  attachUser,
  requireAuth,
  upload.single("file"),
  asyncHandler(submitPlugin),
);
router.get(
  "/submissions/mine",
  attachUser,
  requireAuth,
  asyncHandler(mySubmissions),
);
router.get("/:id", asyncHandler(getPluginById));
export default router;
