import { Resend } from "resend";
import { env } from "../config/env.js";
import { supabase } from "../config/supabase.js";

let client = null;
const getClient = () => {
  if (!env.resend.apiKey) return null;
  if (!client) client = new Resend(env.resend.apiKey);
  return client;
};

const formatAlertDate = (value) =>
  new Date(value || Date.now()).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }) + " UTC";

const sendAdminAlert = async ({ subject, heading, body, submittedAt, tab }) => {
  const resend = getClient();
  if (!resend) return;

  const { data: admins, error } = await supabase
    .from("users")
    .select("email")
    .eq("role", "admin")
    .eq("email_notifications_enabled", true);

  if (error || !admins?.length) return;

  const reviewUrl = `${env.frontendUrl}/console?tab=${tab}`;
  const timestamp = formatAlertDate(submittedAt);
  const textBody = `${heading}\n\n${body}\n\nSubmitted: ${timestamp}\n\nReview it: ${reviewUrl}`;
  const htmlBody = `<p><strong>${heading}</strong></p><p>${body}</p><p><strong>Submitted:</strong> ${timestamp}</p><p><a href="${reviewUrl}">Click to review</a></p>`;

  await Promise.allSettled(
    admins.map((admin) =>
      resend.emails.send({
        from: env.resend.from,
        to: admin.email,
        subject,
        text: textBody,
        html: htmlBody,
      })
    )
  );
};

export const notifyAdminsOfSubmission = (submission, creator) => {
  const creatorName = creator?.full_name || creator?.email || "Unknown user";
  const submittedAt = formatAlertDate(submission.created_at);
  return sendAdminAlert({
    subject: `New plugin suggestion from ${creatorName} - ${submittedAt}`,
    heading: `New plugin suggestion from ${creatorName}`,
    body: `${submission.title}\n\n${submission.description}`,
    submittedAt: submission.created_at,
    tab: "submissions",
  });
};

export const notifyAdminsOfSuggestion = (suggestion, creator) => {
  const creatorName = creator?.full_name || creator?.email || suggestion.email;
  const submittedAt = formatAlertDate(suggestion.created_at);
  return sendAdminAlert({
    subject: `New suggestion from ${creatorName} - ${submittedAt}`,
    heading: `New suggestion from ${creatorName}`,
    body: suggestion.idea,
    submittedAt: suggestion.created_at,
    tab: "suggestions",
  });
};

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
