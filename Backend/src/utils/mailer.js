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

const escapeHtml = (value) =>
  String(value || "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

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
    subject: `New plugin submission from ${creatorName} - ${submittedAt}`,
    heading: `New plugin submission from ${creatorName}`,
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

export const notifyPluginCreatorOfDecision = async (submission, status, note) => {
  if (submission.users?.role === "admin") return;
  const email = submission.users?.email;
  if (!email) {
    throw new Error(`Cannot notify plugin creator for submission ${submission.public_id}: no email address.`);
  }

  const resend = getClient();
  if (!resend) {
    throw new Error("Cannot notify plugin creator: RESEND_API_KEY is not configured.");
  }

  const approved = status === "approved";
  const title = submission.title || "your plugin submission";
  const rejectionReason = typeof note === "string" ? note.trim() : "";
  const greeting = submission.users?.full_name
    ? `Hi ${submission.users.full_name},`
    : "Hello,";
  const heading = approved
    ? "Your plugin has been approved"
    : "Your plugin submission was not approved";
  const reason = !approved && rejectionReason
    ? `\n\nReason: ${rejectionReason}`
    : "";
  const text = `${greeting}\n\n${heading}: ${title}.${reason}\n\nThank you for contributing to CODEX AI.`;
  const html = `<p>${escapeHtml(greeting)}</p><p><strong>${escapeHtml(heading)}:</strong> ${escapeHtml(title)}.</p>${reason ? `<p><strong>Reason:</strong> ${escapeHtml(rejectionReason)}</p>` : ""}<p>Thank you for contributing to CODEX AI.</p>`;
  const { error } = await resend.emails.send({
    from: env.resend.from,
    to: email,
    subject: `${heading}: ${title}`,
    text,
    html,
  });
  if (error) {
    throw new Error(`Could not send plugin decision email to ${email}: ${error.message || "email provider error"}`);
  }
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
