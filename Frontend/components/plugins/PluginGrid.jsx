import PluginCard from "./PluginCard";
import StateBlock from "@/components/ui/StateBlock";

function PluginCardSkeleton() {
  return (
    <div className="flex h-full min-w-0 animate-pulse flex-col rounded-xl border border-edge bg-surface p-5">
      <div className="h-6 w-3/4 rounded bg-surface2" />
      <div className="mt-3 space-y-2">
        <div className="h-3.5 w-full rounded bg-surface2" />
        <div className="h-3.5 w-2/3 rounded bg-surface2" />
      </div>
      <div className="mt-auto flex items-center gap-4 pt-4">
        <div className="h-3.5 w-20 rounded bg-surface2" />
        <div className="h-3.5 w-16 rounded bg-surface2" />
      </div>
    </div>
  );
}

export default function PluginGrid({ plugins, loading }) {
  if (loading) {
    return (
      <div
        aria-busy="true"
        aria-label="Loading plugins"
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <PluginCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (!plugins.length) {
    return (
      <StateBlock
        tone="empty"
        dashed
        title="No plugins match yet"
        message="Be the first to publish one."
      />
    );
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {plugins.map((plugin, index) => (
        <div key={plugin.id} className="min-w-0 animate-rise" style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}>
          <PluginCard plugin={plugin} />
        </div>
      ))}
    </div>
  );
}
