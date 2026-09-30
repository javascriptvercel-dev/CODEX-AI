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

const BG_MASK =
  "radial-gradient(ellipse 75% 70% at 50% 40%, #000 45%, transparent 100%)";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white";

// Black & white on purpose: status is shown by shape (solid / dashed / dotted) and icon, not colour.
const TONES = {
  ok: {
    icon: CheckCircle2,
    box: "border border-white bg-white/[.06] text-white",
    ring: "border-current",
    sub: "text-neutral-400",
  },
  bad: {
    // Banned = solid white block, unmistakable
    icon: Ban,
    box: "border border-white bg-white text-black",
    ring: "border-current",
    sub: "text-neutral-600",
  },
  warn: {
    // Temporary = dashed
    icon: Clock,
    box: "border-2 border-dashed border-white bg-white/[.06] text-white",
    ring: "border-current",
    sub: "text-neutral-400",
  },
  info: {
    // Not on WhatsApp / unknown = dotted, dim
    icon: Info,
    box: "border-2 border-dotted border-white bg-transparent text-white",
    ring: "border-current",
    sub: "text-neutral-400",
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

  const actionClass = `flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg border border-white/25 px-4 text-sm font-semibold text-neutral-100 transition hover:border-white hover:bg-white/10 active:translate-y-px ${FOCUS}`;

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
        <dl className="mt-3.5 divide-y divide-white/15 overflow-hidden rounded-xl border border-white/20 bg-black/30">
          {rows.map(([label, value]) => (
            <div key={label} className="flex justify-between gap-4 px-3.5 py-2.5 text-[13.5px]">
              <dt className="text-neutral-400">{label}</dt>
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
        <p className="mt-3 break-all text-center font-mono text-[11px] text-neutral-400">
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
    <div className="relative isolate overflow-hidden rounded-xl border border-edge bg-black text-neutral-100">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 -z-10 opacity-80"
        style={{
          backgroundImage: 'url("/tools/wa-ban-checker/bg.jpg")',
          backgroundSize: "auto 100%",
          backgroundPosition: "center top",
          backgroundRepeat: "no-repeat",
          filter: "grayscale(1) contrast(1.1)",
          WebkitMaskImage: BG_MASK,
          maskImage: BG_MASK,
        }}
      />

      <div className="mx-auto flex min-h-[520px] w-full max-w-md flex-col justify-center px-4 py-8 sm:min-h-[600px] sm:py-12">
        <div className="mb-5 flex items-center gap-2.5 font-mono text-xs font-semibold uppercase tracking-[0.14em]">
          <span
            aria-hidden="true"
            className="grid h-[30px] w-[30px] place-items-center rounded-lg border border-white/25 bg-black/30 backdrop-blur-[6px]"
          >
            <ShieldCheck size={18} strokeWidth={1.8} />
          </span>
          <span>WhatsApp Ban Checker</span>
        </div>

        <div className="rounded-2xl border border-white/20 bg-black/30 p-5 backdrop-blur-[5px] sm:p-6">
          <form onSubmit={handleSubmit} noValidate aria-busy={loading}>
            <label
              htmlFor={inputId}
              className="mb-2 block font-mono text-[11px] uppercase tracking-[0.14em] text-neutral-400"
            >
              WhatsApp number
            </label>

            <div
              className={`flex items-center rounded-lg border bg-transparent transition focus-within:border-white focus-within:ring-4 focus-within:ring-white/15 ${
                hint ? "border-dashed border-white" : "border-white/25"
              }`}
            >
              <span aria-hidden="true" className="pl-3.5 font-mono text-base text-neutral-400">
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
                className="min-w-0 flex-1 bg-transparent py-3.5 pl-1.5 pr-3.5 font-mono text-base tracking-[0.04em] text-neutral-100 outline-none placeholder:text-neutral-500"
              />
            </div>

            <p id={hintId} role="alert" className="mt-2 min-h-5 text-[13px] text-white">
              {hint}
            </p>

            {/* a result is showing: only "Copy result / Check another" remain */}
            {!result && (
              <button
                type="submit"
                disabled={loading}
                className={`mt-1.5 flex min-h-12 w-full items-center justify-center gap-2.5 rounded-lg bg-white px-4 text-sm font-bold uppercase tracking-[0.04em] text-black transition hover:bg-neutral-200 active:translate-y-px disabled:cursor-progress disabled:opacity-70 ${FOCUS}`}
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
              className="mt-6 animate-rise rounded-xl border-2 border-dashed border-white/70 bg-black/40 p-4 text-sm"
            >
              {errorBox}
            </div>
          )}

          {result && <Result r={result} onAgain={checkAnother} />}
        </div>

        <p className="mt-4 px-1 text-center text-xs text-neutral-400 [text-shadow:0_1px_8px_#000]">
          Results come from a third-party lookup and may not always be accurate.
        </p>
      </div>
    </div>
  );
}
