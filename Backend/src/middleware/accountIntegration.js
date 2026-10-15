import { createHash } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

export async function authenticateAccountIntegration(req, res, next) {
  if (!env.premiumFeaturesEnabled) {
    return res.status(503).json({ error: "Account integrations are not available yet." });
  }
  const authorization = req.get("authorization") || "";
  const match = /^Bearer (codex_int_[A-Za-z0-9_-]{43})$/.exec(authorization);
  if (!match) {
    return res.status(401).json({ error: "Valid account integration credentials are required." });
  }

  const tokenHash = createHash("sha256").update(match[1]).digest("hex");
  const { data: token, error } = await supabase
    .from("account_integration_tokens")
    .select("id, created_by")
    .eq("token_hash", tokenHash)
    .is("revoked_at", null)
    .maybeSingle();

  if (error) {
    console.error("[account-integration] token lookup failed:", error);
    return res.status(503).json({ error: "Account integration is temporarily unavailable." });
  }
  if (!token) return res.status(401).json({ error: "Invalid account integration credentials." });

  const [{ data: admin, error: adminError }, { error: updateError }] = await Promise.all([
    supabase.from("users").select("id, role").eq("id", token.created_by).maybeSingle(),
    supabase
      .from("account_integration_tokens")
      .update({ last_used_at: new Date().toISOString() })
      .eq("id", token.id),
  ]);

  if (adminError || updateError) {
    console.error("[account-integration] token owner or use update failed:", adminError || updateError);
    return res.status(503).json({ error: "Account integration is temporarily unavailable." });
  }
  if (admin?.role !== "admin") {
    return res.status(403).json({ error: "The integration owner no longer has administrator access." });
  }

  req.integrationAdminId = admin.id;
  next();
}
