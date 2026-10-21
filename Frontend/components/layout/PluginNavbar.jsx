"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import NavShell from "./NavShell";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/plugins", label: "Plugins" },
  { href: "/create", label: "Create" },
];

export default function PluginNavbar() {
  const pathname = usePathname();
  const visibleLinks =
    pathname === "/" ? navLinks.filter((link) => link.href !== "/") : navLinks;

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

  // Profile photo and logout live in the dashboard (or console for admins).
  return (
    <NavShell
      brand={
        <>
          CODEX <span className="text-fg">AI BOT</span>
        </>
      }
      links={visibleLinks}
      renderLink={renderLink}
    />
  );
}
