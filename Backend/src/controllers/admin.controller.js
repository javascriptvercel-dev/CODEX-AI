import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";
import { notifyPluginCreatorOfDecision } from "../utils/mailer.js";

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const userSearchPattern = /^[\p{L}\p{N}@.+\- ']+$/u;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const adminUserFields = "id, email, full_name, role, created_at";

export const listUsers = async (req, res) => {
  const page = Number.parseInt(req.query.page, 10) || 1;
  const pageSize = 25;
  const search = typeof req.query.q === "string" ? req.query.q.trim() : "";
  if (page < 1 || search.length > 100 || (search && !userSearchPattern.test(search))) {
    return res.status(400).json({ error: "Invalid user-list filter." });
  }

  const fields = env.premiumFeaturesEnabled
    ? `${adminUserFields}, premium_until`
    : adminUserFields;
  let query = supabase
    .from("users")
    .select(fields, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * pageSize, page * pageSize - 1);
  if (search) {
    const escapedSearch = search.replace(/[%_]/g, "");
    query = query.or(
      `email.ilike.%${escapedSearch}%,full_name.ilike.%${escapedSearch}%`,
    );
  }

  const { data, error, count } = await query;
  if (error) {
    console.error("listUsers failed", error);
    return res.status(500).json({ error: "Could not load users." });
  }
  return res.json({
    users: data.map((user) => ({
      id: user.id,
      email: user.email,
      fullName: user.full_name,
      role: user.role,
      createdAt: user.created_at,
      premiumUntil: user.premium_until || null,
      isPremium: Boolean(user.premium_until && Date.parse(user.premium_until) > Date.now()),
    })),
    page,
    pageSize,
    total: count || 0,
    premiumEnabled: env.premiumFeaturesEnabled,
  });
};

export const updateUser = async (req, res) => {
  if (!uuidPattern.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }

  const { fullName, email, isPremium, premiumUntil } = req.body || {};
  if (
    typeof fullName !== "string" ||
    !fullName.trim() ||
    fullName.trim().length > 100
  ) {
    return res.status(400).json({ error: "Enter a name between 1 and 100 characters." });
  }
  const normalizedEmail = typeof email === "string" ? email.trim().toLowerCase() : "";
  if (!emailPattern.test(normalizedEmail) || normalizedEmail.length > 254) {
    return res.status(400).json({ error: "Enter a valid email address." });
  }
  if (env.premiumFeaturesEnabled && typeof isPremium !== "boolean") {
    return res.status(400).json({ error: "Choose whether this account is Free or Premium." });
  }

  const changes = {
    full_name: fullName.trim(),
    email: normalizedEmail,
  };
  if (env.premiumFeaturesEnabled) {
    if (
      isPremium &&
      (typeof premiumUntil !== "string" ||
        premiumUntil.length > 40 ||
        Number.isNaN(Date.parse(premiumUntil)) ||
        Date.parse(premiumUntil) <= Date.now())
    ) {
      return res.status(400).json({ error: "Choose a future Premium expiry date." });
    }
    changes.premium_until = isPremium ? new Date(premiumUntil).toISOString() : null;
  }

  const { data, error } = await supabase
    .from("users")
    .update(changes)
    .eq("id", req.params.id)
    .select(env.premiumFeaturesEnabled
      ? "id, email, full_name, premium_until"
      : "id, email, full_name")
    .maybeSingle();
  if (error) {
    if (error.code === "23505") {
      return res.status(409).json({ error: "An account with that email already exists." });
    }
    console.error("updateUser failed", error);
    return res.status(500).json({ error: "Could not update this account." });
  }
  if (!data) return res.status(404).json({ error: "User not found." });
  return res.json({
    id: data.id,
    email: data.email,
    fullName: data.full_name,
    premiumUntil: data.premium_until,
    isPremium: Boolean(data.premium_until && Date.parse(data.premium_until) > Date.now()),
  });
};

export const deleteUser = async (req, res) => {
  if (!uuidPattern.test(req.params.id)) {
    return res.status(400).json({ error: "Invalid user ID." });
  }
  if (req.params.id === req.user.id) {
    return res.status(400).json({ error: "You cannot delete your own administrator account." });
  }

  const { data: target, error: lookupError } = await supabase
    .from("users")
    .select("id, email, role")
    .eq("id", req.params.id)
    .maybeSingle();
  if (lookupError) {
    console.error("deleteUser lookup failed", lookupError);
    return res.status(500).json({ error: "Could not load that user." });
  }
  if (!target) return res.status(404).json({ error: "User not found." });
  if (target.role === "admin") {
    return res.status(403).json({ error: "Administrator accounts cannot be deleted here." });
  }

  const { data: submissions, error: submissionsError } = await supabase
    .from("plugin_submissions")
    .select("file_path")
    .eq("user_id", target.id)
    .not("file_path", "is", null);
  if (submissionsError) {
    console.error("deleteUser submission lookup failed", submissionsError);
    return res.status(500).json({ error: "Could not prepare this account for deletion." });
  }

  const { data: deletedUser, error: deleteError } = await supabase
    .from("users")
    .delete()
    .eq("id", target.id)
    .select("id")
    .maybeSingle();
  if (deleteError) {
    console.error("deleteUser failed", deleteError);
    return res.status(500).json({ error: "Could not delete this account." });
  }
  if (!deletedUser) return res.status(404).json({ error: "User not found." });

  const filePaths = (submissions || []).map((submission) => submission.file_path);
  if (filePaths.length) {
    const { error: storageError } = await supabase.storage
      .from(env.pluginFilesBucket)
      .remove(filePaths);
    if (storageError) {
      console.error("deleteUser plugin-file cleanup failed", storageError);
      return res.json({
        ok: true,
        cleanupWarning: "The account was deleted, but some uploaded plugin files could not be removed.",
      });
    }
  }
  return res.json({ ok: true });
};

export const listSubmissions = async (req, res) => {
  const status = req.query.status || "pending";
  const reviewedByMe = req.query.reviewedBy === "me";
  if (req.query.reviewedBy && !reviewedByMe) {
    return res.status(400).json({ error: "Invalid reviewer filter." });
  }
  if (reviewedByMe && !["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Reviewer filter requires a reviewed status." });
  }

  let query = supabase
    .from("plugin_submissions")
    .select(
      "public_id, title, description, code, file_path, category, status, admin_note, created_at, users!plugin_submissions_user_id_fkey(id, full_name, email, role)"
    )
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);
  if (reviewedByMe) query = query.eq("reviewed_by", req.user.id);

  const { data, error } = await query;
  if (error) {
    console.error("listSubmissions failed", error);
    return res.status(500).json({ error: "Could not load submissions." });
  }

  const withUrls = await Promise.all(
    data.map(async (submission) => {
      let fileUrl = null;
      if (submission.file_path) {
        const { data: signed } = await supabase.storage
          .from(env.pluginFilesBucket)
          .createSignedUrl(submission.file_path, 60 * 10);
        fileUrl = signed?.signedUrl || null;
      }
      return {
        id: submission.public_id,
        title: submission.title,
        description: submission.description,
        code: submission.code,
        status: submission.status,
        adminNote: submission.admin_note,
        createdAt: submission.created_at,
        authorName: submission.users?.full_name || submission.users?.email || "Unknown",
        authorId: submission.users?.id || null,
        authorIsAdmin: submission.users?.role === "admin",
        fileUrl,
      };
    })
  );

  res.json({ submissions: withUrls });
};

export const approveSubmission = async (req, res) => {
  const { id } = req.params;
  const { data: submission, error: findError } = await supabase
    .from("plugin_submissions")
    .select("*, users!plugin_submissions_user_id_fkey(full_name, email, role)")
    .eq("public_id", id)
    .maybeSingle();

  if (findError) console.error("approveSubmission: lookup failed", findError);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  if (submission.status === "approved") return res.status(409).json({ error: "Already approved." });

  const authorName = submission.users?.full_name || submission.users?.email || "Unknown";

  const { error: insertError } = await supabase.from("plugins").insert({
    public_id: submission.public_id,
    submission_id: submission.id,
    name: submission.title,
    author_id: submission.user_id,
    author_name: authorName,
    description: submission.description,
    code: submission.code || null,
    category: submission.category,
  });

  if (insertError) {
    console.error("approveSubmission: publish failed", insertError);
    return res.status(500).json({ error: "Could not publish the plugin." });
  }

  const { error: statusError } = await supabase
    .from("plugin_submissions")
    .update({
      status: "approved",
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("public_id", id);
  if (statusError) {
    console.error("approveSubmission: status update failed", statusError);
    return res.status(500).json({ error: "Could not update the submission status." });
  }
  notifyPluginCreatorOfDecision(submission, "approved").catch((err) =>
    console.error("approveSubmission: notification failed", err),
  );
  res.json({ ok: true, id: submission.public_id });
};

export const updateAndApproveSubmission = async (req, res) => {
  const { id } = req.params;
  const { title, description, code } = req.body || {};
  const hasCode = typeof code === "string" ? code.trim().length > 0 : Boolean(code);
  const hasFile = Boolean(req.files?.length) || Boolean(req.file) || Boolean(req.body?.file_path);

  if (!title?.trim() || !description?.trim() || (!hasCode && !hasFile)) {
    return res.status(400).json({
      error: "Name, description, and either code or an attached file are required.",
    });
  }

  const { data: submission, error: findError } = await supabase
    .from("plugin_submissions")
    .select("*, users!plugin_submissions_user_id_fkey(full_name, email, role)")
    .eq("public_id", id)
    .maybeSingle();

  if (findError) console.error("updateAndApproveSubmission: lookup failed", findError);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  if (submission.status === "approved") return res.status(409).json({ error: "Already approved." });

  const authorName = submission.users?.full_name || submission.users?.email || "Unknown";
  const edited = { title: title.trim(), description: description.trim(), code: hasCode ? code : null };

  const { error: updateError } = await supabase
    .from("plugin_submissions")
    .update({ title: edited.title, description: edited.description, code: edited.code })
    .eq("public_id", id);

  if (updateError) {
    console.error("updateAndApproveSubmission: update failed", updateError);
    return res.status(500).json({ error: "Could not save your changes." });
  }

  const { error: insertError } = await supabase.from("plugins").insert({
    public_id: submission.public_id,
    submission_id: submission.id,
    name: edited.title,
    author_id: submission.user_id,
    author_name: authorName,
    description: edited.description,
    code: edited.code || null,
    category: submission.category,
  });

  if (insertError) {
    console.error("updateAndApproveSubmission: publish failed", insertError);
    return res.status(500).json({ error: "Could not publish the plugin." });
  }

  const { error: statusError } = await supabase
    .from("plugin_submissions")
    .update({
      status: "approved",
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("public_id", id);
  if (statusError) {
    console.error("updateAndApproveSubmission: status update failed", statusError);
    return res.status(500).json({ error: "Could not update the submission status." });
  }
  notifyPluginCreatorOfDecision(
    { ...submission, title: edited.title },
    "approved",
  ).catch((err) =>
    console.error("updateAndApproveSubmission: notification failed", err),
  );
  res.json({ ok: true, id: submission.public_id });
};

export const listSuggestions = async (req, res) => {
  const { data, error } = await supabase
    .from("suggestions")
    .select("id, email, idea, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("listSuggestions failed", error);
    return res.status(500).json({ error: "Could not load suggestions." });
  }

  res.json({ suggestions: data.map((s) => ({ id: s.id, email: s.email, idea: s.idea, createdAt: s.created_at })) });
};

export const rejectSubmission = async (req, res) => {
  const { id } = req.params;
  const { note } = req.body || {};

  const { data: submission, error: findError } = await supabase
    .from("plugin_submissions")
    .select("*, users!plugin_submissions_user_id_fkey(full_name, email, role)")
    .eq("public_id", id)
    .maybeSingle();

  if (findError) {
    console.error("rejectSubmission: lookup failed", findError);
    return res.status(500).json({ error: "Could not load the submission." });
  }
  if (!submission) return res.status(404).json({ error: "Submission not found." });

  const { error } = await supabase
    .from("plugin_submissions")
    .update({
      status: "rejected",
      admin_note: note || null,
      reviewed_by: req.user.id,
      reviewed_at: new Date().toISOString(),
    })
    .eq("public_id", id);

  if (error) {
    console.error("rejectSubmission failed", error);
    return res.status(500).json({ error: "Could not reject the submission." });
  }
  notifyPluginCreatorOfDecision(submission, "rejected", note).catch((err) =>
    console.error("rejectSubmission: notification failed", err),
  );
  res.json({ ok: true });
};