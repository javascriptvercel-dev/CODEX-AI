import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser, requireAuth } from "../middleware/auth.js";
import { requireAdmin } from "../middleware/requireAdmin.js";
import {
  listSubmissions,
  approveSubmission,
  updateAndApproveSubmission,
  rejectSubmission,
  listSuggestions,
} from "../controllers/admin.controller.js";
const router = Router();
router.use(attachUser, requireAuth, requireAdmin);
router.get("/submissions", asyncHandler(listSubmissions));
router.post("/submissions/:id/approve", asyncHandler(approveSubmission));
router.patch("/submissions/:id", asyncHandler(updateAndApproveSubmission));
router.post("/submissions/:id/reject", asyncHandler(rejectSubmission));
router.get("/suggestions", asyncHandler(listSuggestions));
export default router;
