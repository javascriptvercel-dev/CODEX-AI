"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  TriangleAlert,
  TerminalSquare,
} from "lucide-react";
import { api } from "@/lib/api";
import Button from "@/components/ui/Button";
function ResetPasswordInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [done, setDone] = useState(false);
  const missingLink = !token || !email;
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setStatus({
        state: "error",
        message: "Password must be at least 8 characters.",
      });
      return;
    }
    if (password !== confirm) {
      setStatus({ state: "error", message: "Passwords don't match." });
      return;
    }
    setStatus({ state: "loading", message: "" });
    try {
      await api.resetPassword({ email, token, password });
      setDone(true);
    } catch (err) {
      setStatus({
        state: "error",
        message:
          "We could not reset your password. The link may have expired. Please request a new reset link.",
      });
    }
  };
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-5 py-16">

      <div className="mb-6 flex items-center gap-2">

        <TerminalSquare size={22} className="text-azure-500" />
        <span className="font-display text-lg font-bold tracking-tight">

          CODEX <span className="text-azure-500">AI</span>
        </span>
      </div>
      <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6 sm:p-8">

        <div className="mb-5 flex items-center gap-2.5">

          <span className="grid h-9 w-9 place-items-center rounded-lg bg-azure-500/10 text-azure-500">

            <KeyRound size={17} />
          </span>
          <div>

            <h1 className="font-display text-base font-bold">
              Reset your password
            </h1>
            <p className="text-xs text-muted">
              {email || "Set a new password"}
            </p>
          </div>
        </div>
        {missingLink ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">

            <TriangleAlert size={22} className="text-red-400" />
            <p className="text-sm text-muted">

              This link is missing some information. Request a new reset link
              and use the one from your email directly.
            </p>
          </div>
        ) : done ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">

            <CheckCircle2 size={26} className="text-green-400" />
            <p className="text-sm text-muted">Your password has been reset.</p>
            <Button size="lg" full className="mt-1" onClick={() => router.push("/plugins")}>
              Continue to CODEX AI
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">

            <label className="flex flex-col gap-1.5 text-sm">

              <span className="font-medium">New password</span>
              <div className="relative">

                <input
                  type={showPassword ? "text" : "password"}
                  id="reset-new-password"
                  name="password"
                  autoComplete="new-password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  className="focus-ring w-full rounded-lg border border-edge bg-surface2 px-3 py-2.5 pr-10 text-sm outline-none placeholder:text-muted/70"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="focus-ring absolute right-2.5 top-1/2 -translate-y-1/2 text-muted hover:text-fg"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >

                  {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </label>
            <label className="flex flex-col gap-1.5 text-sm">

              <span className="font-medium">Confirm password</span>
              <input
                type={showPassword ? "text" : "password"}
                id="reset-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Type it again"
                className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>
            {status.message && (
              <p className="text-sm text-red-400">{status.message}</p>
            )}
            <Button type="submit" size="lg" full disabled={status.state === "loading"} className="mt-1">
              {status.state === "loading"
                ? "Resetting…"
                : "Reset password"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-bg" />}>

      <ResetPasswordInner />
    </Suspense>
  );
}
