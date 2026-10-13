"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { Bot, X } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

const WELCOME_STORAGE_KEY = "codex-account-welcome";

function AccountWelcomeToastInner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcomeParam = searchParams.get("welcome");
  const [welcome, setWelcome] = useState("");
  const touchStartX = useRef(null);
  const dismissTimer = useRef(null);

  useEffect(() => {
    if (pathname !== "/create" && !pathname.startsWith("/tools")) return;

    const storedWelcome = window.sessionStorage.getItem(WELCOME_STORAGE_KEY);
    const nextWelcome = ["created", "back"].includes(welcomeParam)
      ? welcomeParam
      : storedWelcome;
    window.sessionStorage.removeItem(WELCOME_STORAGE_KEY);

    if (nextWelcome === "created" || nextWelcome === "back") {
      const timer = window.setTimeout(() => setWelcome(nextWelcome), 0);
      return () => window.clearTimeout(timer);
    }
  }, [pathname, welcomeParam]);

  useEffect(() => {
    if (!welcome) return undefined;

    dismissTimer.current = window.setTimeout(() => setWelcome(""), 7000);
    return () => window.clearTimeout(dismissTimer.current);
  }, [welcome]);

  function dismiss() {
    setWelcome("");
    if (welcomeParam) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("welcome");
      cleanUrl.searchParams.delete("auth");
      router.replace(`${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`, {
        scroll: false,
      });
    }
  }

  if (!welcome) return null;

  const firstName = user?.fullName?.trim().split(/\s+/)[0];
  const message =
    welcome === "created"
      ? `Account created — welcome${firstName ? `, ${firstName}` : ""}!`
      : `Good to see you again${firstName ? `, ${firstName}` : ""}!`;

  return (
    <div
      role="status"
      aria-live="polite"
      onTouchStart={(event) => {
        touchStartX.current = event.changedTouches[0]?.clientX ?? null;
      }}
      onTouchEnd={(event) => {
        if (
          touchStartX.current !== null &&
          Math.abs(event.changedTouches[0].clientX - touchStartX.current) > 48
        ) {
          dismiss();
        }
        touchStartX.current = null;
      }}
      className="fixed bottom-5 right-5 z-[70] flex max-w-[calc(100vw-2.5rem)] items-center gap-3 rounded-xl border border-edge bg-surface p-3.5 text-sm text-fg shadow-2xl sm:bottom-6 sm:right-6"
    >
      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
        <Bot size={20} aria-hidden="true" />
      </span>
      <p className="min-w-0 flex-1 font-medium">{message}</p>
      <button
        type="button"
        onClick={dismiss}
        aria-label="Dismiss welcome message"
        className="focus-ring grid h-8 w-8 flex-none place-items-center rounded-md text-muted transition hover:bg-surface2 hover:text-fg"
      >
        <X size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function AccountWelcomeToast() {
  return (
    <Suspense fallback={null}>
      <AccountWelcomeToastInner />
    </Suspense>
  );
}
