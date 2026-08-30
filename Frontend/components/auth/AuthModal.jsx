"use client";
import { useState } from "react";
import {
  KeyRound,
  Github,
  Eye,
  EyeOff,
  MailCheck,
  Send,
} from "lucide-react";
import Modal from "@/components/modals/Modal";
import { useAuth } from "@/context/AuthContext";
import { api } from "@/lib/api";
export default function AuthModal({ onClose, onSuccess, message }) {
  const { login, signup } = useAuth();
  const [mode, setMode] = useState("login");
  const [showPassword, setShowPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const [resetSent, setResetSent] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });
    try {
      if (mode === "login") {
        await login({ email, password });
      } else if (mode === "signup") {
        await signup({ email, password, fullName });
      } else {
        await api.forgotPassword(email);
        setResetSent(true);
        setStatus({ state: "idle", message: "" });
        return;
      }
      onSuccess?.();
    } catch (err) {
      const fallback =
        mode === "forgot"
          ? "We could not send the password reset email. Please try again."
          : mode === "signup"
            ? "We could not create your account. Please review your details and try again."
            : "We could not sign you in. Please check your credentials and try again.";
      const raw = String(err?.message || "").trim();
      const safeMessages = [
        ["invalid credentials", "The email or password is incorrect."],
        ["invalid email", "Enter a valid email address."],
        ["email already", "An account with this email already exists."],
        ["already exists", "An account with this email already exists."],
        ["too many", "Too many attempts. Please wait a moment and try again."],
        ["network", "We could not connect to the service. Please try again."],
      ];
      const matched = safeMessages.find(([needle]) =>
        raw.toLowerCase().includes(needle),
      );
      setStatus({ state: "error", message: matched?.[1] || fallback });
    }
  };
  const switchMode = (next) => {
    setMode(next);
    setResetSent(false);
    setStatus({ state: "idle", message: "" });
  };
  const titles = {
    login: "Log in",
    signup: "Create an account",
    forgot: "Reset your password",
  };
  return (
    <Modal
      title={titles[mode]}
      icon={<KeyRound size={18} className="text-azure-500" />}
      onClose={onClose}
    >
      
      {message && mode !== "forgot" && (
        <p className="mb-4 rounded-lg border border-azure-500/30 bg-azure-500/10 px-3 py-2 text-xs text-azure-300">
          
          {message}
        </p>
      )}
      {mode === "forgot" ? (
        resetSent ? (
          <div className="flex flex-col items-center gap-3 py-4 text-center">
            
            <span className="grid h-11 w-11 place-items-center rounded-full bg-azure-500/10 text-azure-500">
              
              <MailCheck size={20} />
            </span>
            <p className="text-sm text-muted">
              
              If <span className="text-fg">{email}</span> has an account, a
              reset link is on its way — it&apos;s valid for 1 hour.
            </p>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="focus-ring mt-1 rounded text-sm font-semibold text-azure-500 hover:underline"
            >
              
              Back to log in
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            
            <p className="text-sm text-muted">
              Enter your email and we&apos;ll send you a link to reset your
              password.
            </p>
            <label className="flex flex-col gap-1.5 text-sm">
              
              <span className="font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>
            {status.message && (
              <p className="text-sm text-red-400">{status.message}</p>
            )}
            <button
              type="submit"
              disabled={status.state === "loading"}
              className="focus-ring mt-1 flex items-center justify-center gap-2 rounded-lg bg-azure-500 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:opacity-60"
            >
              <Send size={15} />
              {status.state === "loading" ? "Sending…" : "Send reset link"}
            </button>
            <button
              type="button"
              onClick={() => switchMode("login")}
              className="focus-ring mx-auto rounded text-sm font-semibold text-muted hover:text-fg"
            >
              
              Back to log in
            </button>
          </form>
        )
      ) : (
        <>
          
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            
            {mode === "signup" && (
              <label className="flex flex-col gap-1.5 text-sm">
                
                <span className="font-medium">Name</span>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Ada Lovelace"
                  className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
                />
              </label>
            )}
            <label className="flex flex-col gap-1.5 text-sm">
              
              <span className="font-medium">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>
            <label className="flex flex-col gap-1.5 text-sm">
              
              <div className="flex items-center justify-between">
                
                <span className="font-medium">Password</span>
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => switchMode("forgot")}
                    className="focus-ring rounded text-xs font-semibold text-azure-500 hover:underline"
                  >
                    
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                
                <input
                  type={showPassword ? "text" : "password"}
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
            {status.message && (
              <p className="text-sm text-red-400">{status.message}</p>
            )}
            <button
              type="submit"
              disabled={status.state === "loading"}
              className="focus-ring mt-1 rounded-lg bg-azure-500 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:opacity-60"
            >
              
              {status.state === "loading"
                ? "Please wait…"
                : mode === "login"
                  ? "Log in"
                  : "Create account"}
            </button>
          </form>
          <div className="my-5 flex items-center gap-3 text-xs text-muted">
            
            <span className="h-px flex-1 bg-edge" />
            <span>or continue with</span>
            <span className="h-px flex-1 bg-edge" />
          </div>
          <a
            href={api.githubUrl()}
            className="focus-ring flex items-center justify-center gap-2 rounded-lg border border-edge bg-surface2 py-2.5 text-sm font-semibold transition hover:border-azure-500/60 hover:bg-surface2/80"
          >
            
            <Github size={16} /> Continue with GitHub
          </a>
          <p className="mt-4 text-center text-sm text-muted">
            
            {mode === "login" ? "New here?" : "Already have an account?"}
            <button
              type="button"
              onClick={() => switchMode(mode === "login" ? "signup" : "login")}
              className="focus-ring rounded font-semibold text-azure-500 hover:underline"
            >
              
              {mode === "login" ? "Create an account" : "Log in"}
            </button>
          </p>
        </>
      )}
    </Modal>
  );
}
