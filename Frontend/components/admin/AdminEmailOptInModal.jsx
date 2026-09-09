"use client";
import { useState } from "react";
import { Mail } from "lucide-react";
import Modal from "@/components/modals/Modal";
import Button from "@/components/ui/Button";
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

        <Button variant="secondary" size="lg" full className="flex-1" onClick={snooze}>
          {isRepeatPrompt ? "Remind me later" : "Not now"}
        </Button>
        <Button size="lg" full className="flex-1" disabled={loading} onClick={subscribe}>
          {loading ? "…" : "Subscribe"}
        </Button>
      </div>
    </Modal>
  );
}
