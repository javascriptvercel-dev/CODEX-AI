"use client";
import { AlertTriangle, RefreshCw } from "lucide-react";
import Button from "./Button";

/**
 * Shared "nothing to show" panel. Use `tone="error"` for a failed
 * fetch (with a retry action) and `tone="empty"` for a genuinely
 * empty result set, so the two are never visually indistinguishable.
 */
export default function StateBlock({
  tone = "empty",
  icon: Icon,
  title,
  message,
  onRetry,
  retryLabel = "Try again",
  dashed = false,
  className = "",
}) {
  const isError = tone === "error";
  const ResolvedIcon = Icon || (isError ? AlertTriangle : undefined);

  return (
    <div
      role={isError ? "alert" : undefined}
      className={[
        "rounded-xl border px-6 py-14 text-center sm:p-14",
        dashed ? "border-dashed" : "",
        isError
          ? "border-red-400/40 bg-red-500/5"
          : "border-edge bg-surface",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {ResolvedIcon ? (
        <div
          className={[
            "mx-auto grid h-11 w-11 place-items-center rounded-lg",
            isError
              ? "bg-red-500/10 text-red-400"
              : "bg-azure-500/10 text-azure-500",
          ].join(" ")}
        >
          <ResolvedIcon size={19} aria-hidden="true" />
        </div>
      ) : null}
      <p className="mt-4 font-semibold text-fg">{title}</p>
      {message ? (
        <p className="mx-auto mt-1 max-w-md text-sm leading-6 text-muted">
          {message}
        </p>
      ) : null}
      {onRetry ? (
        <Button variant="secondary" size="sm" onClick={onRetry} className="mt-4">
          <RefreshCw size={14} aria-hidden="true" /> {retryLabel}
        </Button>
      ) : null}
    </div>
  );
}
