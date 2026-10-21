"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, TerminalSquare, TriangleAlert, Trash2 } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function ConfirmAccountDeletionInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const { refresh } = useAuth();
  const [status, setStatus] = useState({ state: "idle", message: "" });

  async function confirm() {
    setStatus({ state: "loading", message: "" });
    try {
      await api.confirmAccountDeletion(token);
      await refresh();
      setStatus({ state: "done", message: "" });
    } catch (error) {
      setStatus({ state: "error", message: error.message });
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16">
      <div className="mb-6 flex items-center gap-2">
        <TerminalSquare size={22} className="text-azure-500" />
        <span className="font-display text-lg font-bold tracking-tight">
          CODEX <span className="text-azure-500">AI</span>
        </span>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6 sm:p-8">
        {!token ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <TriangleAlert size={22} className="text-red-400" />
            <p className="text-sm text-muted">
              This confirmation link is incomplete. Open the link from your email.
            </p>
          </div>
        ) : status.state === "done" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={26} className="text-green-400" />
            <h1 className="font-display text-lg font-bold">Account deleted</h1>
            <p className="text-sm text-muted">Your account has been permanently deleted.</p>
            <Button size="lg" full className="mt-1" onClick={() => router.replace("/")}>
              Home
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-red-500/10 text-red-400">
                <Trash2 size={17} />
              </span>
              <div>
                <h1 className="font-display text-base font-bold">Confirm account deletion</h1>
                <p className="text-xs text-muted">This action cannot be undone.</p>
              </div>
            </div>
            {status.state === "error" && (
              <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">
                {status.message}
              </p>
            )}
            <Button
              variant="danger"
              size="lg"
              full
              onClick={confirm}
              disabled={status.state === "loading"}
            >
              {status.state === "loading" && <LoaderCircle size={15} className="animate-spin" />}
              {status.state === "loading" ? "Deleting…" : "Permanently delete account"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmAccountDeletionPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmAccountDeletionInner />
    </Suspense>
  );
}
