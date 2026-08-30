import { supabase } from "../config/supabase.js";
import { env, isAdminEmail } from "../config/env.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  signSession,
  setSessionCookie,
  clearSessionCookie,
} from "../utils/jwt.js";
import { sendPasswordResetEmail } from "../utils/mailer.js";
import crypto from "crypto";
const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const publicUser = (user, authenticatedAt) =>
  user && {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    emailNotificationsEnabled: user.email_notifications_enabled,
    authenticatedAt,
  };
export const signup = async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !password || password.length < 8) {
    return res
      .status(400)
      .json({
        error: "Enter an email and a password of at least 8 characters.",
      });
  }
  const { data: existing } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (existing)
    return res
      .status(409)
      .json({ error: "An account with that email already exists." });
  const passwordHash = await hashPassword(password);
  const role = isAdminEmail(email) ? "admin" : "user";
  const { data: user, error } = await supabase
    .from("users")
    .insert({
      email: email.toLowerCase(),
      password_hash: passwordHash,
      full_name: fullName || null,
      role,
    })
    .select()
    .single();
  if (error) {
    console.error("signup: insert failed", error);
    return res.status(500).json({ error: "Could not create your account." });
  }
  const token = signSession(user);
  setSessionCookie(res, token);
  res.status(201).json({ user: publicUser(user, Date.now()) });
};
export const login = async (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password)
    return res.status(400).json({ error: "Enter your email and password." });
  const { data: user, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (fetchError) console.error("login: fetch failed", fetchError);
  const valid = user && (await comparePassword(password, user.password_hash));
  if (!valid)
    return res
      .status(401)
      .json({ error: "That email and password don't match." });
  const role = isAdminEmail(user.email) ? "admin" : user.role;
  if (role !== user.role) {
    await supabase.from("users").update({ role }).eq("id", user.id);
    user.role = role;
  }
  setSessionCookie(res, signSession(user));
  res.json({ user: publicUser(user, Date.now()) });
};
export const logout = async (_req, res) => {
  clearSessionCookie(res);
  res.status(204).end();
};
export const forgotPassword = async (req, res) => {
  const { email } = req.body || {};
  if (!email) return res.status(400).json({ error: "Enter your email." });
  const { data: user } = await supabase
    .from("users")
    .select("id, email, password_hash")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (user?.password_hash) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    await supabase
      .from("users")
      .update({
        reset_token_hash: tokenHash,
        reset_token_expires_at: expiresAt,
      })
      .eq("id", user.id);
    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    sendPasswordResetEmail(user, resetUrl).catch((err) =>
      console.error("sendPasswordResetEmail failed", err),
    );
  }
  res.json({
    ok: true,
    message: "If that email has an account, we've sent a reset link.",
  });
};
export const resetPassword = async (req, res) => {
  const { email, token, password } = req.body || {};
  if (!email || !token || !password || password.length < 8) {
    return res
      .status(400)
      .json({ error: "Enter a new password of at least 8 characters." });
  }
  const { data: user } = await supabase
    .from("users")
    .select("*")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const valid =
    user &&
    user.reset_token_hash &&
    user.reset_token_hash === tokenHash &&
    user.reset_token_expires_at &&
    new Date(user.reset_token_expires_at) > new Date();
  if (!valid)
    return res
      .status(400)
      .json({
        error: "That reset link is invalid or has expired. Request a new one.",
      });
  const passwordHash = await hashPassword(password);
  const { error } = await supabase
    .from("users")
    .update({
      password_hash: passwordHash,
      reset_token_hash: null,
      reset_token_expires_at: null,
    })
    .eq("id", user.id);
  if (error) {
    console.error("resetPassword: update failed", error);
    return res
      .status(500)
      .json({ error: "Could not reset your password. Please try again." });
  }
  res.json({ ok: true });
};
export const me = async (req, res) => {
  res.json({ user: publicUser(req.user, req.authenticatedAt) });
};
export const uploadAvatar = async (req, res) => {
  if (!req.file)
    return res.status(400).json({ error: "Choose an image to upload." });
  if (!req.file.mimetype.startsWith("image/")) {
    return res.status(400).json({ error: "That file isn't an image." });
  }
  const ext = (req.file.originalname.split(".").pop() || "jpg").toLowerCase();
  const path = `${req.user.id}-${Date.now()}.${ext}`;
  const { error: uploadError } = await supabase.storage
    .from(env.avatarsBucket)
    .upload(path, req.file.buffer, {
      contentType: req.file.mimetype,
      upsert: false,
    });
  if (uploadError) {
    console.error("uploadAvatar: upload failed", uploadError);
    return res.status(500).json({ error: "Could not upload your photo." });
  }
  const { data: publicUrlData } = supabase.storage
    .from(env.avatarsBucket)
    .getPublicUrl(path);
  const { data: updated, error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: publicUrlData.publicUrl })
    .eq("id", req.user.id)
    .select()
    .single();
  if (updateError) {
    console.error("uploadAvatar: user update failed", updateError);
    return res.status(500).json({ error: "Could not save your new photo." });
  }
  res.json({ user: publicUser(updated, req.authenticatedAt) });
};
export const updateNotifications = async (req, res) => {
  const { enabled } = req.body || {};
  const { data, error } = await supabase
    .from("users")
    .update({ email_notifications_enabled: Boolean(enabled) })
    .eq("id", req.user.id)
    .select()
    .single();
  if (error) {
    console.error("updateNotifications: update failed", error);
    return res
      .status(500)
      .json({ error: "Could not update your notification setting." });
  }
  res.json({ user: publicUser(data, req.authenticatedAt) });
};
export const deleteAccount = async (req, res) => {
  const { error } = await supabase.from("users").delete().eq("id", req.user.id);
  if (error) {
    console.error("deleteAccount failed", error);
    return res.status(500).json({ error: "Could not delete your account." });
  }
  clearSessionCookie(res);
  res.status(204).end();
};
export const githubStart = (_req, res) => {
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: "read:user user:email",
    allow_signup: "true",
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};
export const githubCallback = async (req, res) => {
  const { code } = req.query;
  if (!code) return res.redirect(`${env.frontendUrl}/plugins?auth=error`);
  try {
    const tokenRes = await fetch(
      "https://github.com/login/oauth/access_token",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          client_id: env.github.clientId,
          client_secret: env.github.clientSecret,
          code,
          redirect_uri: env.github.callbackUrl,
        }),
      },
    );
    const tokenData = await tokenRes.json();
    if (!tokenData.access_token) throw new Error("No access token from GitHub");
    const ghHeaders = {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: "application/vnd.github+json",
    };
    const [profileRes, emailsRes] = await Promise.all([
      fetch("https://api.github.com/user", { headers: ghHeaders }),
      fetch("https://api.github.com/user/emails", { headers: ghHeaders }),
    ]);
    const profile = await profileRes.json();
    const emails = await emailsRes.json();
    const primaryEmail = Array.isArray(emails)
      ? emails.find((e) => e.primary && e.verified)?.email || emails[0]?.email
      : null;
    if (!primaryEmail)
      throw new Error("GitHub account has no accessible email");
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .or(`github_id.eq.${profile.id},email.eq.${primaryEmail.toLowerCase()}`)
      .maybeSingle();
    const role = isAdminEmail(primaryEmail)
      ? "admin"
      : existing?.role || "user";
    let user = existing;
    if (existing) {
      const { data: updated } = await supabase
        .from("users")
        .update({
          github_id: String(profile.id),
          avatar_url: profile.avatar_url,
          full_name: existing.full_name || profile.name || profile.login,
          role,
        })
        .eq("id", existing.id)
        .select()
        .single();
      user = updated;
    } else {
      const { data: created } = await supabase
        .from("users")
        .insert({
          email: primaryEmail.toLowerCase(),
          github_id: String(profile.id),
          full_name: profile.name || profile.login,
          avatar_url: profile.avatar_url,
          role,
        })
        .select()
        .single();
      user = created;
    }
    setSessionCookie(res, signSession(user));
    res.redirect(`${env.frontendUrl}/plugins?auth=success`);
  } catch (err) {
    console.error("GitHub OAuth failed", err);
    res.redirect(`${env.frontendUrl}/plugins?auth=error`);
  }
};
