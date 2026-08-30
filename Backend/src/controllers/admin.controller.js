import { supabase } from "../config/supabase.js";
import { env } from "../config/env.js";

export const listSubmissions = async (req, res) => {
  const status = req.query.status || "pending";
  let query = supabase
    .from("plugin_submissions")
    .select(
      "public_id, title, description, code, file_path, category, status, admin_note, created_at, users(full_name, email)"
    )
    .order("created_at", { ascending: false });

  if (status !== "all") query = query.eq("status", status);

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
        fileUrl,
      };
    })
  );

  res.json({ submissions: withUrls });
};

export const approveSubmission = async (req, res) => {
  const { id } = req.params; // public_id
  const { data: submission, error: findError } = await supabase
    .from("plugin_submissions")
    .select("*, users(full_name, email)")
    .eq("public_id", id)
    .maybeSingle();

  if (findError) console.error("approveSubmission: lookup failed", findError);
  if (!submission) return res.status(404).json({ error: "Submission not found." });
  if (submission.status === "approved") return res.status(409).json({ error: "Already approved." });

  const authorName = submission.users?.full_name || submission.users?.email || "Unknown";

  const { error: insertError } = await supabase.from("plugins").insert({
    public_id: submission.public_id, // same id the submission had — start to finish
    submission_id: submission.id,
    name: submission.title,
    author_id: submission.user_id,
    author_name: authorName,
    description: submission.description,
    code: submission.code,
    category: submission.category,
  });

  if (insertError) {
    console.error("approveSubmission: publish failed", insertError);
    return res.status(500).json({ error: "Could not publish the plugin." });
  }

  await supabase.from("plugin_submissions").update({ status: "approved" }).eq("public_id", id);
  res.json({ ok: true, id: submission.public_id });
};

export const updateAndApproveSubmission = async (req, res) => {
  const { id } = req.params; // public_id
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
    .select("*, users(full_name, email)")
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
    public_id: submission.public_id, // same id the submission had — start to finish
    submission_id: submission.id,
    name: edited.title,
    author_id: submission.user_id,
    author_name: authorName,
    description: edited.description,
    code: edited.code,
    category: submission.category,
  });

  if (insertError) {
    console.error("updateAndApproveSubmission: publish failed", insertError);
    return res.status(500).json({ error: "Could not publish the plugin." });
  }

  await supabase.from("plugin_submissions").update({ status: "approved" }).eq("public_id", id);
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
  const { id } = req.params; // public_id
  const { note } = req.body || {};

  const { error } = await supabase
    .from("plugin_submissions")
    .update({ status: "rejected", admin_note: note || null })
    .eq("public_id", id);

  if (error) {
    console.error("rejectSubmission failed", error);
    return res.status(500).json({ error: "Could not reject the submission." });
  }
  res.json({ ok: true });
};
