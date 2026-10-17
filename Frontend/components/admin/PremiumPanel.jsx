"use client";

import { useCallback, useEffect, useState } from "react";
import { Crown, LoaderCircle, RefreshCw } from "lucide-react";
import AdminEditUserModal from "@/components/admin/AdminEditUserModal";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";

const cardClass = "rounded-xl border border-edge bg-surface p-4 sm:p-5";
const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
const SOURCE_LABELS = {
  admin_console: "Console",
  admin_account_create: "Member account",
  database: "Database",
};
const ACTION_STYLES = {
  granted: "bg-emerald-500/10 text-emerald-500",
  renewed: "bg-azure-500/10 text-azure-500",
  extended: "bg-azure-500/10 text-azure-500",
  revoked: "bg-red-500/10 text-red-400",
};

function getRenewalExpiration(member, days) {
  const now = Date.now();
  const base = member.premiumUntil && Date.parse(member.premiumUntil) > now
    ? Date.parse(member.premiumUntil)
    : now;
  return new Date(base + days * 86_400_000).toISOString();
}

function daysLeft(premiumUntil) {
  if (!premiumUntil) return null;
  return Math.ceil((Date.parse(premiumUntil) - Date.now()) / 86_400_000);
}

export default function PremiumPanel() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState("");
  const [editingUser, setEditingUser] = useState(null);

  const load = useCallback(async () => {
    try {
      const result = await api.adminPremium();
      setData(result);
      setError("");
    } catch (requestError) {
      setError(requestError.message || "Could not load Premium members.");
    } finally {
      setLoading(false);
    }
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError("");
    await load();
  }, [load]);

  useEffect(() => {
    void Promise.resolve().then(load);
  }, [load]);

  async function renew(member, days = 30) {
    setBusyId(member.id);
    setError("");
    try {
      await api.updateAdminUser(member.id, {
        fullName: member.fullName || "Unnamed account",
        email: member.email,
        isPremium: true,
        premiumUntil: getRenewalExpiration(member, days),
        grantNote: `Renewed +${days} days from the Premium tab`,
      });
      showToast(`Extended ${member.email} by ${days} days.`);
      await refresh();
    } catch (requestError) {
      setError(requestError.message || "Could not renew Premium.");
    } finally {
      setBusyId("");
    }
  }

  if (loading && !data) {
    return (
      <section className={`${cardClass} grid min-h-40 place-items-center text-sm text-muted`}>
        <span className="inline-flex items-center gap-2">
          <LoaderCircle size={15} className="animate-spin" /> Loading Premium members…
        </span>
      </section>
    );
  }
  if (error && !data) {
    return (
      <section className={cardClass}>
        <p role="alert" className="text-sm text-red-400">{error}</p>
        <button type="button" onClick={load} className="focus-ring mt-3 rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-fg">Retry</button>
      </section>
    );
  }
  if (!data) return null;

  if (!data.premiumEnabled) {
    return (
      <section className={cardClass}>
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-amber-400/10 text-amber-400">
            <Crown size={19} />
          </span>
          <div>
            <h2 className="font-display text-lg font-bold">Premium is switched off</h2>
            <p className="mt-0.5 text-xs text-muted">Grants are disabled until you enable it.</p>
          </div>
        </div>
        <p className="mt-4 max-w-2xl text-sm leading-6 text-muted">
          Set <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">PREMIUM_FEATURES_ENABLED=true</code> in
          your backend environment and run <code className="rounded bg-surface2 px-1.5 py-0.5 font-mono text-xs">migration_014_premium_grants.sql</code> once
          in Supabase. The Users tab still lets you edit profiles and delete accounts in the meantime.
        </p>
      </section>
    );
  }

  const activeMembers = data.members.filter((member) => member.isPremium);
  const expiringSoon = activeMembers.filter(
    (member) => member.role !== "admin" && member.daysLeft !== null && member.daysLeft <= 7,
  );

  return (
    <div className="space-y-6">
      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">{error}</p>}
      <section className={cardClass}>
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <h2 className="font-display text-lg font-bold">Expiring soon</h2>
            <p className="mt-1 text-xs text-muted">Active Premium members with 7 days or less remaining.</p>
          </div>
          <button
            type="button"
            onClick={refresh}
            className="focus-ring inline-flex items-center gap-1.5 rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-fg"
          >
            <RefreshCw size={13} /> Refresh
          </button>
        </div>
        <ul className="mt-2 divide-y divide-edge">
          {expiringSoon.map((member) => (
            <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">{member.fullName || "Unnamed account"}</p>
                <p className="truncate text-xs text-muted">{member.email}</p>
              </div>
              <div className="flex flex-none items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                  member.daysLeft <= 0 ? "bg-red-500/10 text-red-400" : "bg-amber-400/10 text-amber-400"
                }`}>
                  {member.daysLeft <= 0 ? "Expired" : `${member.daysLeft} day${member.daysLeft === 1 ? "" : "s"} left`}
                </span>
                <button
                  type="button"
                  disabled={busyId === member.id}
                  onClick={() => renew(member, 30)}
                  className="focus-ring rounded-md border border-azure-500 bg-azure-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-azure-600 disabled:opacity-50"
                >
                  {busyId === member.id ? "Renewing…" : "+30 days"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditingUser(member)}
                  className="focus-ring rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-fg"
                >
                  Edit
                </button>
              </div>
            </li>
          ))}
          {!expiringSoon.length && <li className="py-3 text-sm text-muted">Nothing expires within the next 7 days.</li>}
        </ul>
      </section>

      <section className={cardClass}>
        <div className="mb-2">
          <h2 className="font-display text-lg font-bold">Premium members</h2>
          <p className="mt-1 text-xs text-muted">
            {activeMembers.length} active member{activeMembers.length === 1 ? "" : "s"}. Use Edit for custom dates, durations, and notes.
          </p>
        </div>
        <ul className="divide-y divide-edge">
          {data.members.map((member) => {
            const left = member.role === "admin" ? null : daysLeft(member.premiumUntil);
            return (
              <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="flex flex-wrap items-center gap-2">
                    <span className="truncate text-sm font-semibold text-fg">{member.fullName || "Unnamed account"}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${
                      member.role === "admin" ? "bg-violet-500/10 text-violet-400" : "bg-surface2 text-muted"
                    }`}>{member.role}</span>
                  </p>
                  <p className="truncate text-xs text-muted">{member.email}</p>
                </div>
                <div className="flex flex-none items-center gap-2">
                  <span className={`text-xs font-semibold ${
                    member.role === "admin"
                      ? "text-amber-400"
                      : member.isPremium ? "text-emerald-500" : "text-muted"
                  }`}>
                    {member.role === "admin"
                      ? "Permanent"
                      : member.isPremium
                        ? `${left} day${left === 1 ? "" : "s"} left · until ${formatDate(member.premiumUntil)}`
                        : `Expired ${formatDate(member.premiumUntil)}`}
                  </span>
                  {member.role !== "admin" && (
                    <button
                      type="button"
                      disabled={busyId === member.id}
                      onClick={() => renew(member, 30)}
                      className="focus-ring rounded-md border border-azure-500 bg-azure-500 px-3 py-1.5 text-xs font-semibold text-white hover:bg-azure-600 disabled:opacity-50"
                    >
                      {busyId === member.id ? "…" : "+30 days"}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setEditingUser(member)}
                    className="focus-ring rounded-md border border-edge px-3 py-1.5 text-xs font-semibold text-fg"
                  >
                    Edit
                  </button>
                </div>
              </li>
            );
          })}
          {!data.members.length && (
            <li className="py-3 text-sm text-muted">
              No Premium members yet. Grant Premium from the Users tab after someone pays.
            </li>
          )}
        </ul>
      </section>

      <section className={cardClass}>
        <h2 className="font-display text-lg font-bold">Grant history</h2>
        <p className="mt-1 text-xs text-muted">Every manual grant, renewal, and revocation — your receipts.</p>
        <ul className="mt-2 divide-y divide-edge">
          {data.grants.map((grant) => (
            <li key={grant.id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
              <div className="min-w-0">
                <p className="flex flex-wrap items-center gap-2 text-sm">
                  <span className="truncate font-medium text-fg">{grant.userEmail}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${ACTION_STYLES[grant.action] || "bg-surface2 text-muted"}`}>
                    {grant.action}
                  </span>
                  <span className="text-[11px] text-muted">{SOURCE_LABELS[grant.source] || grant.source} · by {grant.grantedBy}</span>
                </p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {grant.note ? `${grant.note} · ` : ""}
                  {grant.expiresAt ? `until ${formatDate(grant.expiresAt)}` : "no expiry"}
                </p>
              </div>
              <span className="flex-none text-xs text-muted">{formatDate(grant.createdAt)}</span>
            </li>
          ))}
          {!data.grants.length && <li className="py-3 text-sm text-muted">No grants recorded yet.</li>}
        </ul>
      </section>

      {editingUser && (
        <AdminEditUserModal
          key={`${editingUser.id}-${editingUser.premiumUntil}-${editingUser.isPremium}`}
          user={editingUser}
          premiumEnabled={true}
          busy={busyId === editingUser.id}
          onClose={() => setEditingUser(null)}
          onSave={async (id, changes) => {
            setBusyId(id);
            setError("");
            try {
              await api.updateAdminUser(id, changes);
              showToast("Saved. The grant history has been updated.");
              setEditingUser(null);
              await load();
            } catch (requestError) {
              setError(requestError.message || "Could not update this user.");
            } finally {
              setBusyId("");
            }
          }}
        />
      )}
    </div>
  );
}
