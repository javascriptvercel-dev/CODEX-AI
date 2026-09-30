"use client";
import { Component, Suspense, lazy } from "react";
import { Wrench } from "lucide-react";
import StateBlock from "@/components/ui/StateBlock";
import { tools } from "@/lib/tools";

/**
 * Loads a tool's UI on demand from the registry (lib/tools.js).
 * Components are created once at module scope, so nothing is rebuilt on
 * re-render and each tool's code is only fetched when it is opened.
 */
const TOOL_COMPONENTS = Object.fromEntries(
  tools.filter((tool) => tool.load).map((tool) => [tool.slug, lazy(tool.load)]),
);

function ToolSkeleton() {
  return (
    <div
      aria-busy="true"
      aria-label="Loading tool"
      className="h-[520px] animate-pulse rounded-xl border border-edge bg-surface sm:h-[600px]"
    />
  );
}

class ToolErrorBoundary extends Component {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  componentDidCatch(error) {
    console.error("[tools] failed to load tool:", error);
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <StateBlock
        tone="error"
        title="This tool couldn't be loaded"
        message="Check your connection and reload the page."
        onRetry={() => window.location.reload()}
        retryLabel="Reload"
      />
    );
  }
}

export default function ToolLoader({ slug }) {
  const Tool = TOOL_COMPONENTS[slug];

  if (!Tool) {
    return (
      <StateBlock
        tone="empty"
        icon={Wrench}
        title="Tool not available"
        message="This tool isn't available right now."
      />
    );
  }

  return (
    <ToolErrorBoundary>
      <Suspense fallback={<ToolSkeleton />}>
        <Tool />
      </Suspense>
    </ToolErrorBoundary>
  );
}
