import { Resend } from "resend";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

let client = null;
const getClient = () => {
  if (!env.resend.apiKey) return null;
  if (!client) client = new Resend(env.resend.apiKey);
  return client;
};

// Shared sender for every admin alert. Silently no-ops if Resend isn't
// configured, so local dev never crashes on a missing mail setup. The
// review link points at /console — an admin who isn't logged in yet lands
// on a sign-in prompt there and is carried straight through to the right
// tab once authenticated.
const sendAdminAlert = async ({ subject, heading, body, tab }) => {
  const resend = getClient();
  if (!resend) return;

  const { data: admins, error } = await supabase
    .from("users")
    .select("email")
    .eq("role", "admin")
    .eq("email_notifications_enabled", true);

  if (error || !admins?.length) return;

  const reviewUrl = `${env.frontendUrl}/console?tab=${tab}`;

  await Promise.allSettled(
    admins.map((admin) =>
      resend.emails.send({
        from: env.resend.from,
        to: admin.email,
        subject,
        text: `${heading}\n\n${body}\n\nReview it: ${reviewUrl}`,
        html: `<p><strong>${heading}</strong></p><p>${body}</p><p><a href="${reviewUrl}">Click to review</a></p>`,
      })
    )
  );
};

export const notifyAdminsOfSubmission = (submission) =>
  sendAdminAlert({
    subject: `New plugin submission: ${submission.title}`,
    heading: submission.title,
    body: submission.description,
    tab: "submissions",
  });

export const notifyAdminsOfSuggestion = (suggestion) =>
  sendAdminAlert({
    subject: `New suggestion from ${suggestion.email}`,
    heading: `New suggestion from ${suggestion.email}`,
    body: suggestion.idea,
    tab: "suggestions",
  });

// Password-reset email — separate from sendAdminAlert since it goes to one
// specific user (not every opted-in admin) and isn't a "review" link.
export const sendPasswordResetEmail = async (user, resetUrl) => {
  const resend = getClient();
  if (!resend) return;

  await resend.emails.send({
    from: env.resend.from,
    to: user.email,
    subject: "Reset your CODEX AI password",
    text: `We got a request to reset your CODEX AI password.\n\nReset it here (valid for 1 hour): ${resetUrl}\n\nIf you didn't request this, you can safely ignore this email — your password won't change.`,
    html: `<p>We got a request to reset your CODEX AI password.</p><p><a href="${resetUrl}">Click here to reset it</a> (valid for 1 hour).</p><p>If you didn't request this, you can safely ignore this email — your password won't change.</p>`,
  });
};
