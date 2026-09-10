"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import NavShell from "./NavShell";
import { useAuth } from "@/context/AuthContext";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/plugins", label: "Plugins" },
  { href: "/create", label: "Create" },
];

export default function PluginNavbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  // Only the Create Plugin page gets a logout control, and only once
  // we know someone is actually signed in.
  const showLogout = pathname === "/create" && Boolean(user);

  const isActive = (href) =>
    pathname === href || (href === "/plugins" && pathname?.startsWith("/plugins/"));

  const renderLink = (link, { mobile, close, focusable = true }) => {
    const active = isActive(link.href);
    const tabIndex = mobile && !focusable ? -1 : undefined;
    const sharedClass = mobile
      ? `focus-ring rounded-md px-2 py-2.5 text-sm transition ${active ? "text-fg" : "text-muted hover:text-fg"}`
      : `focus-ring rounded-md px-3 py-2 text-sm transition ${active ? "text-fg" : "text-muted hover:text-fg"}`;

    return (
      <Link
        key={link.href}
        href={link.href}
        tabIndex={tabIndex}
        onClick={close}
        className={sharedClass}
      >
        {link.label}
      </Link>
    );
  };

  // logout() (from AuthContext) already redirects to /plugins once the
  // session is cleared, so no extra routing is needed here.
  const handleLogout = async (close) => {
    setLoggingOut(true);
    close?.();
    await logout();
  };

  return (
    <NavShell
      brand={
        <>
          CODEX <span className="text-fg">AI BOT</span>
        </>
      }
      links={navLinks}
      renderLink={renderLink}
      desktopExtra={
        showLogout ? (
          <button
            type="button"
            onClick={() => handleLogout()}
            disabled={loggingOut}
            className="focus-ring flex items-center gap-1.5 rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-semibold text-muted transition hover:border-edge hover:text-fg active:scale-95 disabled:opacity-60"
          >
            <LogOut size={15} />
            {loggingOut ? "Logging out…" : "Logout"}
          </button>
        ) : null
      }
      mobileExtra={
        showLogout
          ? ({ focusable, close }) => (
              <button
                type="button"
                tabIndex={focusable ? undefined : -1}
                onClick={() => handleLogout(close)}
                disabled={loggingOut}
                className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-2.5 text-left text-sm text-muted transition hover:text-fg disabled:opacity-60"
              >
                <LogOut size={15} />
                {loggingOut ? "Logging out…" : "Logout"}
              </button>
            )
          : undefined
      }
    />
  );
}
