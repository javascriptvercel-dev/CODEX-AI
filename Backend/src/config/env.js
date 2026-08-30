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
  cookieDomain: process.env.COOKIE_DOMAIN || undefined,
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
    from: process.env.MAIL_FROM || "CODEX AI <no-reply@codex-ai.dev>",
  },
  session: {
    minioEndPoint: process.env.MINIO_ENDPOINT || "localhost",
    minioPort: Number(process.env.MINIO_PORT || 9000),
    minioUseSSL: parseBool(process.env.MINIO_USE_SSL, false),
    minioAccessKey: process.env.MINIO_ACCESS_KEY || "",
    minioSecretKey: process.env.MINIO_SECRET_KEY || "",
    minioBucket: process.env.MINIO_BUCKET || "",
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
