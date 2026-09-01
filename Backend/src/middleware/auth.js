import { supabase } from "../config/supabase.js";
import { COOKIE_NAME, verifySession } from "../utils/jwt.js";
export const attachUser = async (req, _res, next) => {
  const token = req.cookies?.[COOKIE_NAME];
  const payload = token ? verifySession(token) : null;
  if (!payload) {
    req.user = null;
    req.authenticatedAt = null;
    return next();
  }
  const { data, error } = await supabase
    .from("users")
    .select(
      "id, email, full_name, avatar_url, role, email_notifications_enabled",
    )
    .eq("id", payload.sub)
    .maybeSingle();
  req.user = error ? null : data;
  req.authenticatedAt = payload.iat ? payload.iat * 1000 : null;
  next();
};
export const requireAuth = (req, res, next) => {
  if (!req.user) return res.status(401).json({ error: "Sign in to continue." });
  next();
};
