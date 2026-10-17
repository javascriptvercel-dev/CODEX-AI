"use client";

import { Suspense, useEffect, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { showToast } from "@/lib/toast";

const WELCOME_STORAGE_KEY = "codex-account-welcome";

function AccountWelcomeToastInner() {
  const { user } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const welcomeParam = searchParams.get("welcome");
  const lastToast = useRef("");

  useEffect(() => {
    if (pathname !== "/create" && !pathname.startsWith("/tools")) return;

    const storedWelcome = window.sessionStorage.getItem(WELCOME_STORAGE_KEY);
    const nextWelcome = ["created", "back"].includes(welcomeParam)
      ? welcomeParam
      : storedWelcome;
    window.sessionStorage.removeItem(WELCOME_STORAGE_KEY);

    if (nextWelcome !== "created" && nextWelcome !== "back") return;

    const toastKey = `${pathname}:${nextWelcome}:${welcomeParam || ""}`;
    if (lastToast.current !== toastKey) {
      lastToast.current = toastKey;
      const firstName = user?.fullName?.trim().split(/\s+/)[0];
      const message =
        nextWelcome === "created"
          ? `Account created — welcome${firstName ? `, ${firstName}` : ""}!`
          : `Good to see you again${firstName ? `, ${firstName}` : ""}!`;
      showToast(message, { type: nextWelcome === "created" ? "success" : "info" });
    }

    if (welcomeParam) {
      const cleanUrl = new URL(window.location.href);
      cleanUrl.searchParams.delete("welcome");
      cleanUrl.searchParams.delete("auth");
      router.replace(`${cleanUrl.pathname}${cleanUrl.search}${cleanUrl.hash}`, {
        scroll: false,
      });
    }
  }, [pathname, router, user?.fullName, welcomeParam]);

  return null;
}

export default function AccountWelcomeToast() {
  return (
    <Suspense fallback={null}>
      <AccountWelcomeToastInner />
    </Suspense>
  );
}
