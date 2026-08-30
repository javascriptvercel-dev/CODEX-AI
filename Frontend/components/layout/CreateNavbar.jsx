"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import Avatar from "./Avatar";
export default function CreateNavbar() {
  const { logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const handleLogout = async () => {
    setLoggingOut(true);
    await logout();
  };
  return (
    <header className="sticky top-0 z-40 border-b border-edge bg-bg/85 backdrop-blur">

      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-5">

        <div className="flex items-center gap-2 font-display text-lg font-bold tracking-tight">

          CODEX <span className="text-azure-500">AI</span>
        </div>
        <div className="hidden items-center gap-2 md:flex">

          <button
            type="button"
            onClick={() => router.push("/plugins")}
            className="focus-ring flex items-center rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-semibold transition hover:border-azure-500/60 active:scale-95"
          >

            <span className="inline-flex items-center gap-1.5">

              <ArrowLeft size={15} /> Back to plugins
            </span>
          </button>
          <button
            type="button"
            onClick={handleLogout}
            disabled={loggingOut}
            className="focus-ring flex items-center rounded-lg border border-edge bg-surface2 px-3 py-2 text-sm font-semibold text-red-400 transition hover:border-red-400/60 active:scale-95 disabled:opacity-60"
          >

            <span className="inline-flex items-center gap-1.5">

              <LogOut size={15} /> Logout
            </span>
          </button>
          <ThemeToggle /> <Avatar size={34} />
        </div>
        <div className="flex items-center gap-2 md:hidden">

          <ThemeToggle /> <Avatar size={32} />
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
            className="focus-ring relative grid h-9 w-9 place-items-center rounded-lg border border-edge"
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
        className={`grid transition-all duration-300 ease-out md:hidden ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >

        <div className="overflow-hidden">

          <nav className="flex flex-col gap-1 border-t border-edge px-5 py-3">

            <button
              type="button"
              onClick={() => {
                setOpen(false);
                router.push("/plugins");
              }}
              className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-2.5 text-left text-sm text-muted transition hover:text-fg"
            >

              <ArrowLeft size={15} /> Back to plugins
            </button>
            <button
              type="button"
              onClick={handleLogout}
              disabled={loggingOut}
              className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-2.5 text-left text-sm text-red-400 transition disabled:opacity-60"
            >

              <LogOut size={15} /> Logout
            </button>
          </nav>
        </div>
      </div>
    </header>
  );
}
