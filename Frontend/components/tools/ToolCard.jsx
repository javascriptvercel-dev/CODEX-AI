import Link from "next/link";
import { isToolOpenable } from "@/lib/tools";

const MASK =
  "radial-gradient(ellipse 80% 90% at 50% 30%, #000 40%, transparent 100%)";

function Preview({ tool }) {
  return (
    <div
      aria-hidden="true"
      className="relative isolate h-32 overflow-hidden rounded-lg border border-edge bg-ink-950"
    >
      {tool.preview ? (
        <div
          className="absolute inset-0 -z-10 opacity-70 transition duration-300 group-hover:scale-105 group-hover:opacity-90"
          style={{
            backgroundImage: `url("${tool.preview}")`,
            backgroundSize: "cover",
            backgroundPosition: "center 20%",
            filter: "grayscale(1) contrast(1.1)",
            WebkitMaskImage: MASK,
            maskImage: MASK,
          }}
        />
      ) : (
        <div className="absolute inset-0 -z-10 bg-gradient-to-br from-azure-500/25 to-transparent" />
      )}
    </div>
  );
}

function Body({ tool, openable }) {
  return (
    <>
      <Preview tool={tool} />

      <h3 className="mt-4 min-w-0 truncate font-display text-lg font-bold leading-tight tracking-[-0.02em]">
        {tool.name}
      </h3>
      <p className="mt-1.5 line-clamp-2 min-w-0 text-[15px] leading-6 text-muted [overflow-wrap:anywhere]">
        {tool.description}
      </p>

      <div className="mt-auto pt-4">
        <ul className="flex min-w-0 flex-wrap gap-1.5">
          {(tool.tags || []).map((tag) => (
            <li
              key={tag}
              className="rounded-[3px] border border-edge bg-surface2 px-2 py-0.5 font-mono text-[11px] text-muted"
            >
              {tag}
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

export default function ToolCard({ tool }) {
  const openable = isToolOpenable(tool);

  if (!openable) {
    return (
      <div className="flex h-full min-w-0 flex-col rounded-xl border border-edge bg-surface p-4 opacity-70">
        <Body tool={tool} openable={false} />
      </div>
    );
  }

  return (
    <Link
      href={`/tools/${tool.slug}`}
      aria-label={`Open ${tool.name}`}
      className="focus-ring group flex h-full min-w-0 flex-col rounded-xl border border-edge bg-surface p-4 transition duration-200 hover:-translate-y-0.5 hover:border-azure-500/40 hover:bg-surface2 hover:shadow-glow"
    >
      <Body tool={tool} openable />
    </Link>
  );
}
