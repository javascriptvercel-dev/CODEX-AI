"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Crown,
  LoaderCircle,
  Package,
  ShieldCheck,
  Users,
} from "lucide-react";
import StateBlock from "@/components/ui/StateBlock";
import { api } from "@/lib/api";

const cardClass = "rounded-xl border border-edge bg-surface p-4 sm:p-5";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";

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

const ACTION_LABELS = {
  granted: "Granted",
  renewed: "Renewed",
  extended: "Extended",
  revoked: "Revoked",
};
const SOURCE_LABELS = {
  admin_console: "Console",
  admin_account_create: "Member account",
  database: "Database",
};

export default function AdminOverview() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const result = await api.adminStats();
      setStats(result);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load the overview.");
    } finally {
      setLoading(false);
    }
  }, []);

  const retry = useCallback(() => {
    setLoading(true);
    setError("");
    void load();
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  if (loading && !stats) {
    return (
      <section className={`${cardClass} grid min-h-40 place-items-center text-sm text-muted`}>
        <span className="inline-flex items-center gap-2">
          <LoaderCircle size={15} className="animate-spin" /> Loading overview…
        </span>
      </section>
    );
  }
  if (error && !stats) {
    return (
      <StateBlock
        tone="error"
        title="Overview unavailable"
        message={error}
        onRetry={retry}
        retryLabel="Try again"
      />
    );
  }
  if (!stats) return null;

  const { totals, recentSignups, recentGrants, premiumEnabled } = stats;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Site overview">
        <Metric icon={Users} label="Members" value={totals.users.toLocaleString()} detail={`${totals.newUsers7d} joined this week`} />
        <Metric
          icon={Crown}
          label="Premium members"
          value={premiumEnabled ? (totals.premium ?? 0).toLocaleString() : "—"}
          detail={premiumEnabled ? "Active right now" : "Premium is disabled on the server"}
        />
        <Metric icon={ShieldCheck} label="Pending submissions" value={(totals.pendingSubmissions ?? 0).toLocaleString()} detail="Waiting for review" />
        <Metric icon={Package} label="Published plugins" value={(totals.plugins ?? 0).toLocaleString()} detail={`${totals.suggestions ?? 0} community suggestion${totals.suggestions === 1 ? "" : "s"}`} />
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className={cardClass}>
          <div className="mb-3 flex items-center gap-3">
            <Users size={18} className="text-azure-500" />
            <h2 className="font-display font-bold">Recent signups</h2>
          </div>
          <ul className="divide-y divide-edge">
            {recentSignups.map((signup) => (
              <li key={signup.id} className="flex items-center justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{signup.fullName || "Unnamed account"}</p>
                  <p className="truncate text-xs text-muted">{signup.email}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  {signup.role === "admin" && (
                    <span className="rounded-full bg-violet-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase text-violet-400">admin</span>
                  )}
                  <span className="text-xs text-muted">{formatDate(signup.createdAt)}</span>
                </div>
              </li>
            ))}
            {!recentSignups.length && <li className="py-3 text-sm text-muted">No signups yet.</li>}
          </ul>
        </section>

        <section className={cardClass}>
          <div className="mb-3 flex items-center gap-3">
            <Crown size={18} className="text-amber-400" />
            <h2 className="font-display font-bold">Premium grant activity</h2>
          </div>
          <ul className="divide-y divide-edge">
            {recentGrants.map((grant) => (
              <li key={grant.id} className="flex items-start justify-between gap-3 py-2.5">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2 text-sm">
                    <span className="truncate font-medium text-fg">{grant.userEmail}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      grant.action === "revoked"
                        ? "bg-red-500/10 text-red-400"
                        : "bg-emerald-500/10 text-emerald-500"
                    }`}>
                      {ACTION_LABELS[grant.action] || grant.action}
                    </span>
                    <span className="text-[11px] text-muted">{SOURCE_LABELS[grant.source] || grant.source}</span>
                  </p>
                  <p className="mt-0.5 truncate text-xs text-muted">
                    {grant.note ? `${grant.note} · ` : ""}
                    {grant.expiresAt ? `until ${formatDate(grant.expiresAt)}` : "no expiry"}
                  </p>
                </div>
                <span className="flex-none text-xs text-muted">{formatDate(grant.createdAt)}</span>
              </li>
            ))}
            {!recentGrants.length && (
              <li className="py-3 text-sm text-muted">
                {premiumEnabled
                  ? "No Premium grants recorded yet. Grants made in the Users and Premium tabs will appear here."
                  : "Premium is disabled on the server, so there is nothing to grant yet."}
              </li>
            )}
          </ul>
        </section>
      </div>
    </div>
  );
}
