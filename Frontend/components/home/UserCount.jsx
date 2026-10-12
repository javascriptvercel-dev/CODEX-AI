"use client";

import { useEffect, useState } from "react";
import { Users } from "lucide-react";
import { API_URL } from "@/lib/api";

const formatCount = (value) =>
  typeof value === "number" ? new Intl.NumberFormat("en-US").format(value) : "--";

export default function UserCount({ variant = "card" }) {
  const [count, setCount] = useState(null);

  useEffect(() => {
    let active = true;

    fetch(`${API_URL}/api/stats/public`, { credentials: "include" })
      .then((response) => {
        if (!response.ok) throw new Error("User count unavailable.");
        return response.json();
      })
      .then((data) => {
        if (typeof data?.registeredUsers !== "number") {
          throw new Error("User count response was invalid.");
        }
        if (active) setCount(data.registeredUsers);
      })
      .catch(() => {
        if (active) {
          console.error("[stats] Registered user count could not be loaded.");
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (variant === "compact") {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold text-muted"
        aria-label={`${formatCount(count)} registered users`}
      >
        <span>{formatCount(count)}</span>
        <Users size={14} className="text-azure-400" aria-hidden="true" />
        <span>Users</span>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl border border-edge bg-surface p-4 shadow-sm">
      <span className="grid h-10 w-10 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
        <Users size={18} aria-hidden="true" />
      </span>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-muted">
          Registered users
        </p>
        <p className="mt-0.5 text-xl font-bold text-fg" aria-live="polite">
          {formatCount(count)}
        </p>
      </div>
    </div>
  );
}
