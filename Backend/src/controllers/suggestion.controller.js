import { supabase } from "../config/supabase.js";
import { notifyAdminsOfSuggestion } from "../utils/mailer.js";
export const createSuggestion = async (req, res) => {
  const { email, idea } = req.body || {};
  if (!email?.trim() || !idea?.trim()) {
    return res
      .status(400)
      .json({ error: "Please share your email and your idea." });
  }
  const { data: suggestion, error } = await supabase
    .from("suggestions")
    .insert({ email: email.trim(), idea: idea.trim() })
    .select()
    .single();
  if (error) {
    console.error("createSuggestion failed", error);
    return res.status(500).json({ error: "Could not submit your suggestion." });
  }
  notifyAdminsOfSuggestion(suggestion).catch((err) =>
    console.error("notifyAdminsOfSuggestion failed", err),
  );
  res.status(201).json({ ok: true });
};
