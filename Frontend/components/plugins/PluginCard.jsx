"use client";
import { useRouter } from "next/navigation";
import { User, CalendarDays } from "lucide-react";
export default function PluginCard({ plugin }) {
  const router = useRouter();
  const openPlugin = () => {
    if (plugin?.id) router.push(`/plugins/${plugin.id}`);
  };
  const handleKeyDown = (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openPlugin();
    }
  };
  return (
    <article
      role="link"
      tabIndex={0}
      onClick={openPlugin}
      onKeyDown={handleKeyDown}
      className="group flex cursor-pointer flex-col gap-3 rounded-2xl border border-edge bg-surface p-5 transition hover:border-azure-500/40 focus:outline-none focus:ring-2 focus:ring-azure-500/50"
      aria-label={`Open ${plugin.name || "plugin"}`}
    >
      <div className="flex items-center gap-3">
        <div className="grid h-9 w-9 place-items-center rounded-full border border-edge bg-surface2 text-muted">
          <User size={14} />
        </div>
        <div className="min-w-0">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-muted">
            By
          </p>
          <p className="truncate text-sm font-medium text-fg">
            {plugin.authorName || "Unknown creator"}
          </p>
        </div>
      </div>

      <h3 className="min-w-0 font-display text-base font-bold">{plugin.name}</h3>
      <p className="line-clamp-2 text-sm text-muted">{plugin.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-3 text-xs text-muted">
        <span className="flex items-center gap-1">
          <CalendarDays size={12} />
          {new Date(plugin.publishedAt).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
