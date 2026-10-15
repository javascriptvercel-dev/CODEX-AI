import { randomBytes, createHash } from "node:crypto";
import { supabase } from "../config/supabase.js";
import { hashPassword } from "../utils/password.js";
import { env, isAdminEmail } from "../config/env.js";
import { isPremiumUser } from "../utils/premium.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function getDashboard(req, res) {
  const since = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const [linksResult, usageResult, clicksResult, submissionsResult] = await Promise.all([
    supabase
      .from("short_links")
      .select("id, code, target_url, click_count, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(req.user.role === "admin" || isPremiumUser(req.user) ? 500 : 100),
    env.premiumFeaturesEnabled
      ? supabase
      .from("tool_usage_events")
      .select("id, tool_slug, created_at", { count: "exact" })
      .eq("user_id", req.user.id)
      .gte("created_at", since)
      .order("created_at", { ascending: false })
      .limit(100)
      : Promise.resolve({ data: [], error: null }),
    env.premiumFeaturesEnabled
      ? supabase.rpc("get_short_link_clicks_by_day", {
          p_user_id: req.user.id,
          p_days: 30,
        })
      : Promise.resolve({ data: [], error: null }),
    supabase
      .from("plugin_submissions")
      .select("public_id, title, status, created_at")
      .eq("user_id", req.user.id)
      .order("created_at", { ascending: false })
      .limit(20),
  ]);

  const failure = [linksResult, usageResult, clicksResult, submissionsResult]
    .find((result) => result.error);
  if (failure) {
    console.error("[dashboard] load failed:", failure.error);
    return res.status(500).json({ error: "Could not load your dashboard." });
  }

  const links = linksResult.data.map((link) => ({
    id: link.id,
    code: link.code,
    targetUrl: link.target_url,
    shortUrl: `${env.publicFrontendUrl}/s/${link.code}`,
    clickCount: link.click_count,
    createdAt: link.created_at,
  }));
  const totalClicks = links.reduce((sum, link) => sum + Number(link.clickCount || 0), 0);
  const recentUsage = usageResult.data.map((event) => ({
    id: event.id,
    tool: event.tool_slug,
    createdAt: event.created_at,
  }));

  return res.json({
    account: {
      id: req.user.id,
      email: req.user.email,
      fullName: req.user.full_name,
      role: req.user.role,
      createdAt: req.user.created_at,
    },
    premium: {
      active: isPremiumUser(req.user),
      expiresAt: req.user.premium_until || null,
      available: env.premiumFeaturesEnabled,
    },
    usage: {
      windowDays: 30,
      totalRuns: usageResult.count ?? recentUsage.length,
      events: recentUsage,
    },
    links: {
      items: links,
      total: links.length,
      totalClicks,
      dailyClicks: clicksResult.data.map((entry) => ({
        day: entry.day,
        clicks: Number(entry.clicks),
      })),
      maxActive: req.user.role === "admin"
        ? null
        : isPremiumUser(req.user)
          ? 500
          : 100,
    },
    submissions: submissionsResult.data.map((submission) => ({
      id: submission.public_id,
      title: submission.title,
      status: submission.status,
      createdAt: submission.created_at,
    })),
  });
}

export async function getToolSettings(req, res) {
  if (!env.premiumFeaturesEnabled) return res.json({ settings: [] });
  const { data, error } = await supabase
    .from("user_tool_settings")
    .select("tool_slug, settings, updated_at")
    .eq("user_id", req.user.id);
  if (error) {
    console.error("[dashboard] tool settings load failed:", error);
    return res.status(500).json({ error: "Could not load saved settings." });
  }
  return res.json({
    settings: data.map((entry) => ({
      tool: entry.tool_slug,
      values: entry.settings,
      updatedAt: entry.updated_at,
    })),
  });
}

export async function saveToolSettings(req, res) {
  if (!env.premiumFeaturesEnabled) {
    return res.status(503).json({ error: "Premium features aren't available yet." });
  }
  const { tool, settings } = req.body || {};
  if (
    typeof tool !== "string" ||
    !/^[a-z0-9-]{1,80}$/.test(tool) ||
    !settings ||
    typeof settings !== "object" ||
    Array.isArray(settings) ||
    Buffer.byteLength(JSON.stringify(settings)) > 16_384
  ) {
    return res.status(400).json({ error: "Provide valid tool settings smaller than 16 KB." });
  }

  const { data, error } = await supabase
    .from("user_tool_settings")
    .upsert(
      {
        user_id: req.user.id,
        tool_slug: tool,
        settings,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id,tool_slug" },
    )
    .select("tool_slug, settings, updated_at")
    .single();
  if (error) {
    console.error("[dashboard] tool settings save failed:", error);
    return res.status(500).json({ error: "Could not save these settings." });
  }
  return res.json({ tool: data.tool_slug, values: data.settings, updatedAt: data.updated_at });
}

async function createManagedAccount({ email, password, fullName, grantPremium }) {
  const normalizedEmail = email.trim().toLowerCase();
  if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
    return { status: 400, error: "Enter a valid email address." };
  }
  if (typeof password !== "string" || password.length < 12 || password.length > 128) {
    return { status: 400, error: "Password must be between 12 and 128 characters." };
  }
  if (typeof fullName !== "string" || !fullName.trim() || fullName.trim().length > 100) {
    return { status: 400, error: "Enter a name between 1 and 100 characters." };
  }
  if (typeof grantPremium !== "boolean") {
    return { status: 400, error: "Choose whether this account should receive Premium access." };
  }
  if (grantPremium && !env.premiumFeaturesEnabled) {
    return { status: 503, error: "Premium account grants are not enabled yet." };
  }
  if (isAdminEmail(normalizedEmail)) {
    return { status: 400, error: "Use the configured administrator account flow for admin addresses." };
  }

  const { data: existing, error: lookupError } = await supabase
    .from("users")
    .select("id")
    .eq("email", normalizedEmail)
    .maybeSingle();
  if (lookupError) {
    console.error("[dashboard] account lookup failed:", lookupError);
    return { status: 500, error: "Could not check that email right now." };
  }
  if (existing) return { status: 409, error: "An account with that email already exists." };

  const premiumUntil = grantPremium
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  const newUser = {
    email: normalizedEmail,
    password_hash: await hashPassword(password),
    full_name: fullName.trim(),
    role: "user",
  };
  if (grantPremium) newUser.premium_until = premiumUntil;
  const { data: user, error } = await supabase
    .from("users")
    .insert(newUser)
    .select(
      env.premiumFeaturesEnabled
        ? "id, email, full_name, premium_until"
        : "id, email, full_name",
    )
    .single();
  if (error) {
    if (error.code === "23505") return { status: 409, error: "An account with that email already exists." };
    console.error("[dashboard] account creation failed:", error);
    return { status: 500, error: "Could not create the account." };
  }

  return {
    status: 201,
    account: {
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      premiumUntil: user.premium_until,
    },
  };
}

export async function createAdminAccount(req, res) {
  const result = await createManagedAccount(req.body || {});
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json({ account: result.account });
}

export async function listIntegrationTokens(req, res) {
  const { data, error } = await supabase
    .from("account_integration_tokens")
    .select("id, name, token_prefix, last_used_at, revoked_at, created_at")
    .eq("created_by", req.user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[dashboard] integration token list failed:", error);
    return res.status(500).json({ error: "Could not load account integrations." });
  }
  return res.json({ tokens: data });
}

export async function createIntegrationToken(req, res) {
  const { name } = req.body || {};
  if (typeof name !== "string" || !name.trim() || name.trim().length > 80) {
    return res.status(400).json({ error: "Enter an integration name up to 80 characters." });
  }
  const token = `codex_int_${randomBytes(32).toString("base64url")}`;
  const tokenHash = createHash("sha256").update(token).digest("hex");
  const { data, error } = await supabase
    .from("account_integration_tokens")
    .insert({
      created_by: req.user.id,
      name: name.trim(),
      token_hash: tokenHash,
      token_prefix: token.slice(0, 16),
    })
    .select("id, name, token_prefix, created_at")
    .single();
  if (error) {
    console.error("[dashboard] integration token creation failed:", error);
    return res.status(500).json({ error: "Could not create the account integration." });
  }
  return res.status(201).json({ token: data, secret: token });
}

export async function revokeIntegrationToken(req, res) {
  const { data, error } = await supabase
    .from("account_integration_tokens")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", req.params.id)
    .eq("created_by", req.user.id)
    .is("revoked_at", null)
    .select("id")
    .maybeSingle();
  if (error) {
    console.error("[dashboard] integration token revocation failed:", error);
    return res.status(500).json({ error: "Could not revoke the integration." });
  }
  if (!data) return res.status(404).json({ error: "Integration not found." });
  return res.json({ ok: true });
}

export async function createIntegrationAccount(req, res) {
  const result = await createManagedAccount(req.body || {});
  if (result.error) return res.status(result.status).json({ error: result.error });
  return res.status(result.status).json({ account: result.account });
}
