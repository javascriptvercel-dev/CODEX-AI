"use client";

import { useEffect, useState } from "react";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { api, subscribeToToolUsage } from "@/lib/api";

export const TOOL_INPUT_CLASS =
  "focus-ring w-full rounded-lg border border-edge bg-surface2 px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-muted/70";
export const TOOL_LABEL_CLASS = "block text-sm font-semibold text-fg";
export const TOOL_CARD_CLASS = "rounded-xl border border-edge bg-surface2/40 p-4 sm:p-5";
export const BROWSER_UTILITY_LIMITS = {
  freeActionsPerHour: 10,
  premiumActionsPerHour: 50,
  freeTextCharacters: 5_000,
  premiumTextCharacters: 100_000,
  freeCodeCharacters: 50_000,
  premiumCodeCharacters: 500_000,
  freeUrlCharacters: 10_000,
  premiumUrlCharacters: 500_000,
  freeUuidBatch: 5,
  premiumUuidBatch: 20,
  freePasswordLength: 32,
  premiumPasswordLength: 64,
  freeQrPixels: 360,
  premiumQrPixels: 1_200,
};

export function ToolFrame({ icon: Icon, title, description, children }) {
  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-edge bg-surface">
      <header className="flex items-start gap-4 border-b border-edge p-5 sm:p-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          <Icon size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">{title}</h2>
          <p className="mt-1 text-sm leading-6 text-muted">{description}</p>
        </div>
      </header>
      <div className="space-y-5 p-5 sm:p-6">{children}</div>
    </div>
  );
}

export function ToolError({ message }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400"
    >
      {message}
    </p>
  );
}

function formatResetLabel(resetSeconds) {
  if (!Number.isFinite(resetSeconds) || resetSeconds <= 0) return null;
  const minutes = Math.ceil(resetSeconds / 60);
  if (minutes >= 60) return `${Math.round((minutes / 60) * 10) / 10}h`;
  return `${minutes}m`;
}

/**
 * Plan + usage notice. Shows the visitor only what applies to their own
 * plan — internal plan rules for other tiers or staff exemptions are never
 * disclosed here. Premium and admin visitors get a live "used / remaining"
 * meter, free visitors get their own allowance and a Premium entry point.
 */
export function UtilityPlanNotice({ freeBenefit, premiumBenefit, metered = true }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isPremium = isAdmin || user?.isPremium;
  const [usage, setUsage] = useState(null);

  useEffect(() => subscribeToToolUsage(setUsage), []);

  const planLimit = isPremium
    ? BROWSER_UTILITY_LIMITS.premiumActionsPerHour
    : BROWSER_UTILITY_LIMITS.freeActionsPerHour;
  const limit = Number.isFinite(usage?.limit) ? usage.limit : planLimit;
  const used =
    Number.isFinite(usage?.remaining) && usage.remaining <= limit
      ? Math.min(Math.max(limit - usage.remaining, 0), limit)
      : null;
  const resetLabel = formatResetLabel(usage?.resetSeconds);
  const showMeter = metered && used !== null;
  const percent = showMeter ? Math.min(Math.round((used / limit) * 100), 100) : 0;

  return (
    <aside className={`${TOOL_CARD_CLASS} text-xs leading-5 text-muted`}>
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1">
        <p>{isPremium ? premiumBenefit : freeBenefit}</p>
        {metered && (
          <p className="font-medium text-fg/80">
            {showMeter
              ? `${used} of ${limit} used this hour${resetLabel ? ` · resets in ${resetLabel}` : ""}`
              : `Up to ${limit} uses per hour`}
          </p>
        )}
      </div>
      {showMeter && (
        <div
          className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface2"
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={limit}
          aria-valuenow={used}
          aria-label="Hourly tool usage"
        >
          <div
            className={`h-full rounded-full transition-[width] duration-500 ${
              percent >= 100
                ? "bg-red-500/70"
                : percent >= 80
                  ? "bg-amber-400"
                  : "bg-azure-500"
            }`}
            style={{ width: `${percent}%` }}
          />
        </div>
      )}
      {!isPremium && (
        <a
          href="/dashboard"
          className="mt-2 inline-flex font-semibold text-azure-500 hover:underline"
        >
          Explore Premium
        </a>
      )}
    </aside>
  );
}

export function consumeBrowserUtilityUsage(tool) {
  return api.consumeBrowserUtilityUsage(tool);
}

export async function copyToolText(value, successMessage) {
  await navigator.clipboard.writeText(value);
  showToast(successMessage);
}

export function downloadToolText(filename, value, type = "text/plain;charset=utf-8") {
  const url = URL.createObjectURL(new Blob([value], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
