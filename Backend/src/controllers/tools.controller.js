import { randomBytes } from "node:crypto";
import { isIP } from "node:net";
import { env } from "../config/env.js";
import { isPremiumUser } from "../utils/premium.js";
import { supabase } from "../config/supabase.js";
import { enforceToolRateLimit } from "../tools/rateLimit.js";
import { createBotBaseArchive, validateBotBaseSettings } from "../tools/botBaseGenerator.js";
import { obfuscateJavaScript, OBFUSCATION_MODES } from "../tools/javascriptObfuscator.js";

const SHORT_CODE_PATTERN = /^[A-Za-z0-9_-]{8}$/;
const MAX_LINKS_PER_USER = 100;
const PREMIUM_MAX_LINKS_PER_USER = 500;
const SHORT_CODE_COLLISION = "23505";
const MAX_OBFUSCATOR_INPUT_LENGTH = 50_000;

function isPrivateAddress(hostname) {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase().replace(/\.+$/, "");
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  const ipVersion = isIP(host);
  if (ipVersion === 4) {
    const parts = host.split(".").map(Number);
    return (
      parts[0] === 0 ||
      parts[0] === 10 ||
      parts[0] === 127 ||
      (parts[0] === 169 && parts[1] === 254) ||
      (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) ||
      (parts[0] === 192 && parts[1] === 168) ||
      (parts[0] === 192 && parts[1] === 0) ||
      (parts[0] === 198 && (parts[1] === 18 || parts[1] === 19 || parts[1] === 51)) ||
      (parts[0] === 203 && parts[1] === 0 && parts[2] === 113) ||
      (parts[0] === 100 && parts[1] >= 64 && parts[1] <= 127) ||
      parts[0] >= 224
    );
  }

  if (ipVersion === 6) {
    const firstHextet = Number.parseInt(host.split(":")[0] || "0", 16);
    return (
      firstHextet < 0x2000 ||
      firstHextet > 0x3fff ||
      host.startsWith("2001:db8:") ||
      host.startsWith("3fff:")
    );
  }

  return false;
}

function parseTargetUrl(value) {
  if (typeof value !== "string" || value.length > 2048) {
    return { error: "Enter a URL no longer than 2,048 characters." };
  }

  let target;
  try {
    target = new URL(value.trim());
  } catch {
    return { error: "Enter a complete URL starting with http:// or https://." };
  }

  if (!["http:", "https:"].includes(target.protocol)) {
    return { error: "Only HTTP and HTTPS URLs can be shortened." };
  }
  if (target.username || target.password) {
    return { error: "URLs containing a username or password are not allowed." };
  }
  if (isPrivateAddress(target.hostname)) {
    return { error: "Private and local network addresses can't be shortened." };
  }

  return { targetUrl: target.toString() };
}

function createShortCode() {
  return randomBytes(6).toString("base64url");
}

export async function createShortLink(req, res) {
  if (
    !(await enforceToolRateLimit(req, res, {
      tool: "url-shortener",
      userLimit: 10,
      premiumUserLimit: 50,
      windowSeconds: 60 * 60,
    }))
  ) {
    return;
  }

  const parsed = parseTargetUrl(req.body?.url);
  if (parsed.error) return res.status(400).json({ error: parsed.error });

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const code = createShortCode();
    const { data, error } = await supabase.rpc("create_short_link", {
      p_user_id: req.user.id,
      p_code: code,
      p_target_url: parsed.targetUrl,
      p_max_links: req.user.role === "admin"
        ? null
        : isPremiumUser(req.user)
          ? PREMIUM_MAX_LINKS_PER_USER
          : MAX_LINKS_PER_USER,
    });

    if (!error && data?.[0]?.limit_reached) {
      return res.status(429).json({
        error: `You can keep up to ${
          isPremiumUser(req.user)
            ? PREMIUM_MAX_LINKS_PER_USER
            : MAX_LINKS_PER_USER
        } active short links. Delete one to create another.`,
      });
    }
    if (!error && data?.[0]) {
      const link = data[0];
      return res.status(201).json({
        link: {
          id: link.id,
          code: link.code,
          targetUrl: link.target_url,
          shortUrl: `${env.publicFrontendUrl}/s/${link.code}`,
          clickCount: link.click_count,
          createdAt: link.created_at,
        },
      });
    }

    if (error?.code !== SHORT_CODE_COLLISION) {
      if (error) console.error("[tools] short-link creation failed:", error);
      else console.error("[tools] short-link creation returned no link data.");
      return res.status(500).json({ error: "Could not create the short link." });
    }
  }

  console.error("[tools] short-link code collisions exceeded retry limit.");
  return res.status(503).json({ error: "Could not create a short link right now." });
}

export async function listShortLinks(req, res) {
  const { data, error } = await supabase
    .from("short_links")
    .select("id, code, target_url, click_count, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false })
    .limit(
      isPremiumUser(req.user)
        ? PREMIUM_MAX_LINKS_PER_USER
        : MAX_LINKS_PER_USER,
    );

  if (error) {
    console.error("[tools] short-link list failed:", error);
    return res.status(500).json({ error: "Could not load your short links." });
  }

  return res.json({
    links: data.map((link) => ({
      id: link.id,
      code: link.code,
      targetUrl: link.target_url,
      shortUrl: `${env.publicFrontendUrl}/s/${link.code}`,
      clickCount: link.click_count,
      createdAt: link.created_at,
    })),
  });
}

export async function deleteShortLink(req, res) {
  const { data, error } = await supabase
    .from("short_links")
    .delete()
    .eq("id", req.params.id)
    .eq("user_id", req.user.id)
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("[tools] short-link deletion failed:", error);
    return res.status(500).json({ error: "Could not delete the short link." });
  }
  if (!data) return res.status(404).json({ error: "Short link not found." });
  return res.json({ ok: true });
}

export async function redirectShortLink(req, res) {
  const { code } = req.params;
  if (!SHORT_CODE_PATTERN.test(code)) {
    return res.status(404).json({ error: "Short link not found." });
  }

  const { data, error } = await supabase.rpc("resolve_short_link", {
    p_code: code,
  });
  if (error) {
    console.error("[tools] short-link redirect lookup failed:", error);
    return res.status(500).json({ error: "Could not open this short link." });
  }
  const targetUrl = Array.isArray(data) ? data[0]?.target_url : null;
  if (!targetUrl) return res.status(404).json({ error: "Short link not found." });

  return res.redirect(302, targetUrl);
}

export async function generateBotBase(req, res) {
  if (
    !(await enforceToolRateLimit(req, res, {
      tool: "bot-base-generator",
      userLimit: 10,
      windowSeconds: 60 * 60,
    }))
  ) {
    return;
  }

  const { config, error } = validateBotBaseSettings(req.body);
  if (error) return res.status(400).json({ error });

  try {
    const archive = await createBotBaseArchive(config);
    res.set({
      "Content-Type": "application/zip",
      "Content-Disposition": 'attachment; filename="whatsapp-bot-base.zip"',
      "Cache-Control": "no-store",
    });
    return res.status(200).send(archive);
  } catch (err) {
    console.error("[bot-base-generator] failed to package template:", err);
    return res
      .status(500)
      .json({ error: "The bot base couldn't be generated. Please try again later." });
  }
}

export async function obfuscateCode(req, res) {
  if (
    !(await enforceToolRateLimit(req, res, {
      tool: "javascript-obfuscator",
      userLimit: 10,
      windowSeconds: 60 * 60,
    }))
  ) {
    return;
  }

  const { code, mode } = req.body || {};
  if (typeof code !== "string" || !code.trim()) {
    return res.status(400).json({ error: "Enter JavaScript code to obfuscate." });
  }
  if (code.length > MAX_OBFUSCATOR_INPUT_LENGTH) {
    return res.status(413).json({
      error: `Code must be ${MAX_OBFUSCATOR_INPUT_LENGTH.toLocaleString()} characters or fewer.`,
    });
  }
  if (!Object.hasOwn(OBFUSCATION_MODES, mode)) {
    return res.status(400).json({ error: "Choose Easy, Medium, or Hard obfuscation." });
  }

  try {
    return res.json({ code: obfuscateJavaScript(code, mode) });
  } catch (error) {
    console.error("[javascript-obfuscator] failed to obfuscate code:", error);
    return res.status(400).json({
      error: "Could not obfuscate this JavaScript. Check the syntax and try again.",
    });
  }
}
