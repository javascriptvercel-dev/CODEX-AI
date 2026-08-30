import { supabase } from "../config/supabase.js";
import { notifyAdminsOfSubmission } from "../utils/mailer.js";
import { generatePublicId } from "../utils/id.js";
import { env } from "../config/env.js";
const CATEGORIES = [
  "Utility",
  "Productivity",
  "Fun",
  "Moderation",
  "Integration",
  "AI",
];
const buildPluginUrl = (publicId) => `${env.frontendUrl}/plugins/${publicId}`;

const toPublicPlugin = (p) => {
  const url = buildPluginUrl(p.public_id);
  return {
    id: p.public_id,
    name: p.name,
    authorName: p.author_name,
    description: p.description,
    code: p.code,

    installCommand: `.install ${url}`,
    referenceUrl: url,
    category: p.category,
    publishedAt: p.published_at,
  };
};
export const listPlugins = async (req, res) => {
  const { q } = req.query;
  let query = supabase
    .from("plugins")
    .select("*")
    .order("created_at", { ascending: false });
  if (q && q.trim()) {
    const term = q.trim();
    query = query.or(`name.ilike.%${term}%,author_name.ilike.%${term}%`);
  }
  const { data, error } = await query;
  if (error) {
    console.error("listPlugins failed", error);
    return res.status(500).json({ error: "Could not load plugins." });
  }
  res.json({
    plugins: data.map((p) => {
      const { code, ...rest } = toPublicPlugin(p);
      return rest;
    }),
  });
};
export const getPluginById = async (req, res) => {
  const { data, error } = await supabase
    .from("plugins")
    .select("*")
    .eq("public_id", req.params.id)
    .maybeSingle();
  if (error) {
    console.error("getPluginById failed", error);
    return res.status(500).json({ error: "Could not load that plugin." });
  }
  if (!data) return res.status(404).json({ error: "Plugin not found." });
  res.json({ plugin: toPublicPlugin(data) });
};
export const submitPlugin = async (req, res) => {
  const { title, description, code, category } = req.body || {};
  const hasCode = typeof code === "string" ? code.trim().length > 0 : Boolean(code);
  const hasFile = Boolean(req.file);

  if (!title?.trim() || !description?.trim() || (!hasCode && !hasFile)) {
    return res.status(400).json({
      error: "Name, description, and either code or a file upload are required.",
    });
  }

  let filePath = null;
  if (req.file) {
    const path = `${req.user.id}/${Date.now()}-${req.file.originalname}`;
    const { error: uploadError } = await supabase.storage
      .from(env.pluginFilesBucket)
      .upload(path, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });
    if (uploadError) {
      console.error("submitPlugin: file upload failed", uploadError);
      return res.status(500).json({ error: "File upload failed." });
    }
    filePath = path;
  }

  const { data: submission, error } = await supabase
    .from("plugin_submissions")
    .insert({
      public_id: generatePublicId(),
      user_id: req.user.id,
      title: title.trim(),
      description: description.trim(),
      code: hasCode ? code : null,
      file_path: filePath,
      category: CATEGORIES.includes(category) ? category : "Utility",
    })
    .select()
    .single();
  if (error) {
    console.error("submitPlugin: insert failed", error);
    return res.status(500).json({ error: "Could not submit your plugin." });
  }
  notifyAdminsOfSubmission(submission).catch((err) =>
    console.error("notifyAdminsOfSubmission failed", err),
  );
  res
    .status(201)
    .json({
      submission: {
        id: submission.public_id,
        title: submission.title,
        status: submission.status,
      },
    });
};
export const mySubmissions = async (req, res) => {
  const { data, error } = await supabase
    .from("plugin_submissions")
    .select("public_id, title, status, admin_note, created_at")
    .eq("user_id", req.user.id)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("mySubmissions failed", error);
    return res.status(500).json({ error: "Could not load your submissions." });
  }
  res.json({
    submissions: data.map((s) => ({
      id: s.public_id,
      title: s.title,
      status: s.status,
      adminNote: s.admin_note,
      createdAt: s.created_at,
    })),
  });
};
