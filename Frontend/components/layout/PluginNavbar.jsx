"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "./ThemeToggle";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/plugins", label: "Plugins" },
  { href: "/create", label: "Create" },
];

export default function PluginNavbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-surface shadow-sm shadow-black/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="focus-ring min-w-0 whitespace-nowrap rounded-md font-display text-lg font-bold tracking-tight text-fg"
        >
          CODEX <span className="text-azure-500">AI</span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const active = pathname === link.href || (link.href === "/plugins" && pathname?.startsWith("/plugins/"));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`focus-ring rounded-md px-3 py-2 text-sm transition ${
                  active ? "text-fg" : "text-muted hover:text-fg"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            aria-label={open ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={open}
            className="focus-ring relative grid h-9 w-9 place-items-center rounded-lg border border-edge xl:hidden"
          >
            <span className="relative block h-4 w-4">
              <span className={`absolute left-0 h-[1.5px] w-4 rounded-full bg-fg transition-all duration-300 ease-out ${open ? "top-1/2 -translate-y-1/2 rotate-45" : "top-0.5"}`} />
              <span className={`absolute left-0 top-1/2 h-[1.5px] w-4 -translate-y-1/2 rounded-full bg-fg transition-all duration-200 ease-out ${open ? "scale-x-0 opacity-0" : "scale-x-100 opacity-100"}`} />
              <span className={`absolute left-0 h-[1.5px] w-4 rounded-full bg-fg transition-all duration-300 ease-out ${open ? "top-1/2 -translate-y-1/2 -rotate-45" : "bottom-0.5"}`} />
            </span>
          </button>
        </div>
      </div>

      <div className={`grid transition-all duration-300 ease-out xl:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}>
        <div className="min-h-0 overflow-hidden">
          <nav className="flex flex-col border-t border-edge px-5 py-3">
            {navLinks.map((link) => {
              const active = pathname === link.href || (link.href === "/plugins" && pathname?.startsWith("/plugins/"));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className={`focus-ring rounded-md px-2 py-2.5 text-sm transition ${active ? "text-fg" : "text-muted hover:text-fg"}`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
