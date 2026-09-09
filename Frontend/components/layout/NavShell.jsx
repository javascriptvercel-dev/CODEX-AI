"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";

/**
 * Shared header shell for every navbar variant in the app.
 *
 * Previously each navbar (marketing, plugins/create, console) had its
 * own copy of the sticky header, hamburger animation, and mobile
 * dropdown — with different collapse breakpoints (`xl:` vs `md:`) and
 * no shared focus handling. This component is the one implementation;
 * the individual Navbar/PluginNavbar/ConsoleNavbar files just supply
 * the links and extra controls (avatar, logout, badges) for their case.
 *
 * `collapseAt` is always "lg" so the hamburger no longer appears on
 * common laptop viewports (1280–1366px) the way the old `xl:` cutoff did.
 */
export default function NavShell({
  brand,
  brandHref = "/",
  badge,
  links = [],
  renderLink,
  desktopExtra,
  persistentExtra,
  mobileExtra,
  headerClassName = "",
}) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header
      className={[
        "sticky top-0 z-40 border-b border-edge bg-surface shadow-sm shadow-black/10",
        headerClassName,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <div className="flex min-w-0 items-center gap-2">
          <Link
            href={brandHref}
            onClick={close}
            className="focus-ring whitespace-nowrap rounded-md font-display text-lg font-bold tracking-tight text-fg"
          >
            {brand}
          </Link>
          {badge}
        </div>

        <nav className="hidden items-center gap-1 lg:flex">
          {links.map((link) => renderLink(link, { mobile: false, close }))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden items-center gap-2 lg:flex">{desktopExtra}</div>
          <ThemeToggle />
          {persistentExtra}
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            className="focus-ring relative grid h-9 w-9 flex-shrink-0 place-items-center rounded-lg border border-edge lg:hidden"
          >
            <span className="relative block h-4 w-4">
              <span
                className={`absolute left-0 h-[1.5px] w-4 rounded-full bg-fg transition-all duration-300 ease-out ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5"}`}
              />
              <span
                className={`absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 rounded-full bg-fg transition-all duration-200 ease-out ${open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`}
              />
              <span
                className={`absolute left-0 h-[1.5px] w-4 rounded-full bg-fg transition-all duration-300 ease-out ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0.5"}`}
              />
            </span>
          </button>
        </div>
      </div>

      <div
        aria-hidden={!open}
        className={`grid transition-all duration-300 ease-out lg:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <nav className="flex flex-col border-t border-edge px-5 py-3">
            {links.map((link) =>
              renderLink(link, { mobile: true, close, focusable: open }),
            )}
          </nav>
          {mobileExtra ? (
            <div className="flex flex-col gap-1 border-t border-edge px-5 py-3">
              {typeof mobileExtra === "function"
                ? mobileExtra({ focusable: open, close })
                : mobileExtra}
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
