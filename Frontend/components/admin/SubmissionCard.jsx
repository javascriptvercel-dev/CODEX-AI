"use client";

import { useState } from "react";
import { Check, X, FileDown, Pencil, Save } from "lucide-react";
import { api } from "@/lib/api";

export default function SubmissionCard({ submission, onApprove, onReject, onSaved }) {
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [showCode, setShowCode] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState("");

  const [title, setTitle] = useState(submission.title);
  const [description, setDescription] = useState(submission.description);
  const [code, setCode] = useState(submission.code);

  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message || "We could not complete that review action. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const saveAndApprove = () =>
    act(async () => {
      await api.saveAndApproveSubmission(submission.id, { title, description, code });
      setEditing(false);
      onSaved();
    });

  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          {editing ? (
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="focus-ring w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-bold outline-none"
            />
          ) : (
            <h4 className="font-display text-base font-bold">{submission.title}</h4>
          )}
          <p className="mt-1 text-xs text-muted">by {submission.authorName}</p>
        </div>
        <span className="flex-shrink-0 rounded-full border border-edge bg-surface2 px-2.5 py-1 text-[11px] text-muted">
          {new Date(submission.createdAt).toLocaleDateString()}
        </span>
      </div>

      {editing ? (
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="focus-ring mt-3 w-full resize-none rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm outline-none"
        />
      ) : (
        <p className="mt-3 text-sm text-muted">{submission.description}</p>
      )}

      {editing ? (
        <textarea
          rows={7}
          spellCheck={false}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          className="focus-ring mt-3 w-full resize-none rounded-lg bg-ink-950 px-3 py-2.5 font-mono text-xs text-azure-300 outline-none"
        />
      ) : (
        <>
          <button
            type="button"
            onClick={() => setShowCode((v) => !v)}
            className="focus-ring mt-3 rounded text-xs font-semibold text-azure-500 hover:underline"
          >
            {showCode ? "Hide code" : "View code"}
          </button>
          {showCode && (
            <pre className="mt-2 max-h-48 overflow-auto rounded-lg bg-ink-950 p-3 font-mono text-xs text-azure-300">{submission.code}</pre>
          )}
        </>
      )}

      {submission.fileUrl && (
        <a
          href={submission.fileUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="focus-ring mt-3 flex w-fit items-center rounded text-xs font-semibold text-azure-500 hover:underline"
        >
          <span className="inline-flex items-center gap-1.5">
            <FileDown size={13} />
            Download attachment
          </span>
        </a>
      )}

      {error && <p className="mt-3 text-xs text-red-400">{error}</p>}

      {submission.status === "pending" ? (
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          {!editing && (
            <input
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note for rejection"
              className="focus-ring min-w-0 flex-1 rounded-lg border border-edge bg-surface2 px-3 py-1.5 text-xs outline-none placeholder:text-muted/70"
            />
          )}
          <div className="flex flex-wrap gap-1.5">
            {editing ? (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(false)}
                  className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-1.5 text-xs font-semibold transition hover:border-azure-500/60 disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={saveAndApprove}
                  className="focus-ring flex items-center rounded-lg bg-azure-500 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-azure-600 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Save size={13} />
                    {busy ? "Saving…" : "Save & Approve"}
                  </span>
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => setEditing(true)}
                  className="focus-ring flex items-center rounded-lg border border-edge bg-surface2 px-3 py-1.5 text-xs font-semibold transition hover:border-azure-500/60 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Pencil size={13} />
                    Edit & approve
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act(() => onReject(submission.id, note))}
                  className="focus-ring flex items-center rounded-lg bg-red-500/15 px-3 py-1.5 text-xs font-semibold text-red-400 transition hover:bg-red-500/25 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <X size={13} />
                    Reject
                  </span>
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => act(() => onApprove(submission.id))}
                  className="focus-ring flex items-center rounded-lg bg-green-500/15 px-3 py-1.5 text-xs font-semibold text-green-400 transition hover:bg-green-500/25 disabled:opacity-60"
                >
                  <span className="inline-flex items-center gap-1.5">
                    <Check size={13} />
                    Approve as-is
                  </span>
                </button>
              </>
            )}
          </div>
        </div>
      ) : (
        <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-muted">{submission.status}</p>
      )}
    </div>
  );
}
