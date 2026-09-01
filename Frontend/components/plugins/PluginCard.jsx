import Link from "next/link";
import { User, CalendarDays } from "lucide-react";

export default function PluginCard({ plugin }) {
  const id = plugin?.id;
  if (!id) return null;

  return (
    <Link
      href={`/plugins/${id}`}
      className="focus-ring group flex min-h-[170px] flex-col gap-2.5 rounded-2xl border border-edge bg-surface p-5 transition hover:-translate-y-0.5 hover:border-azure-500/40 hover:shadow-glow"
      aria-label={`Open ${plugin.name || "plugin"}`}
    >
      <h3 className="min-w-0 font-display text-base font-bold leading-tight [overflow-wrap:anywhere]">
        {plugin.name || "Untitled plugin"}
      </h3>
      <p className="line-clamp-2 text-sm leading-6 text-muted [overflow-wrap:anywhere]">
        {plugin.description || "No description provided."}
      </p>
      <div className="mt-auto flex flex-wrap items-center gap-x-3 gap-y-2 pt-2 text-xs text-muted">
        <span className="flex min-w-0 items-center gap-1">
          <User size={12} aria-hidden="true" />
          <span className="max-w-[150px] truncate">by {plugin.authorName || "Unknown author"}</span>
        </span>
        <span className="flex min-w-0 items-center gap-1">
          <CalendarDays size={12} aria-hidden="true" />
          {plugin.publishedAt ? new Date(plugin.publishedAt).toLocaleDateString() : "—"}
        </span>
      </div>
    </Link>
  );
}
