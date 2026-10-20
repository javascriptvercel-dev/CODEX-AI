"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, LoaderCircle, MailCheck, TerminalSquare, TriangleAlert } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";

function ConfirmEmailInner() {
  const router = useRouter();
  const token = useSearchParams().get("token") || "";
  const { user, refresh } = useAuth();
  const [status, setStatus] = useState({ state: "idle", message: "", email: "" });

  // Confirming needs a click (not an automatic request on load) so mail
  // scanners that pre-open links can't use up the token.
  async function confirm() {
    setStatus({ state: "loading", message: "", email: "" });
    try {
      const result = await api.confirmEmailChange(token);
      await refresh();
      setStatus({ state: "done", message: "", email: result.email });
    } catch (error) {
      setStatus({ state: "error", message: error.message, email: "" });
    }
  }

  const goTo = () => router.push(user?.role === "admin" ? "/console?tab=settings" : user ? "/dashboard" : "/login");

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
              This link is missing some information. Open the link from your email directly, or request the change again from Settings.
            </p>
          </div>
        ) : status.state === "done" ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            <CheckCircle2 size={26} className="text-green-400" />
            <p className="text-sm text-muted [overflow-wrap:anywhere]">
              Your email is now <strong className="text-fg">{status.email}</strong>. Use it the next time you sign in.
            </p>
            <Button size="lg" full className="mt-1" onClick={goTo}>
              {user ? "Continue" : "Sign in"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2.5">
              <span className="grid h-9 w-9 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
                <MailCheck size={17} />
              </span>
              <div>
                <h1 className="font-display text-base font-bold">Confirm your new email</h1>
                <p className="text-xs text-muted">One click and your account email is updated.</p>
              </div>
            </div>
            {status.state === "error" && (
              <p role="alert" className="rounded-lg border border-red-400/30 bg-red-400/5 p-3 text-sm text-red-400">
                {status.message}
              </p>
            )}
            <Button size="lg" full onClick={confirm} disabled={status.state === "loading"}>
              {status.state === "loading" && <LoaderCircle size={15} className="animate-spin" />}
              Confirm new email
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function ConfirmEmailPage() {
  return (
    <Suspense fallback={null}>
      <ConfirmEmailInner />
    </Suspense>
  );
}
