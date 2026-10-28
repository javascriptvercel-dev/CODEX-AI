import { supabase } from "../config/supabase.js";
import { env, isAdminEmail } from "../config/env.js";
import { hashPassword, comparePassword } from "../utils/password.js";
import {
  signSession,
  setSessionCookie,
  clearSessionCookie,
} from "../utils/jwt.js";
import {
  sendPasswordResetEmail,
  sendEmailChangeConfirmation,
  sendAccountDeletionConfirmation,
} from "../utils/mailer.js";
import crypto from "crypto";

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000;
const EMAIL_CHANGE_TTL_MS = 24 * 60 * 60 * 1000;
const ACCOUNT_DELETION_TTL_MS = 60 * 60 * 1000;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const OAUTH_STATE_COOKIE = "codex_oauth_state";
const GOOGLE_OAUTH_STATE_COOKIE = "codex_google_oauth_state";

const publicUser = (user, authenticatedAt) =>
  user && {
    id: user.id,
    email: user.email,
    fullName: user.full_name,
    avatarUrl: user.avatar_url,
    role: user.role,
    isPremium: user.role === "admin" || Boolean(
      env.premiumFeaturesEnabled &&
      user.premium_until &&
      Date.parse(user.premium_until) > Date.now(),
    ),
    premiumExpiresAt: user.role === "admin" ? null : user.premium_until || null,
    emailNotificationsEnabled: user.email_notifications_enabled,
    pendingEmail:
      user.pending_email &&
      user.pending_email_expires_at &&
      Date.parse(user.pending_email_expires_at) > Date.now()
        ? user.pending_email
        : null,
    authenticatedAt,
  };

export const signup = async (req, res) => {
  const { email, password, fullName } = req.body || {};
  if (!email || !EMAIL_PATTERN.test(email.trim())) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (!password || password.length < 8) {
    return res
      .status(400)
      .json({
        error: "Enter an email and a password of at least 8 characters.",
      });
  }
  const { data: existing, error: existingError } = await supabase
    .from("users")
    .select("id")
    .eq("email", email.toLowerCase())
    .maybeSingle();
  if (existingError) {
    console.error("signup: lookup failed", existingError);
    return res.status(500).json({ error: "We could not check that email right now." });
  }
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
  if (fetchError) {
    console.error("login: fetch failed", fetchError);
    return res.status(500).json({ error: "We could not verify your login right now." });
  }
  // Keep the response identical for unknown emails and invalid passwords so
  // the login endpoint cannot be used to discover which emails have accounts.
  if (!user || !user.password_hash)
    return res
      .status(401)
      .json({
        error:
          "Incorrect email or password. If you signed up with GitHub or Google, use that sign-in option or choose Forgot password to set a password.",
      });
  const valid = await comparePassword(password, user.password_hash);
  if (!valid)
    return res
      .status(401)
      .json({
        error:
          "Incorrect email or password. If you signed up with GitHub or Google, use that sign-in option or choose Forgot password to set a password.",
      });
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
  const { data: user, error: lookupError } = await supabase
    .from("users")
    .select("id, email")
    .eq("email", email.trim().toLowerCase())
    .maybeSingle();
  if (lookupError) {
    console.error("forgotPassword: account lookup failed", lookupError);
  } else if (user) {
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_TTL_MS).toISOString();
    const { error: updateError } = await supabase
      .from("users")
      .update({
        reset_token_hash: tokenHash,
        reset_token_expires_at: expiresAt,
      })
      .eq("id", user.id);
    if (updateError) {
      console.error("forgotPassword: reset token save failed", updateError);
    } else {
      const resetUrl = `${env.frontendUrl}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
      try {
        await sendPasswordResetEmail(user, resetUrl);
      } catch (error) {
        console.error("forgotPassword: email delivery failed", error);
      }
    }
  }
  res.json({
    ok: true,
    message: "If an account exists for that email, a password reset link will be sent.",
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
      // Invalidate every session issued before this reset.
      session_version: Number(user.session_version ?? 0) + 1,
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
    return res.status(400).json({ error: "The selected file is not an image." });
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

// Shared by the request step and the confirm step so the rules can't drift.
const checkEmailChange = async (user, nextEmail) => {
  const wasAdmin = user.role === "admin";
  const becomesAdmin = isAdminEmail(nextEmail);
  // Roles are derived from ADMIN_EMAILS at login, so an email change must
  // never grant or silently drop admin access.
  if (!wasAdmin && becomesAdmin) {
    return { status: 400, error: "This email address cannot be used for this account." };
  }
  if (wasAdmin && !becomesAdmin) {
    return {
      status: 400,
      error: "Administrator emails must be listed in ADMIN_EMAILS before you can switch to them.",
    };
  }
  const { data: taken, error } = await supabase
    .from("users")
    .select("id")
    .eq("email", nextEmail)
    .neq("id", user.id)
    .maybeSingle();
  if (error) {
    console.error("checkEmailChange: lookup failed", error);
    return { status: 500, error: "We could not check that email right now." };
  }
  if (taken) {
    return { status: 409, error: "An account with that email already exists." };
  }
  return null;
};

export const updateProfile = async (req, res) => {
  const { fullName, email } = req.body || {};
  const updates = {};
  let requestedEmail = null;

  if (fullName !== undefined) {
    const name = String(fullName).trim();
    if (name.length > 80) {
      return res.status(400).json({ error: "Name must be 80 characters or fewer." });
    }
    updates.full_name = name || null;
  }

  if (email !== undefined) {
    const nextEmail = String(email).trim().toLowerCase();
    if (!EMAIL_PATTERN.test(nextEmail)) {
      return res.status(400).json({ error: "Enter a valid email address." });
    }
    if (nextEmail !== req.user.email) {
      const problem = await checkEmailChange(req.user, nextEmail);
      if (problem) return res.status(problem.status).json({ error: problem.error });
      requestedEmail = nextEmail;
    }
  }

  let current = req.user;
  if (Object.keys(updates).length) {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("id", req.user.id)
      .select()
      .single();
    if (error) {
      console.error("updateProfile: update failed", error);
      return res.status(500).json({ error: "Could not save your profile." });
    }
    current = data;
  }

  if (requestedEmail) {
    // Only a hash of the token is stored; the raw token lives in the email.
    const token = crypto.randomBytes(32).toString("hex");
    const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
    const { data: pending, error: pendingError } = await supabase
      .from("users")
      .update({
        pending_email: requestedEmail,
        pending_email_token_hash: tokenHash,
        pending_email_expires_at: new Date(Date.now() + EMAIL_CHANGE_TTL_MS).toISOString(),
      })
      .eq("id", req.user.id)
      .select("email")
      .single();
    if (pendingError) {
      console.error("updateProfile: pending email save failed", pendingError);
      return res.status(500).json({
        error:
          pendingError.code === "42703"
            ? "Email changes need database migration 016 to be applied first."
            : "Could not start your email change.",
      });
    }
    try {
      await sendEmailChangeConfirmation(
        pending,
        requestedEmail,
        `${env.frontendUrl}/confirm-email?token=${token}`,
      );
    } catch (mailError) {
      console.error("updateProfile: confirmation email failed", mailError);
      await supabase
        .from("users")
        .update({ pending_email: null, pending_email_token_hash: null, pending_email_expires_at: null })
        .eq("id", req.user.id);
      return res.status(502).json({
        error: "We could not send the confirmation email. Check the address and try again.",
      });
    }
    current = pending;
  }

  res.json({ user: publicUser(current, req.authenticatedAt), confirmationSentTo: requestedEmail });
};

export const confirmEmailChange = async (req, res) => {
  const { token } = req.body || {};
  if (!token || typeof token !== "string") {
    return res.status(400).json({ error: "This confirmation link is invalid." });
  }
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { data: account } = await supabase
    .from("users")
    .select("*")
    .eq("pending_email_token_hash", tokenHash)
    .maybeSingle();
  const valid =
    account &&
    account.pending_email &&
    account.pending_email_expires_at &&
    new Date(account.pending_email_expires_at) > new Date();
  if (!valid) {
    return res.status(400).json({
      error: "That confirmation link is invalid or has expired. Request the change again from Settings.",
    });
  }
  // Re-check at confirm time: the address may have been taken since the request.
  const problem = await checkEmailChange(account, account.pending_email);
  if (problem) return res.status(problem.status).json({ error: problem.error });

  let { data: updated, error } = await supabase
    .from("users")
    .update({
      email: account.pending_email,
      pending_email: null,
      pending_email_token_hash: null,
      pending_email_expires_at: null,
      // The login identity changed, so sign out every other session.
      session_version: Number(account.session_version ?? 0) + 1,
    })
    .eq("id", account.id)
    .select()
    .single();
  if (error && error.code === "42703") {
    ({ data: updated, error } = await supabase
      .from("users")
      .update({
        email: account.pending_email,
        pending_email: null,
        pending_email_token_hash: null,
        pending_email_expires_at: null,
      })
      .eq("id", account.id)
      .select()
      .single());
  }
  if (error) {
    console.error("confirmEmailChange: update failed", error);
    return res.status(500).json({ error: "Could not confirm your new email. Please try again." });
  }
  // Keep this browser signed in only if it already belonged to this account.
  if (req.user?.id === updated.id) setSessionCookie(res, signSession(updated));
  res.json({ ok: true, email: updated.email });
};

export const cancelEmailChange = async (req, res) => {
  const { data, error } = await supabase
    .from("users")
    .update({ pending_email: null, pending_email_token_hash: null, pending_email_expires_at: null })
    .eq("id", req.user.id)
    .select()
    .single();
  if (error) {
    console.error("cancelEmailChange: failed", error);
    return res.status(500).json({ error: "Could not cancel the email change." });
  }
  res.json({ user: publicUser(data, req.authenticatedAt) });
};

export const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body || {};
  if (!newPassword || String(newPassword).length < 8) {
    return res.status(400).json({ error: "Enter a new password of at least 8 characters." });
  }
  const { data: account, error: fetchError } = await supabase
    .from("users")
    .select("*")
    .eq("id", req.user.id)
    .single();
  if (fetchError || !account) {
    console.error("changePassword: fetch failed", fetchError);
    return res.status(500).json({ error: "Could not verify your account right now." });
  }
  // GitHub-only accounts have no password yet, so there is nothing to verify.
  if (account.password_hash) {
    const valid = await comparePassword(String(currentPassword || ""), account.password_hash);
    if (!valid) {
      return res.status(400).json({ error: "Your current password is incorrect." });
    }
  }
  const passwordHash = await hashPassword(String(newPassword));
  const nextVersion = Number(account.session_version ?? 0) + 1;
  let { data: updated, error } = await supabase
    .from("users")
    .update({ password_hash: passwordHash, session_version: nextVersion })
    .eq("id", req.user.id)
    .select()
    .single();
  if (error && error.code === "42703") {
    // session_version (migration 014) not applied yet: still save the password.
    ({ data: updated, error } = await supabase
      .from("users")
      .update({ password_hash: passwordHash })
      .eq("id", req.user.id)
      .select()
      .single());
  }
  if (error) {
    console.error("changePassword: update failed", error);
    return res.status(500).json({ error: "Could not change your password." });
  }
  // Other devices are signed out by the version bump; keep this one signed in.
  setSessionCookie(res, signSession(updated));
  res.json({ ok: true });
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

export const requestAccountDeletion = async (req, res) => {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { data: pending, error } = await supabase
    .from("users")
    .update({
      pending_deletion_token_hash: tokenHash,
      pending_deletion_expires_at: new Date(Date.now() + ACCOUNT_DELETION_TTL_MS).toISOString(),
    })
    .eq("id", req.user.id)
    .select()
    .single();

  if (error) {
    console.error("requestAccountDeletion: token save failed", error);
    return res.status(500).json({
      error:
        error.code === "42703"
          ? "Account deletion is temporarily unavailable. Please try again later."
          : "Could not start account deletion.",
    });
  }

  try {
    await sendAccountDeletionConfirmation(
      pending,
      `${env.frontendUrl}/confirm-account-deletion?token=${token}`,
    );
  } catch (mailError) {
    console.error("requestAccountDeletion: confirmation email failed", mailError);
    const { error: clearError } = await supabase
      .from("users")
      .update({
        pending_deletion_token_hash: null,
        pending_deletion_expires_at: null,
      })
      .eq("id", req.user.id)
      .eq("pending_deletion_token_hash", tokenHash);
    if (clearError) {
      console.error("requestAccountDeletion: could not clear unused token", clearError);
    }
    return res.status(502).json({
      error: "We could not send the confirmation email. Please try again later.",
    });
  }

  res.json({ ok: true });
};

export const confirmAccountDeletion = async (req, res) => {
  const { token } = req.body || {};
  if (typeof token !== "string" || !/^[a-f0-9]{64}$/.test(token)) {
    return res.status(400).json({ error: "This account deletion link is invalid or has expired." });
  }

  const tokenHash = crypto.createHash("sha256").update(token).digest("hex");
  const { data: deleted, error } = await supabase
    .from("users")
    .delete()
    .eq("pending_deletion_token_hash", tokenHash)
    .gt("pending_deletion_expires_at", new Date().toISOString())
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("confirmAccountDeletion: delete failed", error);
    return res.status(500).json({ error: "Could not delete the account. Please try again." });
  }
  if (!deleted) {
    return res.status(400).json({ error: "This account deletion link is invalid or has expired." });
  }

  if (req.user?.id === deleted.id) clearSessionCookie(res);
  res.json({ ok: true });
};

const SAFE_NEXT_PATTERN = /^\/[a-zA-Z0-9\-_\/]*$/;
function safeNextPath(value, fallback = "/create") {
  if (typeof value === "string" && SAFE_NEXT_PATTERN.test(value) && !value.startsWith("//")) {
    return value;
  }
  return fallback;
}

const OAUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.nodeEnv === "production",
  sameSite: "lax",
  path: "/",
  maxAge: 10 * 60 * 1000,
};

export const githubStart = (req, res) => {
  const next = safeNextPath(req.query.next, "/create");
  // state must be an unpredictable nonce; the redirect path travels in the
  // cookie instead, so the callback cannot be forged (login CSRF).
  const nonce = crypto.randomBytes(16).toString("hex");
  res.cookie(OAUTH_STATE_COOKIE, `${nonce}.${next}`, OAUTH_COOKIE_OPTIONS);
  const params = new URLSearchParams({
    client_id: env.github.clientId,
    redirect_uri: env.github.callbackUrl,
    scope: "read:user user:email",
    allow_signup: "true",
    state: nonce,
  });
  res.redirect(`https://github.com/login/oauth/authorize?${params.toString()}`);
};

export const githubCallback = async (req, res) => {
  const { code, state } = req.query;
  const cookieState = req.cookies?.[OAUTH_STATE_COOKIE];
  const stateValid =
    typeof state === "string" &&
    typeof cookieState === "string" &&
    cookieState.startsWith(`${state}.`);
  const next = stateValid
    ? safeNextPath(cookieState.slice(state.length + 1), "/create")
    : "/create";
  res.clearCookie(OAUTH_STATE_COOKIE, { ...OAUTH_COOKIE_OPTIONS, maxAge: undefined });
  if (!code || !stateValid) {
    return res.redirect(`${env.frontendUrl}/login?auth=error`);
  }
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
    // Only verified GitHub emails may become the account identity.
    const primaryEmail = Array.isArray(emails)
      ? emails.find((entry) => entry.primary && entry.verified)?.email || null
      : null;
    if (!primaryEmail)
      throw new Error("GitHub account has no verified email");
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
          avatar_url: existing.avatar_url || profile.avatar_url,
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
    const destination = user.role === "admin" ? "/console" : next;
    const successUrl = new URL(destination, env.frontendUrl);
    successUrl.searchParams.set("auth", "success");
    if (
      destination === "/create" ||
      destination === "/tools" ||
      destination.startsWith("/tools/")
    ) {
      successUrl.searchParams.set("welcome", existing ? "back" : "created");
    }
    res.redirect(successUrl.toString());
  } catch (err) {
    console.error("GitHub OAuth failed", err);
    res.redirect(`${env.frontendUrl}/login?auth=error`);
  }
};

export const googleStart = (req, res) => {
  if (!env.google.clientId || !env.google.clientSecret) {
    console.error("Google OAuth is not configured.");
    return res.redirect(`${env.frontendUrl}/login?auth=google_error`);
  }

  const next = safeNextPath(req.query.next, "/create");
  const nonce = crypto.randomBytes(16).toString("hex");
  res.cookie(GOOGLE_OAUTH_STATE_COOKIE, `${nonce}.${next}`, OAUTH_COOKIE_OPTIONS);
  const params = new URLSearchParams({
    client_id: env.google.clientId,
    redirect_uri: env.google.callbackUrl,
    response_type: "code",
    scope: "openid email profile",
    state: nonce,
  });
  res.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`);
};

export const googleCallback = async (req, res) => {
  const { code, state } = req.query;
  const cookieState = req.cookies?.[GOOGLE_OAUTH_STATE_COOKIE];
  const stateValid =
    typeof state === "string" &&
    /^[a-f0-9]{32}$/.test(state) &&
    typeof cookieState === "string" &&
    cookieState.startsWith(`${state}.`);
  const next = stateValid
    ? safeNextPath(cookieState.slice(state.length + 1), "/create")
    : "/create";
  res.clearCookie(GOOGLE_OAUTH_STATE_COOKIE, {
    ...OAUTH_COOKIE_OPTIONS,
    maxAge: undefined,
  });
  if (!code || !stateValid) {
    return res.redirect(`${env.frontendUrl}/login?auth=google_error`);
  }

  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code: String(code),
        client_id: env.google.clientId,
        client_secret: env.google.clientSecret,
        redirect_uri: env.google.callbackUrl,
        grant_type: "authorization_code",
      }),
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || typeof tokenData.access_token !== "string") {
      throw new Error("Google did not return an access token.");
    }

    const profileResponse = await fetch(
      "https://openidconnect.googleapis.com/v1/userinfo",
      { headers: { Authorization: `Bearer ${tokenData.access_token}` } },
    );
    const profile = await profileResponse.json();
    if (
      !profileResponse.ok ||
      typeof profile.sub !== "string" ||
      typeof profile.email !== "string" ||
      profile.email_verified !== true
    ) {
      throw new Error("Google did not return a verified email address.");
    }

    const email = profile.email.trim().toLowerCase();
    const { data: linkedUser, error: linkedUserError } = await supabase
      .from("users")
      .select("*")
      .eq("google_id", profile.sub)
      .maybeSingle();
    if (linkedUserError) throw linkedUserError;

    let existing = linkedUser;
    if (!existing) {
      const { data: emailUser, error: emailUserError } = await supabase
        .from("users")
        .select("*")
        .eq("email", email)
        .maybeSingle();
      if (emailUserError) throw emailUserError;
      existing = emailUser;
    }

    if (existing?.google_id && existing.google_id !== profile.sub) {
      throw new Error("This email is already linked to a different Google account.");
    }

    const role = isAdminEmail(email) ? "admin" : existing?.role || "user";
    let user;
    if (existing) {
      const { data: updated, error: updateError } = await supabase
        .from("users")
        .update({
          google_id: profile.sub,
          avatar_url: existing.avatar_url || profile.picture || null,
          full_name: existing.full_name || profile.name || null,
          role,
        })
        .eq("id", existing.id)
        .select()
        .single();
      if (updateError) throw updateError;
      user = updated;
    } else {
      const { data: created, error: createError } = await supabase
        .from("users")
        .insert({
          email,
          google_id: profile.sub,
          full_name: profile.name || null,
          avatar_url: profile.picture || null,
          role,
        })
        .select()
        .single();
      if (createError) throw createError;
      user = created;
    }

    setSessionCookie(res, signSession(user));
    const destination = user.role === "admin" ? "/console" : next;
    const successUrl = new URL(destination, env.frontendUrl);
    successUrl.searchParams.set("auth", "success");
    if (
      destination === "/create" ||
      destination === "/tools" ||
      destination.startsWith("/tools/")
    ) {
      successUrl.searchParams.set("welcome", existing ? "back" : "created");
    }
    res.redirect(successUrl.toString());
  } catch (error) {
    console.error("Google OAuth failed", error);
    res.redirect(`${env.frontendUrl}/login?auth=google_error`);
  }
};
