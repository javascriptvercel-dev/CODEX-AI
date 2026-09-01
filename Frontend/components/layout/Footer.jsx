"use client";
import Link from "next/link";

export default function Footer({ onOpenSection }) {
  return (
    <footer className="border-t border-edge">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-5 py-8 text-center">
        <p className="text-sm font-semibold text-fg">© 2026 CODEX</p>
        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm">
          <Link href="/privacy" className="focus-ring rounded text-muted hover:text-fg">
            Privacy Policy
          </Link>
          <Link href="/terms" className="focus-ring rounded text-muted hover:text-fg">
            Terms of Service
          </Link>
        </div>
      </div>
    </footer>
  );
}
