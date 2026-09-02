"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Copy, User } from "lucide-react";

function formatDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "—" : date.toLocaleDateString();
}

function CopyAction({ label, value }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      disabled={!value}
      className="focus-ring inline-flex h-11 min-w-0 flex-1 items-center justify-center gap-2 rounded-lg border border-edge bg-surface2 px-3 text-sm font-semibold transition hover:border-azure-500/60 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:px-4"
    >
      {copied ? <Check size={15} className="text-green-400" /> : <Copy size={15} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  );
}

export default function PluginFullView({ plugin }) {
  const router = useRouter();
  const rawUrl =
    plugin?.rawUrl ||
    plugin?.installCommand?.replace(/^\.install\s+/i, "") ||
    plugin?.referenceUrl ||
    "";
  const installCommand = plugin?.installCommand || `.install ${rawUrl}`;
  const codeLines = useMemo(() => String(plugin?.code || "").split("\n"), [plugin?.code]);

  if (!plugin) return null;

  return (
    <main className="mx-auto w-full max-w-[1408px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
      <button
        type="button"
        onClick={() => router.push("/plugins")}
        className="focus-ring mb-7 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-fg transition hover:text-azure-500 sm:text-[15px]"
      >
        <span aria-hidden="true">←</span> Back to plugins
      </button>

      <article className="overflow-hidden rounded-xl border border-edge bg-surface shadow-2xl shadow-black/10">
        <div className="p-6 sm:p-8 lg:p-10">
          <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="break-words font-display text-3xl font-bold leading-tight tracking-[-0.025em] sm:text-4xl lg:text-5xl">
                {plugin.name || "Untitled plugin"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted">
                <span className="inline-flex min-w-0 items-center gap-1.5">
                  <User size={15} />
                  <span className="truncate">by {plugin.authorName || "Unknown author"}</span>
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1.5">
                  <CalendarDays size={15} />
                  {formatDate(plugin.publishedAt || plugin.createdAt)}
                </span>
              </div>
            </div>

            <div className="flex w-full gap-2 sm:w-auto">
              <CopyAction label="Copy URL" value={rawUrl} />
              <CopyAction label="Copy Command" value={installCommand} />
            </div>
          </div>

          <section className="mt-9 border-t border-edge pt-8">
            <h2 className="font-display text-xl font-bold">Description</h2>
            <p className="mt-3 max-w-4xl whitespace-pre-wrap text-base leading-7 text-muted sm:text-lg sm:leading-8">
              {plugin.description || "No description was provided for this plugin."}
            </p>
          </section>

          <section className="mt-9 border-t border-edge pt-8">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-xl font-bold">Plugin Code</h2>
              {plugin.code ? (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted sm:text-sm">
                  <User size={14} /> {plugin.authorName || "Plugin author"}
                </span>
              ) : null}
            </div>

            {plugin.code ? (
              <div className="overflow-hidden rounded-xl border border-edge bg-ink-950">
                <pre className="max-h-[72vh] overflow-auto p-4 font-mono text-[12px] leading-6 text-azure-300 sm:p-5 sm:text-[13px]">
                  {codeLines.map((line, index) => (
                    <div key={index} className="flex min-w-max">
                      <span className="mr-5 inline-block w-8 select-none text-right text-slate-500">{index + 1}</span>
                      <code>{line || " "}</code>
                    </div>
                  ))}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-edge bg-surface2 px-5 py-12 text-center text-sm text-muted">
                Plugin source code is not available for this plugin.
              </div>
            )}
          </section>
        </div>
      </article>
    </main>
  );
}
