import { supabase } from "../config/supabase.js";

const PRIVATE_VALUE_PATTERN =
  /(?:SESSION_ID\s*[=:]|Bearer\s+[A-Za-z0-9._~+/-]{12,}|(?:sk|gsk|ghp|github_pat|xox[baprs])-[A-Za-z0-9_-]{12,}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,})/i;
const EMAIL_PATTERN = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;

function containsPrivateValue(value) {
  return PRIVATE_VALUE_PATTERN.test(value) || EMAIL_PATTERN.test(value);
}

function toFaq(row) {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    createdAt: row.created_at,
  };
}

export const listPublishedFaqs = async (_req, res) => {
  const { data, error } = await supabase
    .from("assistant_faqs")
    .select("id, question, answer, created_at")
    .eq("status", "approved")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("listPublishedFaqs failed", error);
    return res.status(500).json({ error: "Could not load additional FAQs." });
  }

  return res.json({ faqs: data.map(toFaq) });
};

export const createFaqDraft = async (req, res) => {
  const rawQuestion = req.body?.question;
  const rawAnswer = req.body?.answer;
  const question = typeof rawQuestion === "string" ? rawQuestion.trim() : "";
  const answer = typeof rawAnswer === "string" ? rawAnswer.trim() : "";
  if (
    typeof question !== "string" ||
    question.length < 10 ||
    question.length > 180 ||
    typeof answer !== "string" ||
    answer.length < 10 ||
    answer.length > 1200
  ) {
    return res.status(400).json({ error: "The FAQ draft is invalid." });
  }
  if (containsPrivateValue(question) || containsPrivateValue(answer)) {
    return res.status(400).json({ error: "The FAQ draft contains private information." });
  }

  const { data, error } = await supabase
    .from("assistant_faqs")
    .insert({ question, answer })
    .select("id")
    .single();
  if (error) {
    console.error("createFaqDraft failed", error);
    return res.status(500).json({ error: "Could not save the FAQ draft." });
  }
  return res.status(201).json({ id: data.id });
};

export const listFaqDrafts = async (_req, res) => {
  const { data, error } = await supabase
    .from("assistant_faqs")
    .select("id, question, answer, created_at")
    .eq("status", "pending")
    .order("created_at", { ascending: true })
    .limit(100);

  if (error) {
    console.error("listFaqDrafts failed", error);
    return res.status(500).json({ error: "Could not load FAQ drafts." });
  }
  return res.json({ faqs: data.map(toFaq) });
};

export const reviewFaqDraft = async (req, res) => {
  const { id } = req.params;
  const body = req.body || {};
  const { status } = body;
  if (!["approved", "rejected"].includes(status)) {
    return res.status(400).json({ error: "Choose approve or reject." });
  }

  const rawQuestion = body.question;
  const rawAnswer = body.answer;
  const question = typeof rawQuestion === "string" ? rawQuestion.trim() : "";
  const answer = typeof rawAnswer === "string" ? rawAnswer.trim() : "";
  if (
    status === "approved" &&
    (question.length < 10 ||
      question.length > 180 ||
      answer.length < 10 ||
      answer.length > 1200 ||
      containsPrivateValue(question) ||
      containsPrivateValue(answer))
  ) {
    return res.status(400).json({ error: "Review and remove private information before approving." });
  }

  const update = {
    status,
    reviewed_at: new Date().toISOString(),
    reviewed_by: req.user.id,
    updated_at: new Date().toISOString(),
  };
  if (status === "approved") {
    update.question = question;
    update.answer = answer;
  }

  const { data, error } = await supabase
    .from("assistant_faqs")
    .update(update)
    .eq("id", id)
    .eq("status", "pending")
    .select("id")
    .maybeSingle();

  if (error) {
    console.error("reviewFaqDraft failed", error);
    return res.status(500).json({ error: "Could not review the FAQ draft." });
  }
  if (!data) return res.status(404).json({ error: "FAQ draft not found." });
  return res.json({ ok: true });
};
