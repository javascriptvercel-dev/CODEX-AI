import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { env } from "./config/env.js";
import authRoutes from "./routes/auth.routes.js";
import pluginRoutes from "./routes/plugin.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import suggestionRoutes from "./routes/suggestion.routes.js";
import sessionRouter from "./session/router.js";
const app = express();
app.use(cors({ origin: env.frontendUrl, credentials: true }));
app.use(express.json());
app.use(cookieParser());
app.get("/api/health", (_req, res) => res.json({ ok: true }));
app.use("/api/auth", authRoutes);
app.use("/api/plugins", pluginRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/suggestions", suggestionRoutes);
app.use("/api", sessionRouter);
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong." });
});
app.listen(env.port, () => {
  console.log(`CODEX AI backend listening on :${env.port}`);
});
