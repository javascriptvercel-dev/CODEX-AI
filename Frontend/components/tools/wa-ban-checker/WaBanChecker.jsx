"use client";
import { useEffect, useId, useRef, useState } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Info,
  Loader2,
  RotateCcw,
  Search,
  ShieldCheck,
} from "lucide-react";
import { api } from "@/lib/api";

/* ------------------------------ constants ------------------------------ */

const TONES = {
  ok: {
    icon: CheckCircle2,
    box: "border border-azure-500/50 bg-azure-500/10 text-fg",
    ring: "border-azure-500 text-azure-500",
    sub: "text-muted",
  },
  bad: {
    icon: Ban,
    box: "border border-azure-500 bg-azure-500 text-white",
    ring: "border-white",
    sub: "text-white/80",
  },
  warn: {
    icon: Clock,
    box: "border-2 border-dashed border-azure-500/70 bg-surface2 text-fg",
    ring: "border-azure-500 text-azure-500",
    sub: "text-muted",
  },
  info: {
    icon: Info,
    box: "border-2 border-dotted border-edge bg-surface2 text-fg",
    ring: "border-edge text-muted",
    sub: "text-muted",
  },
};

const VERDICTS = {
  not_banned: { tone: "ok", title: "This number is not banned" },
  banned: { tone: "bad", title: "Permanently banned" },
  temporary_ban: { tone: "warn", title: "Temporarily banned" },
  not_on_whatsapp: { tone: "info", title: "Not on WhatsApp" },
  unknown: { tone: "info", title: "Status unknown" },
};

const verdictFor = (status) => VERDICTS[status] || VERDICTS.unknown;

/* ------------------------------ helpers ------------------------------ */

function fmtDate(iso) {
  if (!iso) return null;
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? iso : d.toLocaleString();
}

function summaryText(r) {
  const reasons = r.reasons || [];
  const lines = [
    "WhatsApp Ban Checker",
    `Number: ${r.number}`,
    `Status: ${verdictFor(r.status).title}`,
  ];
  if (reasons.length) lines.push(`Reason: ${reasons.join(" · ")}`);
  if (r.banTime) lines.push(`Ban time: ${fmtDate(r.banTime)}`);
  lines.push(`Checked: ${fmtDate(r.checkedAt)}`);
  return lines.join("\n");
}

/* ------------------------------ result ------------------------------ */

function Result({ r, onAgain }) {
  const [copyLabel, setCopyLabel] = useState("Copy result");
  const timer = useRef(null);
  const box = useRef(null);

  useEffect(() => {
    box.current?.focus(); // the submit button is gone, so land on the result
    return () => clearTimeout(timer.current);
  }, []);

  const v = verdictFor(r.status);
  const tone = TONES[v.tone];
  const Icon = tone.icon;
  const clean = r.status === "not_banned"; // not banned: just the message
  const reasons = r.reasons || [];

  const rows = [
    ["Type", r.type === "permanent" ? "Permanent" : r.type === "temporary" ? "Temporary" : null],
    ["Reason", reasons.join(" · ") || null],
    ["Banned at", fmtDate(r.banTime)],
    [
      "Review",
      r.banned && r.reviewRequested !== null && r.reviewRequested !== undefined
        ? r.reviewRequested
          ? "Requested"
          : "Not requested"
        : null,
    ],
    ["Review time", fmtDate(r.reviewTime)],
    ["Checked", fmtDate(r.checkedAt)],
  ].filter(([, value]) => !clean && value);

  async function copy() {
    try {
      await navigator.clipboard.writeText(summaryText(r));
      setCopyLabel("Copied");
    } catch {
      setCopyLabel("Copy failed");
    }
    clearTimeout(timer.current);
    timer.current = setTimeout(() => setCopyLabel("Copy result"), 1800);
  }

  const actionClass =
    "focus-ring flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-edge px-4 text-sm font-semibold text-fg transition hover:border-azure-500/60 hover:bg-surface2 active:translate-y-px";

  return (
    <div
      ref={box}
      tabIndex={-1}
      role="region"
      aria-label="Ban check result"
      className="mt-6 animate-rise outline-none"
    >
      <div className={`flex items-center gap-4 rounded-xl p-4 ${tone.box}`}>
        <span
          className={`grid h-11 w-11 flex-none place-items-center rounded-full border ${tone.ring}`}
        >
          <Icon size={22} aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <p className="text-[17px] font-bold leading-snug">{v.title}</p>
          {!clean && (
            <p className={`mt-0.5 break-all font-mono text-[12.5px] tracking-wide ${tone.sub}`}>
              {r.number}
            </p>
          )}
        </div>
      </div>

      {rows.length > 0 && (
        <dl className="mt-3.5 divide-y divide-edge overflow-hidden rounded-xl border border-edge bg-surface2">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-3.5 py-2.5 text-[13.5px]">
              <dt className="text-muted">{label}</dt>
              <dd className="m-0 text-right font-mono text-[12.5px] [overflow-wrap:anywhere]">
                {value}
              </dd>
            </div>
          ))}
        </dl>
      )}

      <div className="mt-3.5 flex flex-col gap-2.5 sm:flex-row">
        <button type="button" onClick={copy} className={actionClass}>
          {copyLabel === "Copied" ? (
            <Check size={15} aria-hidden="true" />
          ) : (
            <Copy size={15} aria-hidden="true" />
          )}
          <span aria-live="polite">{copyLabel}</span>
        </button>
        <button type="button" onClick={onAgain} className={actionClass}>
          <RotateCcw size={15} aria-hidden="true" />
          Check another
        </button>
      </div>

      {r.requestId && !clean && (
        <p className="mt-3 break-all text-center font-mono text-[11px] text-muted">
          Request {r.requestId}
        </p>
      )}
    </div>
  );
}

/* ------------------------------ tool ------------------------------ */

export default function WaBanChecker() {
  const [number, setNumber] = useState("");
  const [hint, setHint] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [errorBox, setErrorBox] = useState("");
  const inputRef = useRef(null);
  const inputId = useId();
  const hintId = useId();

  function clearResult() {
    setResult(null);
    setErrorBox("");
  }

  // Keep the field tidy: digits, spaces and dashes only. A pasted "+234 812…" is cleaned up too.
  function handleInput(e) {
    setNumber(e.target.value.replace(/[^\d\s-]/g, ""));
    setHint("");
    if (result) clearResult(); // editing the number after a result starts over
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;

    const digits = number.replace(/\D/g, "");
    if (digits.length < 7 || digits.length > 15) {
      setHint("Enter the full number with country code, e.g. 2348123456789.");
      clearResult();
      inputRef.current?.focus();
      return;
    }

    setHint("");
    clearResult();
    setLoading(true);

    try {
      setResult(await api.checkBan(digits));
    } catch (err) {
      setErrorBox(err?.message || "The check could not be completed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  function checkAnother() {
    setNumber("");
    setHint("");
    clearResult();
    inputRef.current?.focus();
  }

  return (
    <div className="relative isolate overflow-hidden rounded-xl border border-edge bg-surface text-fg">
      <div className="mx-auto flex min-h-[520px] w-full max-w-md flex-col justify-center px-4 py-8 sm:min-h-[600px] sm:py-12">
        <div className="mb-5 flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em]">
          <span
            aria-hidden="true"
            className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-edge bg-surface2 text-azure-500"
          >
            <ShieldCheck size={18} strokeWidth={1.8} />
          </span>
          <span>WhatsApp Ban Checker</span>
        </div>

        <div className="rounded-2xl border border-edge bg-surface2 p-5 sm:p-6">
          <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <label
              htmlFor={inputId}
              className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-muted"
            >
              WhatsApp number
            </label>

            <div
              className={`flex items-center rounded-lg border bg-surface transition focus-within:border-azure-500 focus-within:ring-4 focus-within:ring-azure-500/15 ${
                hint ? "border-dashed border-azure-500" : "border-edge"
              }`}
            >
              <span aria-hidden="true" className="pl-3.5 font-mono text-base text-muted">
                +
              </span>
              <input
                ref={inputRef}
                id={inputId}
                name="number"
                type="tel"
                inputMode="numeric"
                autoComplete="tel"
                placeholder="2348123456789"
                maxLength={24}
                value={number}
                onChange={handleInput}
                aria-invalid={Boolean(hint)}
                aria-describedby={hintId}
                className="min-w-0 flex-1 bg-transparent py-3.5 pl-1.5 pr-3.5 font-mono text-base tracking-[0.04em] text-fg outline-none placeholder:text-muted/70"
              />
            </div>

            <p id={hintId} role="alert" className="mt-2 min-h-5 text-[13px] text-azure-500">
              {hint}
            </p>

            {/* a result is showing: only "Copy result / Check another" remain */}
            {!result && (
              <button
                type="submit"
                disabled={loading}
                className="focus-ring mt-1.5 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-azure-500 px-4 text-sm font-bold uppercase tracking-[0.04em] text-white transition hover:bg-azure-600 active:translate-y-px disabled:cursor-progress disabled:opacity-70"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" aria-hidden="true" />
                ) : (
                  <Search size={16} aria-hidden="true" />
                )}
                {loading ? "Checking…" : "Check number"}
              </button>
            )}
          </form>

          {errorBox && (
            <div
              role="alert"
              className="mt-6 animate-rise rounded-xl border-2 border-dashed border-azure-500/70 bg-surface p-4 text-sm"
            >
              {errorBox}
            </div>
          )}

          {result && <Result r={result} onAgain={checkAnother} />}
        </div>

        <p className="mt-4 px-1 text-center text-xs text-muted">
          Results come from a third-party lookup and may not always be accurate.
        </p>
      </div>
    </div>
  );
}
