"use client";

import { useMemo, useState, useEffect } from "react";
import {
  Check,
  X,
  FileDown,
  Pencil,
  Save,
  Copy,
  CalendarDays,
  User,
  AlertCircle,
  Clock,
} from "lucide-react";
import { api } from "@/lib/api";
import VerifiedBadge from "@/components/ui/VerifiedBadge";

function SubmissionStatusBadge({ status }) {
  const isApproved = status === "approved";
  const isRejected = status === "rejected";
  const Icon = isApproved ? Check : isRejected ? X : Clock;
  const label = status || "pending";
  const colorClasses = isApproved
    ? "border-emerald-400/25 bg-gradient-to-r from-emerald-500/15 via-emerald-400/10 to-teal-400/15 text-emerald-300 shadow-sm shadow-emerald-500/10"
    : isRejected
      ? "border-rose-400/25 bg-gradient-to-r from-rose-500/15 via-rose-400/10 to-pink-400/15 text-rose-300 shadow-sm shadow-rose-500/10"
      : "border-amber-400/25 bg-gradient-to-r from-amber-500/15 via-amber-400/10 to-orange-400/15 text-amber-300 shadow-sm shadow-amber-500/10";

  return (
    <span
      className={`inline-flex flex-shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${colorClasses}`}
    >
      <Icon size={12} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export default function SubmissionCard({ submission, onApprove, onReject, onSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Rejection modal state
  const [showRejectPrompt, setShowRejectPrompt] = useState(false);
  const [rejectionNote, setRejectionNote] = useState("");

  // Editable fields
  const [title, setTitle] = useState(submission.title || "");
  const [description, setDescription] = useState(submission.description || "");
  const [code, setCode] = useState(submission.code || "");

  // Reset editable state if submission prop updates
  useEffect(() => {
    setTitle(submission.title || "");
    setDescription(submission.description || "");
    setCode(submission.code || "");
  }, [submission]);

  // Split code into lines for syntax display
  const codeLines = useMemo(() => String(code || "").split("\n"), [code]);

  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message || "Failed to complete this action. Please try again.");
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const handleSaveAndApprove = () =>
    act(async () => {
      await api.saveAndApproveSubmission(submission.id, { title, description, code });
      setEditing(false);
      setIsOpen(false);
      if (onSaved) onSaved();
    });

  const handleApproveAsIs = () =>
    act(async () => {
      await onApprove(submission.id);
      setIsOpen(false);
    });

  const handleConfirmReject = () =>
    act(async () => {
      await onReject(submission.id, rejectionNote);
      setShowRejectPrompt(false);
      setIsOpen(false);
    });

  // Handle Tab key indentation in textarea
  const handleCodeKeyDown = (e) => {
    if (e.key === "Tab") {
      e.preventDefault();
      const start = e.target.selectionStart;
      const end = e.target.selectionEnd;
      setCode(code.substring(0, start) + "  " + code.substring(end));
      setTimeout(() => {
        e.target.selectionStart = e.target.selectionEnd = start + 2;
      }, 0);
    }
  };

  return (
    <>
      {/* --- 1. SHORT CARD (List View) --- */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
        className="focus-ring group flex cursor-pointer flex-col justify-between rounded-xl border border-edge bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-azure-500/40 hover:bg-surface2 hover:shadow-lg"
      >
        <div>
          <div className="flex items-start justify-between gap-3">
            <h3 className="min-w-0 font-display text-lg font-bold leading-snug text-fg group-hover:text-azure-400 [overflow-wrap:anywhere]">
              {submission.title || "Untitled Plugin"}
            </h3>
            <SubmissionStatusBadge status={submission.status} />
          </div>

          <p className="mt-2 line-clamp-2 text-sm leading-6 text-muted [overflow-wrap:anywhere]">
            {submission.description || "No description provided."}
          </p>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-edge/60 pt-3 text-xs text-muted">
          <span className="flex items-center gap-1.5">
            <User size={13} />
            <span className="max-w-[140px] truncate">
              by {submission.authorName || "Unknown author"}
            </span>
            {submission.authorIsAdmin && <VerifiedBadge size={12} />}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {submission.createdAt
              ? new Date(submission.createdAt).toLocaleDateString()
              : "—"}
          </span>
        </div>
      </div>

      {/* --- 2. FULL VIEW MODAL / DETAIL DRAWER --- */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 sm:p-6 backdrop-blur-sm animate-in fade-in duration-200">
          <div
            className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl"
            role="dialog"
            aria-modal="true"
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-edge px-6 py-4 bg-surface2/50">
              <div className="flex items-center gap-3">
                <SubmissionStatusBadge status={submission.status} />
                <span className="text-xs text-muted">ID: {submission.id}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setEditing(false);
                  setShowRejectPrompt(false);
                }}
                className="rounded-lg p-1.5 text-muted hover:bg-surface2 hover:text-fg transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
              {error && (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400 flex items-center gap-2">
                  <AlertCircle size={16} />
                  <span>{error}</span>
                </div>
              )}

              {/* Submitter & Date Info */}
              <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-edge bg-surface2 p-4">
                <div className="flex items-center gap-2">
                  <User size={16} className="text-azure-400" />
                  <span className="text-sm font-medium">Submitted by:</span>
                  <span className="text-sm font-bold text-fg">
                    {submission.authorName || "Unknown"}
                  </span>
                  {submission.authorIsAdmin && <VerifiedBadge size={13} />}
                </div>
                <div className="flex items-center gap-2 text-xs text-muted">
                  <CalendarDays size={14} />
                  <span>
                    {submission.createdAt
                      ? new Date(submission.createdAt).toLocaleString()
                      : "—"}
                  </span>
                </div>
              </div>

              {/* Title & Description Form */}
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Plugin Title
                  </label>
                  {editing ? (
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      className="mt-1.5 w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-semibold outline-none focus:border-azure-500"
                    />
                  ) : (
                    <h2 className="mt-1 text-2xl font-bold font-display text-fg">
                      {title}
                    </h2>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Description
                  </label>
                  {editing ? (
                    <textarea
                      rows={3}
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      className="mt-1.5 w-full resize-none rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm outline-none focus:border-azure-500"
                    />
                  ) : (
                    <p className="mt-1 whitespace-pre-wrap text-sm text-muted leading-relaxed">
                      {description || "No description provided."}
                    </p>
                  )}
                </div>

                {submission.fileUrl && (
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                      Uploaded Attachment
                    </label>
                    <a
                      href={submission.fileUrl}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="mt-1.5 inline-flex items-center gap-2 rounded-lg border border-edge bg-surface2 px-3 py-2 text-xs font-semibold text-azure-400 hover:border-azure-500/60"
                    >
                      <FileDown size={14} />
                      Download plugin attachment
                    </a>
                  </div>
                )}
              </div>

              {/* Code Viewer / Editor */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                    Plugin Code {editing && "(Tab to indent)"}
                  </label>
                  {!editing && code && (
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="inline-flex items-center gap-1.5 text-xs text-azure-400 hover:text-azure-300 font-medium"
                    >
                      {copied ? (
                        <>
                          <Check size={13} className="text-green-400" /> Copied!
                        </>
                      ) : (
                        <>
                          <Copy size={13} /> Copy code
                        </>
                      )}
                    </button>
                  )}
                </div>

                {editing ? (
                  <textarea
                    rows={16}
                    spellCheck={false}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={handleCodeKeyDown}
                    className="w-full resize-y rounded-xl bg-ink-950 p-4 font-mono text-xs leading-5 text-azure-300 outline-none border border-edge focus:border-azure-500"
                  />
                ) : (
                  <div className="overflow-hidden rounded-xl border border-edge bg-ink-950">
                    <pre className="max-h-[50vh] overflow-auto p-4 font-mono text-xs leading-5 text-azure-300">
                      {codeLines.map((line, index) => (
                        <div key={index} className="flex min-w-max">
                          <span className="mr-4 inline-block w-8 select-none text-right text-slate-500">
                            {index + 1}
                          </span>
                          <code>{line || " "}</code>
                        </div>
                      ))}
                    </pre>
                  </div>
                )}
              </div>

              {/* Rejection Prompt (Inline Dialog) */}
              {showRejectPrompt && (
                <div className="rounded-xl border border-red-500/30 bg-red-500/5 p-4 space-y-3 animate-in fade-in">
                  <h4 className="text-sm font-semibold text-red-400">
                    Provide reason for rejection
                  </h4>
                  <input
                    type="text"
                    value={rejectionNote}
                    onChange={(e) => setRejectionNote(e.target.value)}
                    placeholder="e.g. Missing dependencies or broken syntax"
                    className="w-full rounded-lg border border-edge bg-surface px-3 py-2 text-sm outline-none focus:border-red-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowRejectPrompt(false)}
                      className="rounded-lg border border-edge px-3 py-1.5 text-xs font-semibold hover:bg-surface2"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={handleConfirmReject}
                      className="rounded-lg bg-red-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
                    >
                      {busy ? "Rejecting…" : "Confirm Rejection"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions Footer */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge bg-surface2/50 px-6 py-4">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setEditing(false);
                  setShowRejectPrompt(false);
                }}
                className="rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold hover:bg-surface2 transition"
              >
                Close View
              </button>

              {submission.status === "pending" && !showRejectPrompt && (
                <div className="flex flex-wrap items-center gap-2">
                  {editing ? (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditing(false)}
                        className="rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold hover:bg-surface2"
                      >
                        Cancel Edit
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleSaveAndApprove}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-azure-500 px-4 py-2 text-xs font-semibold text-white hover:bg-azure-600 disabled:opacity-60 transition"
                      >
                        <Save size={14} />
                        {busy ? "Saving…" : "Save & Approve"}
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setEditing(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold hover:border-azure-500/50 transition"
                      >
                        <Pencil size={14} />
                        Edit Submission
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={() => setShowRejectPrompt(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/25 transition"
                      >
                        <X size={14} />
                        Reject
                      </button>
                      <button
                        type="button"
                        disabled={busy}
                        onClick={handleApproveAsIs}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-4 py-2 text-xs font-semibold text-green-400 hover:bg-green-500/25 transition"
                      >
                        <Check size={14} />
                        Approve as-is
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
