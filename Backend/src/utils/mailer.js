import { Resend } from "resend";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

let client = null;
const getClient = () => {
  if (!env.resend.apiKey) return null;
  if (!client) client = new Resend(env.resend.apiKey);
  return client;
};

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
