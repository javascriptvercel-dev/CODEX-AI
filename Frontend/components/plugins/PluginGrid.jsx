import PluginCard from "./PluginCard";

export default function PluginGrid({ plugins, loading }) {
  if (loading) {
    return (
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div
            key={index}
            className="h-[250px] animate-pulse rounded-xl border border-edge bg-surface"
          />
        ))}
      </div>
    );
  }

  if (!plugins.length) {
    return (
      <div className="rounded-xl border border-dashed border-edge px-4 py-20 text-center">
        <p className="text-sm text-muted">No plugins match yet. Be the first to publish one.</p>
      </div>
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
