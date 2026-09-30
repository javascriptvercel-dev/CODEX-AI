const STATUS = {
  live: { label: "Live", dot: "bg-emerald-500" },
  beta: { label: "Beta", dot: "bg-azure-500" },
  soon: { label: "Coming soon", dot: "bg-muted" },
};

export default function ToolStatusBadge({ status = "live", className = "" }) {
  const { label, dot } = STATUS[status] || STATUS.live;

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border border-edge bg-surface2 px-2.5 py-0.5 text-xs font-semibold text-fg ${className}`}
    >
      <span className={`h-1.5 w-1.5 rounded-full ${dot}`} aria-hidden="true" />
      {label}
    </span>
  );
}
