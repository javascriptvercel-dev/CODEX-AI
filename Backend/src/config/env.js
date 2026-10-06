import "dotenv/config";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const required = (key, fallback = undefined) => process.env[key] ?? fallback;
function parseBool(value, fallback = false) {
  if (value === undefined || value === null || value === "") return fallback;
  const normalized = String(value).trim().toLowerCase();
  return ["1", "true", "yes", "on"].includes(normalized);
}
export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv: process.env.NODE_ENV || "development",
  frontendUrl: required("FRONTEND_URL", "http://localhost:3000"),
  publicFrontendUrl: (process.env.PUBLIC_FRONTEND_URL || process.env.FRONTEND_URL || "https://codex-ai-v3.vercel.app").replace(/\/+$/, ""),
  // The backend's own public URL — used to build links (like the plugin
  // raw-code endpoint) that must point at this API, not the frontend.
  // API_URL lets you set it explicitly; RENDER_EXTERNAL_URL is Render's own
  // auto-injected variable, so this works with zero config when deployed
  // there.
  apiUrl: (process.env.API_URL || process.env.RENDER_EXTERNAL_URL || `http://localhost:${Number(process.env.PORT || 4000)}`).replace(/\/+$/, ""),
  jwtSecret: required("JWT_SECRET"),
  supabaseUrl: required("SUPABASE_URL"),
  supabaseServiceKey: required("SUPABASE_SERVICE_ROLE_KEY"),
  pluginFilesBucket: process.env.SUPABASE_PLUGIN_FILES_BUCKET || "plugin-files",
  avatarsBucket: process.env.SUPABASE_AVATARS_BUCKET || "avatars",
  adminEmails: (process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((email) => email.trim().toLowerCase())
    .filter(Boolean),
  github: {
    clientId: process.env.GITHUB_CLIENT_ID,
    clientSecret: process.env.GITHUB_CLIENT_SECRET,
    callbackUrl: required(
      "GITHUB_CALLBACK_URL",
      "http://localhost:4000/api/auth/github/callback",
    ),
  },
  resend: {
    apiKey: process.env.RESEND_API_KEY,
    from: process.env.MAIL_FROM || "CODEX AI <no-reply@codex-ai.site>",
    supportFrom:
      process.env.MAIL_FROM_SUPPORT ||
      "CODEX AI Support <support@codex-ai.site>",
  },
  // WhatsApp ban checker tool (/api/tools/ban-check). The key stays on the
  // server; without it the tool answers "not available right now".
  banCheck: {
    apiKey: (process.env.BANCHECK_API_KEY || process.env.BARON_API_KEY || "").trim(),
    apiUrl: process.env.BANCHECK_API_URL || "https://baron0.com/api/v2/check",
    rateLimitPerMin: Number(process.env.BANCHECK_RATE_LIMIT_PER_MIN) || 10,
    cacheMs:
      (process.env.BANCHECK_CACHE_SECONDS === undefined
        ? 45
        : Number(process.env.BANCHECK_CACHE_SECONDS) || 0) * 1000,
    // Trusted reverse proxies in front of the API (Render = 1). Set 0 locally.
    proxyHops: Number.isFinite(Number(process.env.BANCHECK_PROXY_HOPS))
      && process.env.BANCHECK_PROXY_HOPS !== undefined
      ? Number(process.env.BANCHECK_PROXY_HOPS)
      : process.env.NODE_ENV === "production" ? 1 : 0,
  },
  session: {
    supabaseBucket: process.env.SUPABASE_SESSION_BUCKET || process.env.DEFAULT_BUCKET_NAME || "sessions",
    defaultBucketName: process.env.DEFAULT_BUCKET_NAME || "sessions",
    defaultBucketPublic: parseBool(process.env.DEFAULT_BUCKET_PUBLIC, false),
    indexFilePath: path.join(
      __dirname,
      "..",
      "..",
      "data",
      "session-index.json",
    ),
  },
};
export const isAdminEmail = (email) =>
  Boolean(email) && env.adminEmails.includes(email.trim().toLowerCase());
