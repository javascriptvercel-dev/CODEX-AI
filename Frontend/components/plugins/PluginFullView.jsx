"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Check,
  Copy,
  Loader2,
  User,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
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
      className="focus-ring inline-flex flex-1 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-edge bg-surface2 px-3 py-2 text-xs font-semibold transition hover:border-azure-500/60 disabled:cursor-not-allowed disabled:opacity-40 sm:flex-none sm:text-sm"
    >

      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Copy size={14} />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
export default function PluginFullView({ plugin }) {
  const router = useRouter();
  const codeLines = useMemo(
    () => String(plugin?.code || "").split("\n"),
    [plugin?.code],
  );
  if (!plugin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-bg px-5 text-fg">

        <div className="flex items-center gap-2 text-sm text-muted">

          <Loader2 size={16} className="animate-spin" /> Loading plugin…
        </div>
      </main>
    );
  }
  const pluginNavLinks = [
    { href: "/", label: "Home" },
    { href: "/plugins", label: "Plugins" },
    { href: "/deploy", label: "Deploy" },
    { href: "/session", label: "Session" },
  ];
  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">

      <Navbar navLinks={pluginNavLinks} showCta={false} />
      <div className="mx-auto max-w-7xl px-5 pt-4 pb-2 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => router.push("/plugins")}
          className="inline-flex items-center gap-2 text-sm font-semibold text-fg transition hover:text-azure-500 sm:text-[15px]"
        >
          ← Back to plugins
        </button>
      </div>
      <section className="mx-auto max-w-7xl px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">

        <div className="rounded-2xl border border-edge bg-surface p-6 shadow-2xl shadow-black/10 sm:p-8 lg:p-10">

          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">

            <div className="min-w-0">

              <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">

                {plugin.name || "Untitled plugin"}
              </h1>
              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">

                <span className="inline-flex items-center gap-1.5">

                  by {plugin.authorName || "Unknown author"}
                </span>
                <span aria-hidden="true">•</span>
                <span className="inline-flex items-center gap-1.5">

                  <CalendarDays size={15} />
                  {formatDate(plugin.publishedAt || plugin.createdAt)}
                </span>
              </div>
            </div>
            <div className="flex flex-row gap-2 lg:flex-shrink-0">

              <CopyAction
                label="Copy URL"
                value={plugin.referenceUrl}
              />
              <CopyAction
                label="Copy Command"
                value={plugin.installCommand}
              />
            </div>
          </div>
          <div className="mt-8 border-t border-edge pt-7">

            <h2 className="font-display text-lg font-bold">Description</h2>
            <p className="mt-3 max-w-4xl whitespace-pre-wrap text-base leading-7 text-muted sm:text-lg">

              {plugin.description ||
                "No description was provided for this plugin."}
            </p>
          </div>
          <div className="mt-8 border-t border-edge pt-7">

            <div className="mb-3 flex items-center justify-between gap-3">

              <h2 className="font-display text-lg font-bold">
                Plugin Code
              </h2>
              {plugin.code && (
                <span className="inline-flex items-center gap-1.5 text-xs text-muted">

                  <User size={13} /> {plugin.authorName || "Plugin author"}
                </span>
              )}
            </div>
            {plugin.code ? (
              <div className="overflow-hidden rounded-xl border border-edge bg-ink-950">

                <pre className="max-h-[70vh] overflow-auto p-4 font-mono text-[12px] leading-6 text-azure-300 sm:p-5 sm:text-[13px]">

                  {codeLines.map((line, index) => (
                    <div key={index} className="flex min-w-max">

                      <span className="mr-5 inline-block w-7 select-none text-right text-slate-500">

                        {index + 1}
                      </span>
                      <code>{line || " "}</code>
                    </div>
                  ))}
                </pre>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-edge bg-surface2 px-5 py-10 text-center text-sm text-muted">

                Plugin source code is not available for this plugin.
              </div>
            )}
          </div>
        </div>
      </section>
      <Footer />
    </div>
  );
}
