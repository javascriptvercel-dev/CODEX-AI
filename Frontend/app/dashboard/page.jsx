"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  Crown,
  ExternalLink,
  Link2,
  LayoutDashboard,
  LoaderCircle,
  MessageCircle,
  RefreshCw,
  Sparkles,
  Settings,
  Star,
} from "lucide-react";
import DashboardShell from "@/components/dashboard/DashboardShell";
import ProfileSettings from "@/components/dashboard/ProfileSettings";
import Button from "@/components/ui/Button";
import StateBlock from "@/components/ui/StateBlock";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";

const cardClass = "rounded-xl border border-edge bg-surface p-5 sm:p-6";
const fieldClass = "focus-ring w-full rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm text-fg outline-none";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
const formatTool = (slug) =>
  slug.replace(/-/g, " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

function lastSevenClickDays(entries = []) {
  const clickCounts = new Map(entries.map((entry) => [entry.day, entry.clicks]));
  const today = new Date();
  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate() - 6 + index));
    const day = date.toISOString().slice(0, 10);
    return {
      day,
      label: date.toLocaleDateString(undefined, { weekday: "short", timeZone: "UTC" }),
      clicks: clickCounts.get(day) || 0,
    };
  });
}

const SECTIONS = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "links", label: "Short links", icon: Link2 },
  { id: "activity", label: "Tool activity", icon: Activity },
  { id: "tools", label: "Tool settings", icon: Sparkles },
  { id: "settings", label: "Settings", icon: Settings },
];

function Metric({ icon: Icon, label, value, detail }) {
  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between text-muted">
        <span className="text-sm">{label}</span>
        <Icon size={18} aria-hidden="true" />
      </div>
      <p className="mt-4 font-display text-3xl font-bold text-fg">{value}</p>
      <p className="mt-1 text-xs text-muted">{detail}</p>
    </div>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [settings, setSettings] = useState([]);
  const [mode, setMode] = useState("easy");
  const [section, setSection] = useState("overview");
  const clickDays = lastSevenClickDays(data?.links.dailyClicks);
  const maxDailyClicks = Math.max(1, ...clickDays.map((entry) => entry.clicks));

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      // The dashboard has no public entry point: signed-out visitors are
      // sent to sign in and come straight back here afterwards.
      router.replace("/login?next=%2Fdashboard&cancel=%2F");
    } else if (user.role === "admin") {
      router.replace("/console?tab=overview");
    }
  }, [authLoading, router, user]);

  const fetchDashboard = useCallback(async () => {
    const [dashboard, saved] = await Promise.all([
      api.dashboard(),
      api.dashboardToolSettings(),
    ]);
    return { dashboard, saved };
  }, []);

  useEffect(() => {
    if (!user || user.role === "admin") return undefined;
    let current = true;
    fetchDashboard()
      .then(({ dashboard, saved }) => {
        if (!current) return;
        setData(dashboard);
        setSettings(saved.settings);
        const savedMode = saved.settings.find((item) => item.tool === "javascript-obfuscator")?.values?.mode;
        if (["easy", "medium", "hard"].includes(savedMode)) setMode(savedMode);
      })
      .catch((requestError) => {
        if (current) setError(requestError.message);
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [fetchDashboard, user]);

  async function loadDashboard() {
    setLoading(true);
    setError("");
    try {
      const { dashboard, saved } = await fetchDashboard();
      setData(dashboard);
      setSettings(saved.settings);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function saveSettings(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.saveDashboardToolSettings("javascript-obfuscator", { mode });
      showToast("Obfuscator settings saved.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  const activeSection = SECTIONS.find((item) => item.id === section) || SECTIONS[0];

  if (authLoading || !user || user.role === "admin") {
    return (
      <div className="grid min-h-dvh place-items-center bg-bg text-fg">
        <LoaderCircle className="animate-spin text-azure-500" aria-label="Loading" />
      </div>
    );
  }

  return (
    <DashboardShell
      sections={SECTIONS}
      active={section}
      onSelect={setSection}
      title={activeSection.label}
    >
      <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-azure-500">{activeSection.label}</p>
          <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold">
            Welcome, {user.fullName || user.email}
            {data?.premium.active && <Star size={18} fill="currentColor" className="text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.75)]" aria-label="Premium member" />}
          </h1>
          <p className="mt-1 text-sm text-muted">{user.email}</p>
        </div>
        {section !== "settings" && (
          <Button variant="secondary" onClick={loadDashboard} disabled={loading}>
            {loading ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
            Refresh dashboard
          </Button>
        )}
      </header>

      {section === "settings" ? (
        <ProfileSettings />
      ) : (
        <>
          {error && (
            <div role="alert" className="mb-5 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">
              {error}
            </div>
          )}
          {loading && !data ? (
            <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-azure-500" /></div>
          ) : error && !data ? (
            <StateBlock tone="error" title="Dashboard unavailable" message={error} onRetry={loadDashboard} retryLabel="Try again" />
          ) : data ? (
            <div className="space-y-6">
              {section === "overview" && (
                <>
                  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account overview">
                    <Metric icon={Activity} label="Tool runs" value={data.usage.totalRuns} detail="Last 30 days" />
                    <Metric icon={Link2} label="Short links" value={data.links.total} detail={`${data.links.maxActive ?? "Unlimited"} active-link capacity`} />
                    <Metric icon={ArrowUpRight} label="Link clicks" value={data.links.totalClicks.toLocaleString()} detail="All active links" />
                  </section>
                  <section className={`${cardClass} flex flex-col justify-between gap-5 sm:flex-row sm:items-center`}>
                    <div className="flex items-start gap-3">
                      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-amber-400/10 text-amber-400">
                        {data.premium.active ? <Crown size={20} /> : <Sparkles size={20} />}
                      </span>
                      <div>
                        <h2 className="font-display text-lg font-bold">
                          {data.premium.active ? "Premium is active" : "Premium access"}
                        </h2>
                        <p className="mt-1 max-w-xl text-sm leading-6 text-muted">
                          {data.premium.active
                            ? user.role === "admin"
                              ? "Your administrator account has permanent Premium status with no expiration."
                              : `Your access is active until ${formatDate(data.premium.expiresAt)} — 500 short links, unlimited saved settings, and Premium tools.`
                            : data.premium.available
                              ? "Premium unlocks 500 short links, saved tool settings, the project obfuscator upload, and higher tool limits."
                              : "Premium features are being prepared. They will appear here once enabled."}
                        </p>
                      </div>
                    </div>
                    {!data.premium.active && data.premium.available && (
                      data.premium.contactUrl ? (
                        <a
                          href={data.premium.contactUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="focus-ring inline-flex flex-none items-center justify-center gap-2 rounded-lg border border-azure-500 bg-azure-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 active:scale-[0.98]"
                        >
                          <MessageCircle size={15} />
                          Request Premium
                        </a>
                      ) : (
                        <span className="flex-none text-xs text-muted">
                          Premium upgrades aren’t available right now. Please check back soon.
                        </span>
                      )
                    )}
                  </section>
                </>
              )}
              {section === "links" && (
                    <section className={cardClass}>
                      <div className="mb-4 flex items-center gap-3">
                        <Link2 size={18} className="text-azure-500" />
                        <h2 className="font-display font-bold">Your short links</h2>
                      </div>
                      <div aria-label="Daily short-link clicks for the last seven days" className="mb-4 rounded-lg border border-edge bg-surface2/40 p-3">
                        <p className="mb-3 text-xs font-semibold text-muted">Clicks · last 7 days</p>
                        <div className="grid grid-cols-7 gap-2">
                          {clickDays.map((entry) => (
                            <div key={entry.day} title={`${entry.day}: ${entry.clicks} clicks`} className="flex min-w-0 flex-col items-center gap-1">
                              <div className="flex h-12 w-full items-end justify-center rounded bg-surface2">
                                <div
                                  className="w-3/5 rounded-t bg-azure-500"
                                  style={{ height: `${entry.clicks ? Math.max(8, (entry.clicks / maxDailyClicks) * 100) : 0}%` }}
                                />
                              </div>
                              <span className="text-[10px] text-muted">{entry.label}</span>
                              <span className="text-[10px] font-semibold text-fg">{entry.clicks}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <ul className="divide-y divide-edge">
                        {data.links.items.slice(0, 8).map((link) => (
                          <li key={link.id} className="flex items-center justify-between gap-3 py-3">
                            <div className="min-w-0">
                              <a className="inline-flex items-center gap-1 text-sm font-medium text-azure-500 hover:underline"
                                href={link.shortUrl} target="_blank" rel="noreferrer">
                                {link.shortUrl}<ExternalLink size={12} />
                              </a>
                              <p className="truncate text-xs text-muted">{link.targetUrl}</p>
                            </div>
                            <span className="whitespace-nowrap text-xs text-muted">{Number(link.clickCount).toLocaleString()} clicks</span>
                          </li>
                        ))}
                        {!data.links.items.length && <li className="py-3 text-sm text-muted">Create a short link from the URL Shortener tool to see it here.</li>}
                      </ul>
                      <Link href="/tools/url-shortener" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-azure-500 hover:underline">
                        Open URL Shortener <ArrowUpRight size={14} />
                      </Link>
                    </section>
              )}
              {section === "activity" && (
                    <section className={cardClass}>
                      <div className="mb-4 flex items-center gap-3">
                        <Activity size={18} className="text-azure-500" />
                        <h2 className="font-display font-bold">Recent tool activity</h2>
                      </div>
                      <ul className="divide-y divide-edge">
                        {data.usage.events.slice(0, 8).map((event) => (
                          <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                            <span className="text-sm">{formatTool(event.tool)}</span>
                            <time className="text-xs text-muted">{formatDate(event.createdAt)}</time>
                          </li>
                        ))}
                        {!data.usage.events.length && <li className="py-3 text-sm text-muted">Tool activity will appear as you use the tools.</li>}
                      </ul>
                    </section>
              )}
              {section === "tools" && (
                    <section className={cardClass}>
                      <div className="mb-4 flex items-center gap-3">
                        <Sparkles size={18} className="text-azure-500" />
                        <h2 className="font-display font-bold">Saved tool settings</h2>
                      </div>
                      <form onSubmit={saveSettings} className="flex flex-col gap-3 sm:flex-row">
                        <label className="flex-1 text-sm">
                          <span className="mb-1.5 block text-muted">Obfuscator mode</span>
                          <select className={fieldClass} value={mode} onChange={(event) => setMode(event.target.value)}>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="hard">Hard</option>
                          </select>
                        </label>
                        <Button type="submit" variant="secondary" disabled={busy || !data.premium.available} className="self-end">Save setting</Button>
                      </form>
                      {settings.length > 0 && <p className="mt-3 text-xs text-muted">{settings.length} saved tool configuration{settings.length === 1 ? "" : "s"}.</p>}
                    </section>
              )}
            </div>
          ) : null}
        </>
      )}
    </DashboardShell>
  );
}
