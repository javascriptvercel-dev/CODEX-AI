import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { attachUser } from "../middleware/auth.js";
import { createSuggestion } from "../controllers/suggestion.controller.js";
const router = Router();
router.post("/", attachUser, asyncHandler(createSuggestion));
export default router;
