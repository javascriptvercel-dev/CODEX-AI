import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";
import { notifyUserOfPremiumExpiry } from "./mailer.js";

const REMINDER_DAYS = [7, 1];
const PAGE_SIZE = 500;
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000;
const STALE_CLAIM_MS = 30 * 60 * 1000;

let running = false;

function utcDayOffset(now, days) {
  const day = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  day.setUTCDate(day.getUTCDate() + days);
  return day;
}

async function getExpiringUsers(day, now) {
  const start = utcDayOffset(now, day).toISOString();
  const end = utcDayOffset(now, day + 1).toISOString();
  const users = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from("users")
      .select("id, email, full_name, premium_until")
      .neq("role", "admin")
      .gte("premium_until", start)
      .lt("premium_until", end)
      .gt("premium_until", now.toISOString())
      .order("id")
      .range(offset, offset + PAGE_SIZE - 1);
    if (error) {
      throw new Error(`Could not find users due a Premium reminder: ${error.message}`);
    }
    users.push(...(data || []));
    if (!data || data.length < PAGE_SIZE) break;
  }
  return users;
}

async function releaseStaleClaims(now) {
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS).toISOString();
  const { error } = await supabase
    .from("premium_expiry_reminders")
    .delete()
    .eq("status", "sending")
    .lt("created_at", staleBefore);
  if (error) {
    throw new Error(`Could not release stale Premium reminder claims: ${error.message}`);
  }
}

async function sendReminderOnce(user, daysBefore) {
  if (!user.email) {
    console.error(`[premium-reminders] User ${user.id} has no email address; skipping reminder.`);
    return;
  }

  const { data: claim, error: claimError } = await supabase
    .from("premium_expiry_reminders")
    .insert({
      user_id: user.id,
      expires_at: user.premium_until,
      days_before: daysBefore,
      status: "sending",
    })
    .select("id")
    .maybeSingle();

  if (claimError?.code === "23505") return;
  if (claimError) {
    throw new Error(`Could not reserve Premium reminder for user ${user.id}: ${claimError.message}`);
  }
  if (!claim) return;

  try {
    await notifyUserOfPremiumExpiry(user, user.premium_until, daysBefore);
    const { error: updateError } = await supabase
      .from("premium_expiry_reminders")
      .update({ status: "sent", sent_at: new Date().toISOString() })
      .eq("id", claim.id);
    if (updateError) {
      console.error(`[premium-reminders] Email sent, but could not mark reminder ${claim.id} as sent:`, updateError);
    }
  } catch (error) {
    const { error: deleteError } = await supabase
      .from("premium_expiry_reminders")
      .delete()
      .eq("id", claim.id);
    if (deleteError) {
      console.error(`[premium-reminders] Could not release failed reminder ${claim.id}:`, deleteError);
    }
    console.error(`[premium-reminders] Could not email user ${user.id}:`, error);
  }
}

export async function runPremiumExpiryReminders(now = new Date()) {
  if (!env.premiumFeaturesEnabled) return;
  if (!env.resend.apiKey) {
    console.error("[premium-reminders] PREMIUM_FEATURES_ENABLED is true but RESEND_API_KEY is not configured.");
    return;
  }
  if (running) return;

  running = true;
  try {
    await releaseStaleClaims(now);
    for (const daysBefore of REMINDER_DAYS) {
      const users = await getExpiringUsers(daysBefore, now);
      for (const user of users) {
        await sendReminderOnce(user, daysBefore);
      }
    }
  } finally {
    running = false;
  }
}

export function startPremiumExpiryReminderJob() {
  if (!env.premiumFeaturesEnabled) return;
  if (!env.resend.apiKey) {
    console.error("[premium-reminders] Reminder job not started because RESEND_API_KEY is not configured.");
    return;
  }

  const run = () => {
    runPremiumExpiryReminders().catch((error) =>
      console.error("[premium-reminders] Reminder check failed:", error),
    );
  };

  run();
  setInterval(run, CHECK_INTERVAL_MS);
}
