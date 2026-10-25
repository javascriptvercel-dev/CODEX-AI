"use client";

import { showToast } from "@/lib/toast";

export const TOOL_INPUT_CLASS =
  "focus-ring w-full rounded-lg border border-edge bg-surface2 px-3.5 py-2.5 text-sm text-fg outline-none placeholder:text-muted/70";
export const TOOL_LABEL_CLASS = "block text-sm font-semibold text-fg";
export const TOOL_CARD_CLASS = "rounded-xl border border-edge bg-surface2/40 p-4 sm:p-5";

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
