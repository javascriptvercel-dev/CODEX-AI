"use client";
import { useMemo, useState } from "react";
import { Lightbulb, Search, Wrench } from "lucide-react";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import StateBlock from "@/components/ui/StateBlock";
import { tools } from "@/lib/tools";
import ToolCard from "./ToolCard";

// The search box only earns its space once there is something to search.
const SEARCH_MIN_TOOLS = 4;

export default function ToolsHub() {
  const [query, setQuery] = useState("");

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return tools;
    return tools.filter((tool) =>
      [tool.name, tool.description, ...(tool.tags || [])]
        .join(" ")
        .toLowerCase()
        .includes(q),
    );
  }, [query]);

  return (
    <>
      <Container size="wide" className="pb-7 pt-10 text-center">
        <PageHeader
          kicker="Tools"
          icon={Wrench}
          description="Free utilities for everyone."
          className="mx-auto max-w-md"
        />
      </Container>

      <Container size="wide" className="pb-16">
        {tools.length >= SEARCH_MIN_TOOLS ? (
          <div className="relative mb-8 max-w-xl">
            <label htmlFor="tool-search" className="sr-only">
              Search tools
            </label>
            <Search
              size={16}
              aria-hidden="true"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            />
            <input
              id="tool-search"
              type="search"
              autoComplete="off"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search tools…"
              className="focus-ring w-full rounded-lg border border-edge bg-surface2 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-muted/70"
            />
          </div>
        ) : null}

        {visible.length ? (
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visible.map((tool, index) => (
              <li
                key={tool.slug}
                className="min-w-0 animate-rise"
                style={{ animationDelay: `${Math.min(index, 8) * 60}ms` }}
              >
                <ToolCard tool={tool} />
              </li>
            ))}

            {!query ? (
              <li className="min-w-0">
                <div className="flex h-full min-h-[240px] flex-col items-center justify-center rounded-xl border border-dashed border-edge p-6 text-center transition hover:border-azure-500/60 hover:bg-surface">
                  <span className="grid h-11 w-11 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
                    <Lightbulb size={19} aria-hidden="true" />
                  </span>
                  <span className="mt-4 font-display text-base font-bold">
                    More tools on the way
                  </span>
                  <span className="mt-1 max-w-[220px] text-sm leading-6 text-muted">
                    New utilities are coming soon.
                  </span>
                </div>
              </li>
            ) : null}
          </ul>
        ) : (
          <StateBlock
            tone="empty"
            dashed
            title="No tools match your search"
            message="Try a different keyword."
          />
        )}
      </Container>
    </>
  );
}
