"use client";
import { useState } from "react";
import Link from "next/link";
import ThemeToggle from "./ThemeToggle";
import LockedModal from "@/components/modals/LockedModal";
import { getLockedPage } from "@/lib/lockedPages";

const links = [
  { href: "/", label: "Home" },
  { href: "/deploy", label: "Deploy" },
  { href: "/session", label: "Session" },
  { href: "/plugins", label: "Plugins" },
  { href: "/tools", label: "Tools" },
  { href: "/apis", label: "APIs" },
  { href: "/support", label: "Support" },
  { href: "/repository", label: "Repository" },
  { href: "/suggest", label: "Suggest" },
];

export default function Navbar({ navLinks = links, onOpenSection }) {
  const [open, setOpen] = useState(false);
  const [lockedPage, setLockedPage] = useState(null);

  const handleLockedLink = (event, href) => {
    const page = getLockedPage(href);
    if (!page) return false;

    event.preventDefault();
    setOpen(false);
    setLockedPage(page);
    return true;
  };

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-edge bg-surface shadow-sm shadow-black/10">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-5">
        <Link
          href="/"
          className="focus-ring min-w-0 whitespace-nowrap rounded-md font-display text-lg font-bold tracking-tight text-fg"
          onClick={() => setOpen(false)}
        >
          CODEX <span className="text-fg">AI BOT</span>
        </Link>

        <nav className="hidden items-center gap-1 xl:flex">
          {navLinks.map((link) => {
            const isSectionLink = typeof link.section === "string";

            if (isSectionLink) {
              return (
                <button
                  key={link.href}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    onOpenSection?.(link.section);
                  }}
                  className="focus-ring rounded-md px-3 py-2 text-sm text-muted transition hover:text-fg"
                >
                  {link.label}
                </button>
              );
            }

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={(event) => handleLockedLink(event, link.href)}
                className="focus-ring rounded-md px-3 py-2 text-sm text-muted transition hover:text-fg"
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
            aria-label="Toggle navigation menu"
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
        <div className="overflow-hidden">
          <nav className="flex flex-col border-t border-edge px-5 py-3">
            {navLinks.map((link) => {
              const isSectionLink = typeof link.section === "string";

              if (isSectionLink) {
                return (
                  <button
                    key={link.href}
                    type="button"
                    onClick={() => {
                      setOpen(false);
                      onOpenSection?.(link.section);
                    }}
                    className="focus-ring rounded-md px-2 py-2.5 text-left text-sm text-muted transition hover:text-fg"
                  >
                    {link.label}
                  </button>
                );
              }

              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={(event) => {
                    if (handleLockedLink(event, link.href)) return;
                    setOpen(false);
                  }}
                  className="focus-ring rounded-md px-2 py-2.5 text-sm text-muted transition hover:text-fg"
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      </header>
      {lockedPage ? (
        <LockedModal
          title={lockedPage.title}
          status={lockedPage.status}
          message={lockedPage.message}
          onClose={() => setLockedPage(null)}
        />
      ) : null}
    </>
  );
}
