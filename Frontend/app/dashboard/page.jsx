"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BadgeCheck,
  Check,
  Copy,
  Crown,
  ExternalLink,
  KeyRound,
  Link2,
  LoaderCircle,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import Button from "@/components/ui/Button";
import StateBlock from "@/components/ui/StateBlock";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

const cardClass = "rounded-xl border border-edge bg-surface p-5 sm:p-6";
const fieldClass = "focus-ring w-full rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm text-fg outline-none";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
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

function AdminAccountForm({ premiumAvailable }) {
  const [form, setForm] = useState({ fullName: "", email: "", password: "", grantPremium: false });
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setNotice("");
    setError("");
    try {
      const { account } = await api.createAdminAccount(form);
      setNotice(`Created ${account.email}${account.premiumUntil ? ` with Premium until ${formatDate(account.premiumUntil)}` : ""}.`);
      setForm({ fullName: "", email: "", password: "", grantPremium: false });
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          <Users size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display font-bold">Create a member account</h2>
          <p className="mt-0.5 text-xs text-muted">Admin-created Premium grants last 30 days.</p>
        </div>
      </div>
      <form onSubmit={submit} className="grid gap-3 sm:grid-cols-2">
        <input className={fieldClass} required maxLength={100} placeholder="Full name" value={form.fullName}
          onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
        <input className={fieldClass} required type="email" maxLength={254} placeholder="Email address" value={form.email}
          onChange={(event) => setForm({ ...form, email: event.target.value })} />
        <input className={fieldClass} required type="password" minLength={12} maxLength={128}
          autoComplete="new-password" placeholder="Temporary password (12+ characters)" value={form.password}
          onChange={(event) => setForm({ ...form, password: event.target.value })} />
        <label className={`flex items-center gap-2 rounded-lg border border-edge px-3 py-2 text-sm ${premiumAvailable ? "text-muted" : "text-muted/60"}`}>
          <input type="checkbox" checked={form.grantPremium} disabled={!premiumAvailable}
            onChange={(event) => setForm({ ...form, grantPremium: event.target.checked })} />
          Grant 30 days of Premium{!premiumAvailable ? " (disabled)" : ""}
        </label>
        <div className="sm:col-span-2">
          <Button type="submit" disabled={busy}>
            {busy ? <LoaderCircle size={15} className="animate-spin" /> : <Users size={15} />}
            Create account
          </Button>
        </div>
      </form>
      {notice && <p role="status" className="mt-3 text-sm text-emerald-500">{notice}</p>}
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
    </section>
  );
}

function IntegrationManager({ tokens, onRefresh }) {
  const [name, setName] = useState("");
  const [secret, setSecret] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function create(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setSecret("");
    try {
      const result = await api.createIntegrationToken(name);
      setSecret(result.secret);
      setName("");
      await onRefresh();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  async function revoke(id) {
    setError("");
    try {
      await api.revokeIntegrationToken(id);
      await onRefresh();
    } catch (requestError) {
      setError(requestError.message);
    }
  }

  async function copySecret() {
    try {
      await navigator.clipboard.writeText(secret);
      setCopied(true);
    } catch {
      setError("Copy failed. Select and copy the integration key manually.");
    }
  }

  return (
    <section className={cardClass}>
      <div className="mb-4 flex items-center gap-3">
        <span className="grid h-10 w-10 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          <KeyRound size={19} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display font-bold">Account integrations</h2>
          <p className="mt-0.5 text-xs text-muted">Create members through your admin bot using a bearer token.</p>
        </div>
      </div>
      <form onSubmit={create} className="flex flex-col gap-2 sm:flex-row">
        <input className={fieldClass} required maxLength={80} placeholder="Integration name" value={name}
          onChange={(event) => setName(event.target.value)} />
        <Button type="submit" disabled={busy}>
          {busy ? <LoaderCircle size={15} className="animate-spin" /> : <KeyRound size={15} />}
          Create key
        </Button>
      </form>
      {secret && (
        <div className="mt-4 rounded-lg border border-amber-400/30 bg-amber-400/5 p-3">
          <p className="text-xs font-semibold text-amber-500">Copy this key now. It will not be shown again.</p>
          <div className="mt-2 flex gap-2">
            <code className="min-w-0 flex-1 break-all text-xs text-fg">{secret}</code>
            <button type="button" onClick={copySecret} aria-label="Copy integration key" className="text-muted hover:text-fg">
              {copied ? <Check size={16} /> : <Copy size={16} />}
            </button>
          </div>
        </div>
      )}
      {error && <p role="alert" className="mt-3 text-sm text-red-400">{error}</p>}
      <ul className="mt-4 divide-y divide-edge">
        {tokens.map((token) => (
          <li key={token.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{token.name}</p>
              <p className="mt-0.5 text-xs text-muted">
                {token.token_prefix}… · last used {formatDate(token.last_used_at)}
                {token.revoked_at ? " · revoked" : ""}
              </p>
            </div>
            {!token.revoked_at && (
              <Button size="sm" variant="secondary" onClick={() => revoke(token.id)}>Revoke</Button>
            )}
          </li>
        ))}
        {!tokens.length && <li className="py-3 text-sm text-muted">No integration keys yet.</li>}
      </ul>
    </section>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading, refresh } = useAuth();
  const router = useRouter();
  const [data, setData] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [settings, setSettings] = useState([]);
  const [mode, setMode] = useState("easy");
  const clickDays = lastSevenClickDays(data?.links.dailyClicks);
  const maxDailyClicks = Math.max(1, ...clickDays.map((entry) => entry.clicks));

  useEffect(() => {
    if (!authLoading && user?.role === "admin") {
      router.replace("/console?tab=overview");
    }
  }, [authLoading, router, user]);

  const fetchDashboard = useCallback(async () => {
    const [dashboard, saved] = await Promise.all([
      api.dashboard(),
      api.dashboardToolSettings(),
    ]);
    const integrations = user?.role === "admin" && dashboard.premium.available
      ? await api.integrationTokens()
      : null;
    return { dashboard, saved, integrations };
  }, [user]);

  useEffect(() => {
    if (!user || user.role === "admin") return undefined;
    let current = true;
    fetchDashboard()
      .then(({ dashboard, saved, integrations }) => {
        if (!current) return;
        setData(dashboard);
        setSettings(saved.settings);
        setTokens(integrations?.tokens || []);
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
      const { dashboard, saved, integrations } = await fetchDashboard();
      setData(dashboard);
      setSettings(saved.settings);
      setTokens(integrations?.tokens || []);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  async function refreshTokens() {
    const result = await api.integrationTokens();
    setTokens(result.tokens);
  }

  async function saveSettings(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.saveDashboardToolSettings("javascript-obfuscator", { mode });
      setNotice("Obfuscator settings saved.");
      await loadDashboard();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />
      <main className="flex-1">
        <Container className="pb-16 pt-9 sm:pt-12">
          {authLoading || !user ? (
            <div className="mx-auto max-w-xl py-16 text-center">
              {authLoading ? (
                <LoaderCircle className="mx-auto animate-spin text-azure-500" />
              ) : (
                <>
                  <h1 className="font-display text-2xl font-bold">Your dashboard</h1>
                  <p className="mt-2 text-sm text-muted">Sign in to view your account, tools, and Premium status.</p>
                  <Button href="/login?next=%2Fdashboard" className="mt-5">Sign in</Button>
                </>
              )}
            </div>
          ) : (
            <>
              <header className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-azure-500">Account center</p>
                  <h1 className="mt-2 flex items-center gap-2 font-display text-3xl font-bold">
                    Welcome, {user.fullName || user.email}
                    {user.role === "admin"
                      ? <VerifiedBadge size={18} label="Verified administrator" />
                      : data?.premium.active && <Star size={18} fill="currentColor" className="text-violet-400 drop-shadow-[0_0_6px_rgba(139,92,246,0.75)]" aria-label="Premium member" />}
                  </h1>
                  <p className="mt-1 text-sm text-muted">{user.email}</p>
                </div>
                <Button variant="secondary" onClick={loadDashboard} disabled={loading}>
                  {loading ? <LoaderCircle size={15} className="animate-spin" /> : <RefreshCw size={15} />}
                  Refresh dashboard
                </Button>
              </header>

              {error && (
                <div role="alert" className="mb-5 rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">
                  {error}
                </div>
              )}
              {notice && <p role="status" className="mb-5 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3 text-sm text-emerald-500">{notice}</p>}
              {loading && !data ? (
                <div className="grid min-h-64 place-items-center"><LoaderCircle className="animate-spin text-azure-500" /></div>
              ) : error && !data ? (
                <StateBlock tone="error" title="Dashboard unavailable" message={error} onRetry={loadDashboard} retryLabel="Try again" />
              ) : data ? (
                <div className="space-y-6">
                  <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Account overview">
                    <Metric icon={Activity} label="Tool runs" value={data.usage.totalRuns} detail="Last 30 days" />
                    <Metric icon={Link2} label="Short links" value={data.links.total} detail={`${data.links.maxActive ?? "Unlimited"} active-link capacity`} />
                    <Metric icon={ArrowUpRight} label="Link clicks" value={data.links.totalClicks.toLocaleString()} detail="All active links" />
                    <Metric icon={BadgeCheck} label="Plugin submissions" value={data.submissions.length} detail="Your recent submissions" />
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
                              : `Your access is active until ${formatDate(data.premium.expiresAt)}.`
                            : data.premium.available
                              ? "Premium access is granted by an administrator."
                              : "Premium features are being prepared. They will appear here once enabled."}
                        </p>
                      </div>
                    </div>
                  </section>

                  <div className="grid gap-6 lg:grid-cols-2">
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

                    <section className={cardClass}>
                      <div className="mb-4 flex items-center gap-3">
                        <Activity size={18} className="text-azure-500" />
                        <h2 className="font-display font-bold">Recent tool activity</h2>
                      </div>
                      <ul className="divide-y divide-edge">
                        {data.usage.events.slice(0, 8).map((event) => (
                          <li key={event.id} className="flex items-center justify-between gap-3 py-3">
                            <span className="text-sm">{event.tool.replaceAll("-", " ")}</span>
                            <time className="text-xs text-muted">{formatDate(event.createdAt)}</time>
                          </li>
                        ))}
                        {!data.usage.events.length && <li className="py-3 text-sm text-muted">Tool activity will appear as you use the tools.</li>}
                      </ul>
                    </section>

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

                    <section className={cardClass}>
                      <div className="mb-4 flex items-center gap-3">
                        <ShieldCheck size={18} className="text-azure-500" />
                        <h2 className="font-display font-bold">Plugin submissions</h2>
                      </div>
                      <ul className="divide-y divide-edge">
                        {data.submissions.slice(0, 6).map((submission) => (
                          <li key={submission.id} className="flex items-center justify-between gap-3 py-3">
                            <Link href={`/plugins/${encodeURIComponent(submission.id)}`} className="truncate text-sm font-medium hover:text-azure-500">
                              {submission.title}
                            </Link>
                            <span className="rounded-full border border-edge px-2 py-1 text-[11px] capitalize text-muted">{submission.status.replaceAll("_", " ")}</span>
                          </li>
                        ))}
                        {!data.submissions.length && <li className="py-3 text-sm text-muted">Your submissions will show here.</li>}
                      </ul>
                      <Link href="/create" className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-azure-500 hover:underline">
                        Create a plugin <ArrowUpRight size={14} />
                      </Link>
                    </section>
                  </div>

                  {user.role === "admin" && (
                    <section className="space-y-6 border-t border-edge pt-6">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-azure-500">Administration</p>
                        <h2 className="mt-1 font-display text-xl font-bold">Account management</h2>
                      </div>
                      <AdminAccountForm premiumAvailable={data.premium.available} />
                      {data.premium.available ? (
                        <IntegrationManager tokens={tokens} onRefresh={refreshTokens} />
                      ) : (
                        <p className="text-sm text-muted">Admin account integrations are unavailable while Premium is disabled.</p>
                      )}
                    </section>
                  )}
                </div>
              ) : null}
            </>
          )}
        </Container>
      </main>
      <Footer />
    </div>
  );
}
