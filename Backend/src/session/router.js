import { Router } from "express";
import { env } from "../config/env.js";
import SupabaseFilesClient from "./lib/supabaseFilesClient.js";
import BucketService from "./lib/bucketService.js";
import SessionStore from "./lib/sessionStore.js";
import createBucketRoutes from "./routes/bucketRoutes.js";
import createSessionRoutes from "./routes/sessionRoutes.js";
import createWhatsappRoutes from "./routes/whatsappRoutes.js";
const router = Router();
const filesClient = new SupabaseFilesClient();
const bucketService = new BucketService({ filesClient });
const sessionStore = new SessionStore({
  bucketService,
  indexFilePath: env.session.indexFilePath,
  bucketId: env.session.supabaseBucket,
});
router.use(
  "/buckets",
  createBucketRoutes({ bucketService, sessionStore, config: env.session }),
);
router.use("/session", createSessionRoutes({ sessionStore }));
router.use("/whatsapp", createWhatsappRoutes({ sessionStore }));
router.use((err, _req, res, _next) => {
  const statusCode = err?.response?.status || 400;
  const message =
    err?.response?.data?.message || err.message || "Unknown error";
  res
    .status(statusCode)
    .json({ error: message, details: err?.response?.data || null });
});
export default router;
