"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const DISMISSED_KEY = "codex_cookie_notice_dismissed";

export default function CookieNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(window.localStorage.getItem(DISMISSED_KEY) !== "true");
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(DISMISSED_KEY, "true");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <aside
      aria-label="Cookie notice"
      className="fixed inset-x-3 bottom-3 z-[60] mx-auto flex max-w-lg flex-col gap-4 rounded-xl border border-edge bg-surface p-4 shadow-2xl sm:inset-x-5 sm:bottom-5 sm:p-5"
    >
      <div>
        <p className="text-sm font-semibold text-fg">Essential cookies only</p>
        <p className="mt-1 text-sm leading-6 text-muted">
          CODEX AI uses essential cookies to keep you signed in and browser
          storage to remember preferences.{" "}
          <Link
            href="/privacy"
            className="font-medium text-azure-400 underline underline-offset-2 hover:text-azure-300"
          >
            Privacy policy
          </Link>
        </p>
      </div>
      <div className="flex justify-end">
        <button
          type="button"
          onClick={dismiss}
          className="focus-ring w-full rounded-lg bg-azure-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 sm:w-auto"
        >
          Understood
        </button>
      </div>
    </aside>
  );
}
