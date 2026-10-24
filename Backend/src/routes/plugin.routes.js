import { Router } from "express";
import multer from "multer";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import {
  listPlugins,
  getPluginById,
  getPluginRaw,
  submitPlugin,
  mySubmissions,
} from "../controllers/plugin.controller.js";
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});
const acceptPluginUpload = (req, res, next) => {
  upload.single("file")(req, res, (error) => {
    if (!error) return next();
    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({ error: "Files must be 5 MB or smaller." });
    }
    console.error("Plugin upload parsing failed", error);
    return res.status(400).json({ error: "The file upload could not be processed." });
  });
};
const router = Router();
router.get("/", asyncHandler(listPlugins));
router.post(
  "/submissions",
  attachUser,
  requireAuth,
  acceptPluginUpload,
  asyncHandler(submitPlugin),
);
router.get(
  "/submissions/mine",
  attachUser,
  requireAuth,
  asyncHandler(mySubmissions),
);
router.get("/:id", asyncHandler(getPluginById));
router.get("/:id/raw", asyncHandler(getPluginRaw));
export default router;
