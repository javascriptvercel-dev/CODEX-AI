"use client";
import { useRouter } from "next/navigation";
import { Home, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useState } from "react";
import NavShell from "./NavShell";
import Avatar from "./Avatar";

export default function ConsoleNavbar() {
  const { logout } = useAuth();
  const router = useRouter();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };

  const links = [{ href: "/", label: "Home", icon: Home }];

  const renderLink = (link, { mobile, close, focusable = true }) => {
    const Icon = link.icon;
    const tabIndex = mobile && !focusable ? -1 : undefined;

    if (mobile) {
      return (
        <button
          key={link.label}
          type="button"
          tabIndex={tabIndex}
          onClick={() => {
            close();
            router.push(link.href);
          }}
          className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-2.5 text-left text-sm text-muted transition hover:text-fg"
        >
          <Icon size={15} /> {link.label}
        </button>
      );
    }

    return (
      <button
        key={link.label}
        type="button"
        onClick={() => router.push(link.href)}
        className="focus-ring flex items-center rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-semibold transition hover:border-azure-500/60 active:scale-95"
      >
        <span className="inline-flex items-center gap-1.5">
          <Icon size={15} /> {link.label}
        </span>
      </button>
    );
  };

  return (
    <NavShell
      brand={
        <span className="truncate font-display text-base font-bold tracking-tight sm:text-lg">
          CODEX <span className="text-azure-500">AI</span>
        </span>
      }
      badge={
        <span className="ml-1 hidden rounded-[3px] border border-azure-500/40 bg-azure-500/10 px-2 py-0.5 text-[11px] font-semibold text-azure-500 sm:inline">
          Control
        </span>
      }
      links={links}
      renderLink={renderLink}
      headerClassName="bg-surface/95 backdrop-blur-sm"
      desktopExtra={
        <button
          type="button"
          onClick={handleLogout}
          disabled={loggingOut}
          className="focus-ring flex items-center rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-semibold text-muted transition hover:border-edge hover:text-fg active:scale-95 disabled:opacity-60"
        >
          <span className="inline-flex items-center gap-1.5">
            <LogOut size={15} /> Logout
          </span>
        </button>
      }
      persistentExtra={<Avatar size={34} />}
      mobileExtra={({ focusable }) => (
        <button
          type="button"
          tabIndex={focusable ? undefined : -1}
          onClick={handleLogout}
          disabled={loggingOut}
          className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-2.5 text-left text-sm text-muted transition hover:text-fg disabled:opacity-60"
        >
          <LogOut size={15} /> Logout
        </button>
      )}
    />
  );
}
