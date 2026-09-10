"use client";
import { useState } from "react";
import { Check, Mail, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
import DeleteAccountModal from "./DeleteAccountModal";
export default function SettingsTab() {
  const { user, refresh } = useAuth();
  const [updating, setUpdating] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const toggleEmails = async (enabled) => {
    setUpdating(true);
    try {
      await api.setNotifications(enabled);
      await refresh();
    } finally {
      setUpdating(false);
    }
  };
  return (
    <div className="flex flex-col gap-4">

      <button
        type="button"
        aria-pressed={Boolean(user?.emailNotificationsEnabled)}
        aria-busy={updating}
        disabled={updating}
        onClick={() => toggleEmails(!user?.emailNotificationsEnabled)}
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
            user?.emailNotificationsEnabled
              ? "border-azure-500 bg-azure-500 text-white"
              : "border-slate-400/60 bg-transparent text-transparent"
          }`}
          aria-hidden="true"
        >
          <Check size={15} strokeWidth={3} />
        </span>
      </button>
      <div className="flex flex-col items-start gap-4 rounded-2xl border border-red-500/30 bg-red-500/5 p-5 sm:flex-row sm:items-center sm:justify-between">

        <div className="flex items-start gap-3">

          <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-red-500/10 text-red-400">

            <Trash2 size={16} />
          </span>
          <div className="min-w-0">

            <p className="text-sm font-semibold">Delete account</p>
            <p className="mt-0.5 break-words text-xs text-muted [overflow-wrap:anywhere]">
              Permanently remove your account. This can&apos;t be undone.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setShowDelete(true)}
          className="focus-ring w-full flex-shrink-0 rounded-lg border border-red-400/40 bg-surface px-3.5 py-2 text-sm font-semibold text-red-400 transition hover:bg-red-500/10 active:scale-95 sm:w-auto"
        >

          Delete
        </button>
      </div>
      {showDelete && (
        <DeleteAccountModal onClose={() => setShowDelete(false)} />
      )}
    </div>
  );
}
