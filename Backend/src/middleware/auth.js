import { supabase } from "../config/supabase.js";
import { COOKIE_NAME, verifySession } from "../utils/jwt.js";
import { env } from "../config/env.js";

export const attachUser = async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifySession(token) : null;
  if (!payload) {
    req.user = null;
    req.authenticatedAt = null;
    return next();
  }

  const baseFields = [
    "id",
    "email",
    "full_name",
    "avatar_url",
    "role",
    "email_notifications_enabled",
    "created_at",
  ];
  const premiumFields = env.premiumFeaturesEnabled ? ["premium_until"] : [];
  // Migration 016 columns (pending email change) are optional until applied.
  const pendingFields = ["pending_email", "pending_email_expires_at"];
  const fields = [
    ...baseFields,
    "session_version",
    ...premiumFields,
    ...pendingFields,
  ].join(", ");

  let { data, error } = await supabase
    .from("users")
    .select(fields)
    .eq("id", payload.sub)
    .maybeSingle();

  if (error && error.code === "42703") {
    // Migration 016 not applied yet: retry without the pending-email columns
    // so session_version checks (migration 014) stay enforced.
    ({ data, error } = await supabase
      .from("users")
      .select([...baseFields, "session_version", ...premiumFields].join(", "))
      .eq("id", payload.sub)
      .maybeSingle());
  }

  if (error && error.code === "42703") {
    // session_version (migration 014) has not been applied yet —
    // fall back so the app keeps working before the migration runs.
    ({ data, error } = await supabase
      .from("users")
      .select(baseFields.concat(env.premiumFeaturesEnabled ? ["premium_until"] : []).join(", "))
      .eq("id", payload.sub)
      .maybeSingle());
    if (!error && data && Number.isFinite(Number(payload.ver))) {
      // Without the column we cannot verify the version; accept legacy tokens.
    }
  }

  req.user = error ? null : data;
  if (req.user && Number.isFinite(Number(payload.ver))) {
    const dbVersion = Number(req.user.session_version ?? 0);
    if (Number(payload.ver) !== dbVersion) req.user = null;
  }
  req.authenticatedAt = payload.iat ? payload.iat * 1000 : null;
  next();
};

export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to continue." });
  next();
};
