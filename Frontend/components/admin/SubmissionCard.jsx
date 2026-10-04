"use client";

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
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
  ShieldCheck,
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

// Small centred dialog layered above the full view (used for approve / reject confirmations).
function PromptDialog({ tone = "green", icon, title, children, onClose }) {
  const ring = tone === "red" ? "border-red-500/30" : "border-emerald-500/30";
  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center overflow-y-auto bg-black/60 p-4 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="alertdialog"
        aria-modal="true"
        className={`animate-rise w-full max-w-md rounded-2xl border ${ring} bg-surface p-5 shadow-2xl sm:p-6`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2.5">
          {icon}
          <h3 className="font-display text-lg font-bold leading-tight">{title}</h3>
        </div>
        {children}
      </div>
    </div>
  );
}

export default function SubmissionCard({ submission, onApprove, onReject, onSaved }) {
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  // Second-step prompts
  const [confirmApprove, setConfirmApprove] = useState(null); // null | "asis" | "edited"
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

  const codeLines = useMemo(() => String(code || "").split("\n"), [code]);
  const isPending = (submission.status || "pending") === "pending";

  const closeAll = () => {
    setIsOpen(false);
    setEditing(false);
    setShowRejectPrompt(false);
    setConfirmApprove(null);
    setError("");
  };

  // Lock page scroll while the full view is open + Escape handling
  useEffect(() => {
    if (!isOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (e) => {
      if (e.key !== "Escape" || busy) return;
      e.preventDefault();
      if (confirmApprove) setConfirmApprove(null);
      else if (showRejectPrompt) setShowRejectPrompt(false);
      else closeAll();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, busy, confirmApprove, showRejectPrompt]);

  const act = async (fn) => {
    setBusy(true);
    setError("");
    try {
      await fn();
      return true;
    } catch (err) {
      setError(err?.message || "Failed to complete this action. Please try again.");
      return false;
    } finally {
      setBusy(false);
    }
  };

  const handleCopyCode = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const handleConfirmApprove = async () => {
    const mode = confirmApprove;
    const ok = await act(async () => {
      if (mode === "edited") {
        await api.saveAndApproveSubmission(submission.id, { title, description, code });
        if (onSaved) await onSaved();
      } else {
        await onApprove(submission.id);
      }
    });
    setConfirmApprove(null);
    if (ok) closeAll();
  };

  const handleConfirmReject = async () => {
    const ok = await act(async () => {
      await onReject(submission.id, rejectionNote);
    });
    setShowRejectPrompt(false);
    if (ok) closeAll();
  };

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

  const fullView = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) closeAll();
      }}
    >
      <div
        className="relative flex max-h-[94dvh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-edge bg-surface shadow-2xl"
        role="dialog"
        aria-modal="true"
        aria-label={`Submission: ${submission.title || "Untitled plugin"}`}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-edge bg-surface2/50 px-4 py-3 sm:px-6 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <SubmissionStatusBadge status={submission.status} />
            <span className="truncate text-xs text-muted">ID: {submission.id}</span>
          </div>
          <button
            type="button"
            onClick={closeAll}
            disabled={busy}
            aria-label="Close"
            className="focus-ring grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg disabled:opacity-50"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain p-5 sm:p-8">
          {error && (
            <div className="mb-6 flex items-start gap-2 rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-400">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Title + meta */}
          <div className="min-w-0">
            {editing ? (
              <>
                <label className="text-xs font-semibold uppercase tracking-wider text-muted">
                  Plugin Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1.5 w-full rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-base font-semibold outline-none focus:border-azure-500"
                />
              </>
            ) : (
              <h2 className="break-words font-display text-3xl font-bold leading-tight tracking-[-0.025em] sm:text-4xl">
                {title || "Untitled plugin"}
              </h2>
            )}
            <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
              <span className="inline-flex min-w-0 items-center gap-1.5">
                <User size={15} />
                <span className="truncate">by {submission.authorName || "Unknown author"}</span>
                {submission.authorIsAdmin && <VerifiedBadge size={14} />}
              </span>
              <span aria-hidden="true">•</span>
              <span className="inline-flex items-center gap-1.5">
                <CalendarDays size={15} />
                {submission.createdAt ? new Date(submission.createdAt).toLocaleString() : "—"}
              </span>
            </div>
          </div>

          {submission.status === "rejected" && submission.adminNote && (
            <div className="mt-6 rounded-xl border border-rose-500/25 bg-rose-500/5 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-rose-300">
                Rejection reason
              </p>
              <p className="mt-1.5 whitespace-pre-wrap text-sm leading-6 text-muted">
                {submission.adminNote}
              </p>
            </div>
          )}

          {/* Description */}
          <section className="mt-8 border-t border-edge pt-7">
            <h3 className="font-display text-xl font-bold">Description</h3>
            {editing ? (
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-3 w-full resize-y rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm leading-6 outline-none focus:border-azure-500"
              />
            ) : (
              <p className="mt-3 max-w-4xl whitespace-pre-wrap text-base leading-7 text-muted sm:text-lg sm:leading-8">
                {description || "No description was provided for this plugin."}
              </p>
            )}

            {submission.fileUrl && (
              <a
                href={submission.fileUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="focus-ring mt-4 inline-flex items-center gap-2 rounded-lg border border-edge bg-surface2 px-3.5 py-2.5 text-xs font-semibold text-azure-400 transition hover:border-azure-500/60 sm:text-sm"
              >
                <FileDown size={15} />
                Download plugin attachment
              </a>
            )}
          </section>

          {/* Plugin Code — same viewer as the public plugin page */}
          <section className="mt-8 border-t border-edge pt-7">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-display text-xl font-bold">
                Plugin Code{editing && <span className="ml-2 text-xs font-normal text-muted">(Tab to indent)</span>}
              </h3>
              <div className="flex items-center gap-3">
                {code && !editing && (
                  <span className="inline-flex items-center gap-1.5 text-xs text-muted sm:text-sm">
                    <User size={14} /> {submission.authorName || "Plugin author"}
                    {submission.authorIsAdmin && <VerifiedBadge size={12} />}
                  </span>
                )}
                {!editing && code && (
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="focus-ring inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-edge bg-surface2 px-3 text-xs font-semibold transition hover:border-azure-500/60"
                  >
                    {copied ? <Check size={14} className="text-green-400" /> : <Copy size={14} />}
                    <span>{copied ? "Copied" : "Copy code"}</span>
                  </button>
                )}
              </div>
            </div>

            {editing ? (
              <textarea
                rows={18}
                spellCheck={false}
                value={code}
                onChange={(e) => setCode(e.target.value)}
                onKeyDown={handleCodeKeyDown}
                className="w-full resize-y rounded-xl border border-edge bg-ink-950 p-4 font-mono text-[12px] leading-6 text-azure-300 outline-none focus:border-azure-500 sm:p-5 sm:text-[13px]"
              />
            ) : code ? (
              <div className="overflow-hidden rounded-xl border border-edge bg-ink-950">
                <pre className="max-h-[60vh] overflow-auto p-4 font-mono text-[12px] leading-6 text-azure-300 sm:p-5 sm:text-[13px]">
                  {codeLines.map((line, index) => (
                    <div key={index} className="flex min-w-max">
                      <span className="mr-5 inline-block w-8 select-none text-right text-slate-500">
                        {index + 1}
                      </span>
                      <code>{line || " "}</code>
                    </div>
                  ))}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-edge bg-surface2 px-5 py-12 text-center text-sm text-muted">
                {submission.fileUrl
                  ? "No inline code was submitted. Use the attachment above to review the plugin file."
                  : "Plugin source code is not available for this submission."}
              </div>
            )}
          </section>
        </div>

        {/* Footer actions */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-edge bg-surface2/50 px-4 py-3 sm:px-6 sm:py-4">
          <button
            type="button"
            onClick={closeAll}
            disabled={busy}
            className="rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold transition hover:bg-surface2 disabled:opacity-60"
          >
            Close View
          </button>

          {isPending && (
            <div className="flex flex-wrap items-center gap-2">
              {editing ? (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => {
                      setEditing(false);
                      setTitle(submission.title || "");
                      setDescription(submission.description || "");
                      setCode(submission.code || "");
                    }}
                    className="rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold hover:bg-surface2"
                  >
                    Cancel Edit
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmApprove("edited")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-azure-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-azure-600 disabled:opacity-60"
                  >
                    <Save size={14} />
                    Save & Approve
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setEditing(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-edge bg-surface px-4 py-2 text-xs font-semibold transition hover:border-azure-500/50"
                  >
                    <Pencil size={14} />
                    Edit Submission
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowRejectPrompt(true)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/15 px-4 py-2 text-xs font-semibold text-red-400 transition hover:bg-red-500/25"
                  >
                    <X size={14} />
                    Reject
                  </button>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setConfirmApprove("asis")}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-green-500/15 px-4 py-2 text-xs font-semibold text-green-400 transition hover:bg-green-500/25"
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

      {/* Second confirmation: approve */}
      {confirmApprove && (
        <PromptDialog
          tone="green"
          icon={<ShieldCheck size={20} className="flex-shrink-0 text-emerald-400" />}
          title="Approve this plugin?"
          onClose={() => !busy && setConfirmApprove(null)}
        >
          <p className="mt-3 text-sm leading-6 text-muted">
            <span className="font-semibold text-fg">{title || "Untitled plugin"}</span> will be
            published to the plugin library right away
            {confirmApprove === "edited" ? ", including your edits" : ""}. Please confirm you have
            reviewed the code.
          </p>
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setConfirmApprove(null)}
              className="rounded-lg border border-edge px-4 py-2 text-xs font-semibold hover:bg-surface2 disabled:opacity-60"
            >
              Go back
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirmApprove}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500 px-4 py-2 text-xs font-semibold text-white hover:bg-emerald-600 disabled:opacity-60"
            >
              <Check size={14} />
              {busy ? "Approving…" : "Yes, approve"}
            </button>
          </div>
        </PromptDialog>
      )}

      {/* Reject reason */}
      {showRejectPrompt && (
        <PromptDialog
          tone="red"
          icon={<X size={20} className="flex-shrink-0 text-red-400" />}
          title="Reject this submission?"
          onClose={() => !busy && setShowRejectPrompt(false)}
        >
          <input
            type="text"
            autoFocus
            value={rejectionNote}
            onChange={(e) => setRejectionNote(e.target.value)}
            placeholder="Reason, e.g. Missing dependencies or broken syntax"
            className="mt-4 w-full rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm outline-none focus:border-red-500"
          />
          <div className="mt-5 flex justify-end gap-2">
            <button
              type="button"
              disabled={busy}
              onClick={() => setShowRejectPrompt(false)}
              className="rounded-lg border border-edge px-4 py-2 text-xs font-semibold hover:bg-surface2 disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={handleConfirmReject}
              className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white hover:bg-red-600 disabled:opacity-60"
            >
              {busy ? "Rejecting…" : "Confirm Rejection"}
            </button>
          </div>
        </PromptDialog>
      )}
    </div>
  );

  return (
    <>
      {/* --- Short card (list view) --- */}
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
            <span className="max-w-[140px] truncate">by {submission.authorName || "Unknown author"}</span>
            {submission.authorIsAdmin && <VerifiedBadge size={12} />}
          </span>
          <span className="flex items-center gap-1.5">
            <CalendarDays size={13} />
            {submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : "—"}
          </span>
        </div>
      </div>

      {/* --- Full view: portalled to <body> so card transforms can't trap/clip it --- */}
      {isOpen && typeof document !== "undefined" ? createPortal(fullView, document.body) : null}
    </>
  );
}
