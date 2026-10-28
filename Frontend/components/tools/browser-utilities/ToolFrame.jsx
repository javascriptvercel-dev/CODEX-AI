"use client";

import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

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

export function UtilityPlanNotice({ freeBenefit, premiumBenefit, metered = true }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const isPremium = isAdmin || user?.isPremium;
  const usageLimit = isPremium
    ? BROWSER_UTILITY_LIMITS.premiumActionsPerHour
    : BROWSER_UTILITY_LIMITS.freeActionsPerHour;

  return (
    <aside className={`${TOOL_CARD_CLASS} text-xs leading-5 text-muted`}>
      <p>
        {isPremium
          ? `Premium: ${premiumBenefit}.`
          : `Free: ${freeBenefit}. Premium: ${premiumBenefit}.`}
        {metered && (isAdmin
          ? " Admin use is not rate-limited."
          : ` Includes up to ${usageLimit} uses of this tool per hour.`)}
      </p>
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
