"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import Modal from "@/components/modals/Modal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
const SNOOZE_KEY = "codex_admin_email_prompt_snoozed_until";
const SNOOZE_DAYS = 3;
export function shouldShowEmailPrompt(user) {
  if (!user || user.role !== "admin" || user.emailNotificationsEnabled)
    return false;
  if (typeof window === "undefined") return false;
  const snoozedUntil = Number(window.localStorage.getItem(SNOOZE_KEY) || 0);
  return Date.now() > snoozedUntil;
}
export default function AdminEmailOptInModal({ onClose }) {
  const { refresh } = useAuth();
  const [loading, setLoading] = useState(false);
  const isRepeatPrompt =
    typeof window !== "undefined" &&
    Boolean(window.localStorage.getItem(SNOOZE_KEY));
  const snooze = () => {
    window.localStorage.setItem(
      SNOOZE_KEY,
      String(Date.now() + SNOOZE_DAYS * 24 * 60 * 60 * 1000),
    );
    onClose();
  };
  const subscribe = async () => {
    setLoading(true);
    try {
      await api.setNotifications(true);
      window.localStorage.removeItem(SNOOZE_KEY);
      await refresh();
      onClose();
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      title="Email alerts"
      icon={<Mail size={18} className="text-azure-500" />}
      onClose={snooze}
    >
      
      <div className="flex flex-col items-center gap-3 py-2 text-center">
        
        <span className="grid h-12 w-12 place-items-center rounded-full bg-azure-500/10 text-azure-500">
          
          <Mail size={20} />
        </span>
        <p className="max-w-xs text-sm text-muted">
          
          {isRepeatPrompt
            ? "You haven't subscribed to start receiving plugin submissions and bot suggestions."
            : "Subscribe to receive plugin submissions and bot suggestions."}
        </p>
      </div>
      <div className="mt-5 flex gap-2">
        
        <button
          type="button"
          onClick={snooze}
          className="focus-ring flex-1 rounded-lg border border-edge bg-surface2 py-2.5 text-sm font-semibold transition hover:border-azure-500/60 active:scale-95"
        >
          
          {isRepeatPrompt ? "Remind me later" : "Not now"}
        </button>
        <button
          type="button"
          onClick={subscribe}
          disabled={loading}
          className="focus-ring flex-1 rounded-lg bg-azure-500 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 active:scale-95 disabled:opacity-60"
        >
          
          {loading ? "…" : "Subscribe"}
        </button>
      </div>
    </Modal>
  );
}
