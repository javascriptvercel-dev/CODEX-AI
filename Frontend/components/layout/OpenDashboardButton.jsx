"use client";
import Link from "next/link";
import { LayoutDashboard } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

/**
 * The only public entry point to the dashboard. It renders nothing until
 * someone is signed in (through any auth flow), then appears in the same
 * top-right slot of every page header. Admins are sent to the console,
 * which is their dashboard.
 */
export default function OpenDashboardButton({ mobile = false, onNavigate, tabIndex }) {
  const { user, loading } = useAuth();
  if (loading || !user) return null;

  const isAdmin = user.role === "admin";
  const href = isAdmin ? "/console" : "/dashboard";
  const label = isAdmin ? "Open console" : "Open dashboard";

  if (mobile) {
    return (
      <Link
        href={href}
        tabIndex={tabIndex}
        onClick={onNavigate}
        className="focus-ring flex items-center gap-1.5 rounded-md px-2 py-2.5 text-left text-sm font-semibold text-azure-500 transition hover:text-azure-600"
      >
        <LayoutDashboard size={15} aria-hidden="true" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className="focus-ring hidden h-9 items-center gap-1.5 whitespace-nowrap rounded-lg border border-azure-500 bg-azure-500 px-3 text-sm font-semibold text-white transition hover:border-azure-600 hover:bg-azure-600 active:scale-95 sm:inline-flex"
    >
      <LayoutDashboard size={15} aria-hidden="true" />
      {label}
    </Link>
  );
}
