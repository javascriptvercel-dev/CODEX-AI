"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, ShieldCheck } from "lucide-react";

const DISMISSED_KEY = "codex_cookie_notice_dismissed";
const TRANSITION_DURATION_MS = 350;

export default function CookieNotice() {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const animationFrame = useRef(null);
  const dismissTimer = useRef(null);

  useEffect(() => {
    if (window.localStorage.getItem(DISMISSED_KEY) === "true") return;
    animationFrame.current = window.requestAnimationFrame(() => {
      setMounted(true);
      animationFrame.current = window.requestAnimationFrame(() => setVisible(true));
    });
    return () => {
      window.cancelAnimationFrame(animationFrame.current);
      window.clearTimeout(dismissTimer.current);
    };
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
    dismissTimer.current = window.setTimeout(
      () => setMounted(false),
      TRANSITION_DURATION_MS,
    );
  };

  if (!mounted) return null;

  return (
    <aside
      aria-label="Cookie notice"
      aria-hidden={!visible}
      className={`fixed inset-x-3 bottom-3 z-[60] mx-auto w-auto max-w-2xl rounded-2xl border border-edge bg-surface p-4 shadow-[0_18px_60px_-18px_rgba(0,0,0,0.55)] ring-1 ring-black/5 transition-[opacity,transform] duration-[350ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none sm:inset-x-5 sm:bottom-5 sm:p-5 md:left-auto md:right-5 ${
        visible ? "translate-y-0 scale-100 opacity-100" : "translate-y-4 scale-[0.98] opacity-0"
      }`}
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
        <div className="flex items-start gap-3 sm:items-center sm:gap-4">
          <span className="grid h-11 w-11 flex-none place-items-center rounded-xl border border-azure-500/20 bg-azure-500/10 text-azure-500">
            <ShieldCheck size={21} strokeWidth={1.8} aria-hidden="true" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-base font-bold tracking-tight text-fg">
              Cookie notice
            </p>
            <p className="mt-1 text-sm leading-6 text-muted">
              CODEX AI uses essential cookies to keep you signed in and protect
              your account. We do not use advertising or analytics cookies.{" "}
              <Link
                href="/privacy#cookies"
                className="group inline-flex items-center gap-0.5 whitespace-nowrap font-semibold text-azure-500 underline decoration-azure-500/40 underline-offset-4 transition hover:decoration-azure-500 focus-ring"
              >
                How cookies work
                <ArrowUpRight size={13} aria-hidden="true" />
              </Link>
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={dismiss}
          className="focus-ring min-h-11 w-full flex-none rounded-lg bg-azure-500 px-5 py-2.5 text-sm font-semibold text-white shadow-sm shadow-azure-500/20 transition hover:bg-azure-600 active:scale-[0.98] sm:w-auto"
        >
          Understood
        </button>
      </div>
    </aside>
  );
}
