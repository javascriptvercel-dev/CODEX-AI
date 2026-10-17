"use client";

import { useState } from "react";
import { BookOpenCheck, Check, X } from "lucide-react";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";

export default function AssistantFaqDraftCard({ faq, onReviewed }) {
  const [question, setQuestion] = useState(faq.question);
  const [answer, setAnswer] = useState(faq.answer);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const review = async (status) => {
    setBusy(true);
    setError("");
    try {
      await api.reviewAssistantFaqDraft(faq.id, {
        status,
        question,
        answer,
      });
      await onReviewed();
      showToast(status === "approved" ? "FAQ draft approved." : "FAQ draft rejected.");
    } catch (err) {
      setError(err?.message || "Could not update this FAQ draft.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex items-center gap-2 text-xs text-muted">
        <BookOpenCheck size={14} className="text-azure-500" aria-hidden="true" />
        FAQ draft · {new Date(faq.createdAt).toLocaleDateString()}
      </div>
      <label className="mt-4 block text-xs font-semibold text-muted">
        FAQ question
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          maxLength={180}
          className="focus-ring mt-1.5 w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-normal text-fg"
        />
      </label>
      <label className="mt-3 block text-xs font-semibold text-muted">
        Suggested answer
        <textarea
          value={answer}
          onChange={(event) => setAnswer(event.target.value)}
          maxLength={1200}
          rows={4}
          className="focus-ring mt-1.5 w-full resize-y rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-normal leading-5 text-fg"
        />
      </label>
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => review("rejected")}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg border border-edge px-3 py-2 text-xs font-semibold text-muted transition hover:text-fg disabled:opacity-50"
        >
          <X size={14} aria-hidden="true" />
          Reject
        </button>
        <button
          type="button"
          disabled={busy || !question.trim() || !answer.trim()}
          onClick={() => review("approved")}
          className="focus-ring inline-flex items-center gap-1.5 rounded-lg bg-azure-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-azure-600 disabled:opacity-50"
        >
          <Check size={14} aria-hidden="true" />
          {busy ? "Saving…" : "Approve FAQ"}
        </button>
      </div>
    </article>
  );
}
