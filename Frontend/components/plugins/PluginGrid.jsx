import PluginCard from "./PluginCard";
export default function PluginGrid({ plugins, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="h-40 animate-pulse rounded-2xl border border-edge bg-surface"
          />
        ))}
      </div>
    );
  }
  if (!plugins.length) {
    return (
      <div className="rounded-2xl border border-dashed border-edge px-4 py-16 text-center">

        <p className="text-sm text-muted">
          No plugins match yet. Be the first to publish one.
        </p>
      </div>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">

      {plugins.map((plugin, i) => (
        <div
          key={plugin.id}
          className="animate-rise"
          style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
        >

          <PluginCard plugin={plugin} />
        </div>
      ))}
    </div>
  );
}
