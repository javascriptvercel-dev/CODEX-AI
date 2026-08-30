"use client";
import { useRouter } from "next/navigation";
import { User, CalendarDays, ArrowUpRight } from "lucide-react";
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
      className="group flex cursor-pointer flex-col gap-2.5 rounded-2xl border border-edge bg-surface p-5 transition hover:border-azure-500/40 focus:outline-none focus:ring-2 focus:ring-azure-500/50"
      aria-label={`Open ${plugin.name || "plugin"}`}
    >

      <div className="flex items-start justify-between gap-3">

        <h3 className="min-w-0 font-display text-base font-bold">
          {plugin.name}
        </h3>
        <ArrowUpRight
          size={15}
          className="flex-shrink-0 text-muted transition group-hover:text-azure-500"
        />
      </div>
      <p className="line-clamp-2 text-sm text-muted">{plugin.description}</p>
      <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted">

        <span className="flex items-center gap-1">

          <User size={12} /> {plugin.authorName}
        </span>
        <span className="flex items-center gap-1">

          <CalendarDays size={12} />
          {new Date(plugin.publishedAt).toLocaleDateString()}
        </span>
      </div>
    </article>
  );
}
