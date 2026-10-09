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
  String(value ?? "").replace(/[&<>"']/g, (character) => {
    const entities = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character];
  });

const safeSubject = (value) => String(value).replace(/[\r\n]+/g, " ").slice(0, 180);

const renderEmail = ({
  preheader,
  eyebrow = "CODEX AI",
  heading,
  intro,
  details = [],
  action,
  footer = "This is an automated message from CODEX AI.",
}) => {
  const detailRows = details
    .map(
      ({ label, value }) =>
        `<tr><td style="padding:14px 16px;border-bottom:1px solid #e8edf3;"><div style="margin-bottom:6px;color:#64748b;font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;">${escapeHtml(label)}</div><div style="color:#172033;font-size:14px;line-height:1.65;white-space:pre-wrap;overflow-wrap:anywhere;">${escapeHtml(value).replace(/\r?\n/g, "<br>")}</div></td></tr>`,
    )
    .join("");
  const actionHtml = action
    ? `<table role="presentation" cellspacing="0" cellpadding="0" style="margin:24px 0 8px;"><tr><td style="border-radius:8px;background:#2563eb;"><a href="${escapeHtml(action.url)}" style="display:inline-block;padding:12px 20px;color:#ffffff;font-size:14px;font-weight:700;text-decoration:none;">${escapeHtml(action.label)}</a></td></tr></table>`
    : "";

  return `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;padding:0;background:#f3f6fa;font-family:Arial,Helvetica,sans-serif;color:#172033;"><div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(preheader)}</div><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="padding:32px 12px;background:#f3f6fa;"><tr><td align="center"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:600px;border:1px solid #e3e9f1;border-radius:12px;background:#ffffff;"><tr><td style="padding:26px 32px;border-bottom:1px solid #e8edf3;"><div style="color:#172033;font-size:16px;font-weight:700;letter-spacing:.02em;">CODEX AI</div></td></tr><tr><td style="padding:32px;"><div style="margin-bottom:10px;color:#2563eb;font-size:12px;font-weight:700;letter-spacing:.08em;text-transform:uppercase;">${escapeHtml(eyebrow)}</div><h1 style="margin:0 0 14px;color:#172033;font-size:24px;line-height:1.3;">${escapeHtml(heading)}</h1><p style="margin:0;color:#475569;font-size:15px;line-height:1.7;">${escapeHtml(intro).replace(/\r?\n/g, "<br>")}</p>${detailRows ? `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-top:24px;border:1px solid #e8edf3;border-radius:8px;">${detailRows}</table>` : ""}${actionHtml}<p style="margin:24px 0 0;color:#64748b;font-size:13px;line-height:1.6;">${escapeHtml(footer)}</p></td></tr><tr><td style="padding:18px 32px;border-top:1px solid #e8edf3;color:#94a3b8;font-size:12px;line-height:1.5;">CODEX AI &middot; Automated email</td></tr></table></td></tr></table></body></html>`;
};

const formatDetailsAsText = (details) =>
  details.map(({ label, value }) => `${label}:\n${value}`).join("\n\n");

const sendAdminAlert = async ({
  subject,
  heading,
  intro,
  details,
  submittedAt,
  tab,
}) => {
  const resend = getClient();
  if (!resend) return;

  const { data: admins, error } = await supabase
    .from("users")
    .select("email")
    .eq("role", "admin")
    .eq("email_notifications_enabled", true);

  if (error) throw new Error(`Could not load email notification recipients: ${error.message}`);
  if (!admins?.length) return;

  const reviewUrl = `${env.frontendUrl}/console?tab=${tab}`;
  const timestamp = formatAlertDate(submittedAt);
  const completeDetails = [...details, { label: "Submitted", value: timestamp }];
  const text = `${heading}\n\n${intro}\n\n${formatDetailsAsText(completeDetails)}\n\nReview in the admin console: ${reviewUrl}`;
  const html = renderEmail({
    preheader: subject,
    eyebrow: "Admin notification",
    heading,
    intro,
    details: completeDetails,
    action: { label: "Review in admin console", url: reviewUrl },
    footer: "You are receiving this notification because email alerts are enabled for your admin account.",
  });

  const results = await Promise.allSettled(
    admins.map((admin) =>
      resend.emails.send({
        from: env.resend.from,
        to: admin.email,
        subject: safeSubject(subject),
        text,
        html,
      }),
    ),
  );
  const failures = results.flatMap((result, index) => {
    if (result.status === "rejected") {
      return [`${admins[index].email}: ${result.reason?.message || "email provider error"}`];
    }
    if (result.value?.error) {
      return [`${admins[index].email}: ${result.value.error.message || "email provider error"}`];
    }
    return [];
  });
  if (failures.length) {
    throw new Error(`Could not send admin notification email(s): ${failures.join("; ")}`);
  }
};

export const notifyAdminsOfSubmission = (submission, creator) => {
  const creatorName = creator?.full_name || creator?.email || "Unknown user";
  const pluginName = submission.title || "Untitled plugin";
  return sendAdminAlert({
    subject: `Plugin submitted for review: ${pluginName}`,
    heading: "A new plugin is ready for review",
    intro: "A creator has submitted a plugin to CODEX AI. Review the details below.",
    details: [
      { label: "Plugin name", value: pluginName },
      { label: "Description", value: submission.description || "No description provided." },
      { label: "Category", value: submission.category || "Uncategorized" },
      { label: "Submitted by", value: creatorName },
    ],
    submittedAt: submission.created_at,
    tab: "submissions",
  });
};

export const notifyAdminsOfSuggestion = (suggestion, creator) => {
  const creatorName = creator?.full_name || creator?.email || suggestion.email || "Unknown user";
  return sendAdminAlert({
    subject: `New CODEX AI suggestion from ${creatorName}`,
    heading: "A new product suggestion was submitted",
    intro: "A community member shared an idea for CODEX AI.",
    details: [
      { label: "Suggestion", value: suggestion.idea || "No suggestion provided." },
      { label: "Submitted by", value: creatorName },
    ],
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
  const intro = approved
    ? `${greeting} Good news - your plugin has been approved and is now part of CODEX AI. Thank you for contributing to the community.`
    : `${greeting} Thank you for submitting your plugin. After review, it was not approved at this time.${rejectionReason ? " Please see the review note below." : ""}`;
  const details = [
    { label: "Plugin name", value: title },
    ...(!approved && rejectionReason
      ? [{ label: "Review note", value: rejectionReason }]
      : []),
  ];
  const text = `${heading}\n\n${intro}\n\n${formatDetailsAsText(details)}\n\nThe CODEX AI team`;
  const html = renderEmail({
    preheader: `${heading}: ${title}`,
    heading,
    intro,
    details,
    footer: "The CODEX AI team",
  });
  const { error } = await resend.emails.send({
    from: env.resend.from,
    to: email,
    subject: safeSubject(`${heading}: ${title}`),
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

  const heading = "Reset your CODEX AI password";
  const intro = "We received a request to reset the password for your CODEX AI account. Use the button below to choose a new password.";
  const expiry = "This link expires in 1 hour. If you did not request a password reset, you can ignore this email; your password will remain unchanged.";
  const html = renderEmail({
    preheader: "Use this secure link to reset your password.",
    heading,
    intro,
    action: { label: "Reset password", url: resetUrl },
    footer: expiry,
  });
  const text = `${heading}\n\n${intro}\n\nReset your password: ${resetUrl}\n\n${expiry}\n\nThe CODEX AI team`;
  const { error } = await resend.emails.send({
    from: env.resend.supportFrom,
    to: user.email,
    subject: heading,
    text,
    html,
  });
  if (error) {
    throw new Error(`Could not send password reset email to ${user.email}: ${error.message || "email provider error"}`);
  }
};
