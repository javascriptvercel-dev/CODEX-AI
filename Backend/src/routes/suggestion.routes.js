import { Router } from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { createSuggestion } from "../controllers/suggestion.controller.js";
const router = Router();
router.post("/", asyncHandler(createSuggestion));
export default router;
