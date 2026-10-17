// Audit trail for manually granted Premium. Every grant, renewal and
// revocation made from the console (or while creating a member account)
// is recorded in the premium_grants table so the admin can answer
// "who paid, when, and until when" without leaving the app.
import { supabase } from "../config/supabase.js";

const VALID_SOURCES = new Set(["admin_console", "admin_account_create", "database"]);
const VALID_ACTIONS = new Set(["granted", "renewed", "extended", "revoked"]);

// Compares the previous premium_until with the new one and returns the
// action to log, or null when nothing effectively changed.
export function describePremiumChange(previousUntil, nextUntil) {
  const previous = previousUntil ? Date.parse(previousUntil) : NaN;
  const next = nextUntil ? Date.parse(nextUntil) : NaN;
  const prevValid = !Number.isNaN(previous);
  const nextValid = !Number.isNaN(next);
  if (!prevValid && !nextValid) return null;
  if (prevValid && nextValid && previous === next) return null;
  if (!nextValid) return "revoked";
  if (!prevValid || previous <= Date.now()) return "granted";
  return next > previous ? "renewed" : "extended";
}

export async function logPremiumGrant({ userId, grantedBy, source, action, expiresAt, note }) {
  if (!userId || !VALID_SOURCES.has(source) || !VALID_ACTIONS.has(action)) return;
  try {
    const { error } = await supabase.from("premium_grants").insert({
      user_id: userId,
      granted_by: String(grantedBy || "system").slice(0, 120),
      source,
      action,
      expires_at: expiresAt || null,
      note:
        typeof note === "string" && note.trim()
          ? note.trim().slice(0, 200)
          : null,
    });
    if (error) console.error("[premium-grants] log failed:", error);
  } catch (error) {
    console.error("[premium-grants] log failed:", error);
  }
}
