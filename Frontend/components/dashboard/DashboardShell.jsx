"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, LoaderCircle, LogOut, Menu, X } from "lucide-react";
import Avatar from "@/components/layout/Avatar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";

function SidebarContent({ sections, active, onSelect, onNavigate }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-16 flex-none items-center border-b border-edge px-5 font-display text-lg font-bold tracking-tight">
        CODEX <span className="ml-1 text-azure-500">AI</span>
      </div>

      <nav aria-label="Dashboard sections" className="flex-1 space-y-1 overflow-y-auto p-3">
        {sections.map(({ id, label, icon: Icon }) => {
          const current = active === id;
          return (
            <button
              key={id}
              type="button"
              aria-current={current ? "page" : undefined}
              onClick={() => {
                onSelect(id);
                onNavigate?.();
              }}
              className={`focus-ring flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium transition ${
                current
                  ? "bg-azure-500/10 text-azure-500"
                  : "text-muted hover:bg-surface2 hover:text-fg"
              }`}
            >
              <Icon size={17} aria-hidden="true" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="flex-none space-y-1 border-t border-edge p-3">
        <Link
          href="/"
          onClick={onNavigate}
          className="focus-ring flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium text-muted transition hover:bg-surface2 hover:text-fg"
        >
          <ArrowLeft size={17} aria-hidden="true" />
          Back to site
        </Link>
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="focus-ring flex w-full items-center gap-2.5 rounded-lg px-3 py-2.5 text-left text-sm font-medium text-muted transition hover:bg-surface2 hover:text-fg disabled:opacity-60"
        >
          {loggingOut ? <LoaderCircle size={17} className="animate-spin" /> : <LogOut size={17} aria-hidden="true" />}
          Log out
        </button>
        <div className="flex items-center gap-3 rounded-lg px-3 py-2.5">
          <Avatar size={34} editable={false} />
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1 truncate text-sm font-semibold">
              <span className="truncate">{user?.fullName || user?.email}</span>
              {user?.role === "admin" && <VerifiedBadge size={13} label="Verified administrator" />}
            </p>
            {user?.fullName && <p className="truncate text-xs text-muted">{user.email}</p>}
          </div>
          <ThemeToggle />
        </div>
      </div>
    </div>
  );
}

/**
 * Standalone app shell for the signed-in dashboard: a fixed sidebar on
 * desktop and a slide-over drawer on mobile. It intentionally does not use
 * the marketing Navbar/Footer.
 */
export default function DashboardShell({ sections, active, onSelect, title, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const onKey = (event) => event.key === "Escape" && setDrawerOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-edge bg-surface lg:block">
        <SidebarContent sections={sections} active={active} onSelect={onSelect} />
      </aside>

      <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-edge bg-surface px-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open dashboard menu"
          className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-edge"
        >
          <Menu size={18} />
        </button>
        <span className="font-display text-base font-bold">{title}</span>
      </header>

      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Dashboard menu">
          <button
            type="button"
            aria-label="Close dashboard menu"
            onClick={() => setDrawerOpen(false)}
            className="absolute inset-0 bg-black/60"
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-edge bg-surface shadow-xl">
            <button
              type="button"
              onClick={() => setDrawerOpen(false)}
              aria-label="Close dashboard menu"
              className="focus-ring absolute right-3 top-3.5 grid h-8 w-8 place-items-center rounded-lg text-muted hover:text-fg"
            >
              <X size={18} />
            </button>
            <SidebarContent
              sections={sections}
              active={active}
              onSelect={onSelect}
              onNavigate={() => setDrawerOpen(false)}
            />
          </div>
        </div>
      )}

      <main className="lg:pl-64">
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-10">{children}</div>
      </main>
    </div>
  );
}
