"use client";
import { Fragment, useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeft, LoaderCircle, LogOut, Menu, X } from "lucide-react";
import Avatar from "@/components/layout/Avatar";
import ThemeToggle from "@/components/layout/ThemeToggle";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import { useAuth } from "@/context/AuthContext";

function SidebarContent({
  sections,
  active,
  onSelect,
  onNavigate,
  onClose,
  collapsed = false,
  drawer = false,
  onToggleCollapsed,
}) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  async function handleLogout() {
    setLoggingOut(true);
    await logout();
  }

  return (
    <div className="flex h-full flex-col">
      <div className={`flex h-16 flex-none items-center border-b border-edge ${collapsed ? "justify-center px-2" : "justify-between px-5"}`}>
        <Link
          href="/"
          aria-label="CODEX AI home"
          onClick={onNavigate}
          title={collapsed ? "CODEX AI home" : undefined}
          className="focus-ring rounded font-display text-lg font-bold tracking-tight text-fg no-underline hover:text-fg hover:no-underline"
        >
          {collapsed ? (
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-azure-500/10 text-azure-500" aria-hidden="true">
              C
            </span>
          ) : (
            <>CODEX <span className="ml-1 text-azure-500">AI</span></>
          )}
        </Link>
        {drawer && (
          <button
            type="button"
            onClick={onClose}
            aria-label="Close app menu"
            className="focus-ring grid h-9 w-9 place-items-center rounded-lg text-muted transition hover:bg-surface2 hover:text-fg"
          >
            <X size={18} />
          </button>
        )}
      </div>

      <nav aria-label="App sections" className={`flex-1 overflow-y-auto ${collapsed ? "p-2" : "p-3"}`}>
        {sections.map(({ id, label, icon: Icon, dividerBefore, group }, index) => {
          const current = active === id;
          const previous = sections[index - 1];
          const showGroupLabel = !collapsed && Boolean(group) && previous?.group !== group;
          return (
            <Fragment key={id}>
              {dividerBefore && <div role="separator" className="!my-3 border-t border-edge" />}
              {showGroupLabel && (
                <p className="px-3 pb-1.5 pt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted/60">
                  {group}
                </p>
              )}
              <button
                type="button"
                aria-current={current ? "page" : undefined}
                aria-label={collapsed ? label : undefined}
                title={collapsed ? label : undefined}
                onClick={() => {
                  onSelect(id);
                  onNavigate?.();
                }}
                className={`focus-ring group relative mb-0.5 flex w-full items-center rounded-xl text-left text-sm font-medium transition-all duration-150 ${
                  collapsed ? "justify-center px-0 py-3" : "gap-3 px-3 py-2.5"
                } ${
                  current
                    ? "bg-azure-500/10 text-fg"
                    : "text-muted hover:bg-surface2/70 hover:text-fg"
                }`}
              >
                <Icon
                  size={18}
                  aria-hidden="true"
                  className={`flex-none transition-colors ${
                    current ? "text-azure-500" : "text-muted group-hover:text-fg"
                  }`}
                />
                {!collapsed && <span className="min-w-0 flex-1 truncate">{label}</span>}
                <span
                  aria-hidden="true"
                  className={`absolute left-0 h-5 w-1 rounded-r-full bg-azure-500 transition-all duration-200 ${
                    current ? (collapsed ? "-left-2 opacity-100" : "opacity-100") : "opacity-0"
                  }`}
                />
              </button>
            </Fragment>
          );
        })}
      </nav>

      <div className={`flex-none border-t border-edge ${collapsed ? "space-y-2 p-2" : "space-y-3 p-3"}`}>
        {collapsed ? (
          <>
            <div className="flex flex-col items-center gap-2">
              <Avatar size={34} editable={false} />
              <ThemeToggle />
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Log out"
                title="Log out"
                className="focus-ring grid h-9 w-9 place-items-center rounded-xl text-muted transition-colors hover:bg-surface2 hover:text-fg disabled:opacity-60"
              >
                {loggingOut ? <LoaderCircle size={17} className="animate-spin" /> : <LogOut size={17} />}
              </button>
            </div>
            <button
              type="button"
              onClick={onToggleCollapsed}
              aria-label="Expand sidebar"
              title="Expand sidebar"
              className="focus-ring grid w-full place-items-center rounded-lg py-2 text-muted transition-colors hover:bg-surface2 hover:text-fg"
            >
              <ChevronLeft size={16} className="rotate-180" aria-hidden="true" />
            </button>
          </>
        ) : (
          <>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onSelect("settings");
                  onNavigate?.();
                }}
                aria-label={`Open profile settings for ${user?.fullName || user?.email}${user?.fullName ? `, ${user.email}` : ""}`}
                title={user?.email}
                className="focus-ring flex min-w-0 flex-1 items-center gap-3 rounded-xl border border-edge bg-surface2/50 px-2.5 py-2.5 text-left transition-colors hover:bg-surface2"
              >
                {/* The badge sits next to the name below, so none on the photo. */}
                <Avatar size={34} editable={false} showBadge={false} />
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1 truncate text-sm font-semibold">
                    <span className="truncate">{user?.fullName || user?.email}</span>
                    {user?.role === "admin" && <VerifiedBadge size={13} label="Verified administrator" />}
                  </span>
                  {user?.fullName && <span className="block truncate text-xs text-muted">{user.email}</span>}
                </span>
              </button>
              <button
                type="button"
                onClick={handleLogout}
                disabled={loggingOut}
                aria-label="Log out"
                title="Log out"
                className="focus-ring grid h-9 w-9 flex-none place-items-center rounded-xl border border-edge text-muted transition-colors hover:text-fg disabled:opacity-60"
              >
                {loggingOut ? <LoaderCircle size={17} className="animate-spin" /> : <LogOut size={17} />}
              </button>
            </div>
            <div className="flex items-center justify-between">
              <ThemeToggle />
              {!drawer && (
                <button
                  type="button"
                  onClick={onToggleCollapsed}
                  aria-label="Collapse sidebar"
                  className="focus-ring flex items-center gap-1.5 rounded-lg px-2.5 py-2 text-sm font-medium text-muted transition-colors hover:bg-surface2 hover:text-fg"
                >
                  <ChevronLeft size={15} aria-hidden="true" />
                  Collapse
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * Standalone app shell for signed-in areas: a fixed sidebar on desktop and
 * a slide-over drawer on mobile. It intentionally omits the marketing shell.
 */
export default function DashboardShell({ sections, active, onSelect, title, children }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const activeLabel = sections.find((section) => section.id === active)?.label || title;

  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event) => {
      if (event.key === "Escape") setDrawerOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [drawerOpen]);

  return (
    <div className="min-h-dvh bg-bg text-fg">
      <aside className={`fixed inset-y-0 left-0 z-30 hidden animate-sidebar-in border-r border-edge bg-surface transition-[width] duration-300 ease-out lg:block ${collapsed ? "w-[72px]" : "w-72"}`}>
        <SidebarContent
          sections={sections}
          active={active}
          onSelect={onSelect}
          collapsed={collapsed}
          onToggleCollapsed={() => setCollapsed((value) => !value)}
        />
      </aside>

      <header className="sticky top-0 z-20 grid h-14 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-edge bg-surface px-3 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Open app menu"
          aria-expanded={drawerOpen}
          className="focus-ring grid h-9 w-9 place-items-center rounded-lg border border-edge"
        >
          <Menu size={18} />
        </button>
        <Link
          href="/"
          aria-label="CODEX AI home"
          className="justify-self-center font-display text-base font-bold tracking-tight text-fg no-underline hover:no-underline"
        >
          CODEX <span className="text-azure-500">AI</span>
        </Link>
        <div className="flex items-center gap-2">
          <span className="hidden max-w-28 truncate text-right text-xs text-muted sm:block">
            {activeLabel}
          </span>
          <ThemeToggle />
        </div>
      </header>

      <div
        className={`fixed inset-0 z-40 transition-[visibility] duration-300 lg:hidden ${drawerOpen ? "visible" : "invisible"}`}
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
      >
        <button
          type="button"
          aria-label="Close app menu"
          onClick={() => setDrawerOpen(false)}
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${drawerOpen ? "opacity-100" : "opacity-0"}`}
        />
        <div
          role="dialog"
          aria-modal="true"
          aria-label="App menu"
          className={`absolute inset-y-0 left-0 w-72 max-w-[85vw] border-r border-edge bg-surface shadow-xl transition-transform duration-300 ease-out ${
            drawerOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <SidebarContent
            sections={sections}
            active={active}
            onSelect={onSelect}
            drawer
            onClose={() => setDrawerOpen(false)}
            onNavigate={() => setDrawerOpen(false)}
          />
        </div>
      </div>

      <main className={`transition-[padding] duration-300 ease-out ${collapsed ? "lg:pl-[72px]" : "lg:pl-72"}`}>
        <div className="mx-auto w-full max-w-5xl px-4 pb-16 pt-7 sm:px-6 lg:px-8 lg:pt-10">{children}</div>
      </main>
    </div>
  );
}
