import Link from "next/link";
import { CalendarDays, User } from "lucide-react";

export default function PluginCard({ plugin }) {
  const id = plugin?.id;
  if (!id) return null;

 return (
  <Link
    href={`/plugins/${id}`}
    className="focus-ring group flex h-full min-w-0 flex-col rounded-xl border border-edge bg-surface p-5 transition duration-200 hover:-translate-y-0.5 hover:border-azure-500/40 hover:bg-surface2 hover:shadow-glow"
    aria-label={`Open ${plugin.name || "plugin"}`}
  >
    <h3 className="min-w-0 overflow-hidden text-ellipsis whitespace-nowrap font-display text-xl font-bold leading-tight tracking-[-0.02em]">
      {plugin.name || "Untitled plugin"}
    </h3>

    <p className="mt-2 line-clamp-3 min-w-0 text-[15px] leading-6 text-muted [overflow-wrap:anywhere]">
      {plugin.description || "No description provided."}
    </p>

    <div className="mt-4 flex min-w-0 flex-wrap items-center gap-x-4 gap-y-2 pt-4 text-sm text-muted">
      <span className="flex min-w-0 items-center gap-1.5">
        <User size={14} aria-hidden="true" />
        <span className="max-w-[150px] truncate">by {plugin.authorName || "Unknown author"}</span>
      </span>
      <span className="flex min-w-0 items-center gap-1.5">
        <CalendarDays size={14} aria-hidden="true" />
        {plugin.publishedAt ? new Date(plugin.publishedAt).toLocaleDateString() : "—"}
      </span>
    </div>
  </Link>
);
}
