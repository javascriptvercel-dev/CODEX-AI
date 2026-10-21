"use client";
import { useEffect, useState } from "react";
import { Check, Mail } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import ProfileSettings from "@/components/dashboard/ProfileSettings";
import { showToast } from "@/lib/toast";
export default function SettingsTab() {
  const { user, refresh } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [optimisticEnabled, setOptimisticEnabled] = useState(
    Boolean(user?.emailNotificationsEnabled),
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (!updating) {
      setOptimisticEnabled(Boolean(user?.emailNotificationsEnabled));
    }
  }, [user?.emailNotificationsEnabled, updating]);

  const toggleEmails = async (enabled) => {
    const nextValue = Boolean(enabled);
    setOptimisticEnabled(nextValue);
    setUpdating(true);
    setError("");
    try {
      await api.setNotifications(nextValue);
      await refresh();
      showToast(`Email alerts ${nextValue ? "enabled" : "disabled"}.`);
    } catch (requestError) {
      setOptimisticEnabled(!nextValue);
      setError(requestError?.message || "Could not update email alerts.");
    } finally {
      setUpdating(false);
    }
  };

  const enabled = optimisticEnabled;

  return (
    <div className="flex flex-col gap-6">
      <ProfileSettings />
      {error && <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">{error}</p>}

      <button
        type="button"
        aria-pressed={enabled}
        aria-busy={updating}
        disabled={updating}
        onClick={() => toggleEmails(!enabled)}
        className="group flex w-full select-none items-center justify-between gap-4 rounded-lg border border-edge bg-surface2 p-5 text-left transition hover:border-azure-500/40 active:scale-[0.995] disabled:cursor-wait disabled:opacity-70"
      >

        <div className="flex items-start gap-3">

          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-azure-500/10 text-azure-500">

            <Mail size={16} />
          </span>
          <div className="min-w-0">

            <p className="text-sm font-semibold">Email alerts</p>
            <p className="mt-0.5 break-words text-xs text-muted [overflow-wrap:anywhere]">

              Get an email whenever someone submits a plugin or a
              suggestion.
            </p>
          </div>
        </div>
        <span
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md border transition-all ${
            enabled
              ? "border-azure-500 bg-azure-500 text-white"
              : "border-slate-400/60 bg-transparent text-transparent"
          }`}
          aria-hidden="true"
        >
          <Check size={15} strokeWidth={3} />
        </span>
      </button>
    </div>
  );
}
