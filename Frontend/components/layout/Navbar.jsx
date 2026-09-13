"use client";
import { useState } from "react";
import Link from "next/link";
import NavShell from "./NavShell";
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
  const [lockedPage, setLockedPage] = useState(null);

  const handleLockedLink = (event, href) => {
    const page = getLockedPage(href);
    if (!page) return false;

    event.preventDefault();
    setLockedPage(page);
    return true;
  };

  const renderLink = (link, { mobile, close, focusable = true }) => {
    const isSectionLink = typeof link.section === "string";
    const tabIndex = mobile && !focusable ? -1 : undefined;
    const sharedClass = mobile
      ? "focus-ring rounded-md px-2 py-2.5 text-left text-sm text-muted transition hover:text-fg"
      : "focus-ring rounded-md px-3 py-2 text-sm text-muted transition hover:text-fg";

    if (isSectionLink) {
      return (
        <button
          key={link.href}
          type="button"
          tabIndex={tabIndex}
          onClick={() => {
            close();
            onOpenSection?.(link.section);
          }}
          className={sharedClass}
        >
          {link.label}
        </button>
      );
    }

    return (
      <Link
        key={link.href}
        href={link.href}
        tabIndex={tabIndex}
        onClick={(event) => {
          if (handleLockedLink(event, link.href)) return;
          close();
        }}
        className={sharedClass}
      >
        {link.label}
      </Link>
    );
  };

  return (
    <>
      <NavShell
        brand={
          <>
            CODEX <span className="text-fg">AI BOT</span>
          </>
        }
        links={navLinks}
        renderLink={renderLink}
      />
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
