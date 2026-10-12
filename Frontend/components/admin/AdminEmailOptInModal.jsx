"use client";
import { useState } from "react";
import {
  BellRing,
  Check,
  Code2,
  Lightbulb,
  LoaderCircle,
  Mail,
} from "lucide-react";
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
  const [error, setError] = useState("");
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
    setError("");
    try {
      await api.setNotifications(true);
      window.localStorage.removeItem(SNOOZE_KEY);
      await refresh();
      onClose();
    } catch (err) {
      setError(err?.message || "Could not enable email alerts. Please try again.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Modal
      title="Stay ahead of new activity"
      icon={<BellRing size={18} className="text-azure-500" />}
      onClose={snooze}
    >
      <div className="space-y-5">
        <p className="text-sm leading-relaxed text-muted">
          {isRepeatPrompt
            ? "Your admin email alerts are still turned off. Get notified as soon as new community activity needs your attention."
            : "Get a timely email when your community shares something new, so you can review it without having to keep checking the console."}
        </p>

        <div className="space-y-2 rounded-xl border border-edge bg-surface2/70 p-3">
          <div className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
              <Code2 size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-fg">
                Plugin submissions
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                Know when a plugin is ready for review.
              </span>
            </span>
            <Check
              size={16}
              className="ml-auto flex-shrink-0 text-azure-500"
              aria-hidden="true"
            />
          </div>
          <div className="flex items-center gap-3 rounded-lg bg-surface px-3 py-2.5">
            <span className="grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
              <Lightbulb size={17} />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold text-fg">
                Community suggestions
              </span>
              <span className="mt-0.5 block text-xs text-muted">
                Keep up with ideas from your users.
              </span>
            </span>
            <Check
              size={16}
              className="ml-auto flex-shrink-0 text-azure-500"
              aria-hidden="true"
            />
          </div>
        </div>

        <p className="flex items-start gap-2 text-xs leading-relaxed text-muted">
          <Mail size={14} className="mt-0.5 flex-shrink-0 text-azure-500" />
          Email alerts are only for admin activity and can be changed any time
          in Settings.
        </p>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </p>
        )}

        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button
            variant="secondary"
            size="md"
            onClick={snooze}
            disabled={loading}
          >
            {isRepeatPrompt ? "Remind me later" : "Not now"}
          </Button>
          <Button size="md" onClick={subscribe} disabled={loading}>
            {loading ? (
              <>
                <LoaderCircle size={15} className="animate-spin" />
                Enabling alerts…
              </>
            ) : (
              <>
                <Mail size={15} />
                Enable email alerts
              </>
            )}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
