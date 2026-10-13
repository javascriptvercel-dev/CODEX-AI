"use client";
import { Component, Suspense, lazy } from "react";
import { LockKeyhole, LoaderCircle, Wrench } from "lucide-react";
import Button from "@/components/ui/Button";
import StateBlock from "@/components/ui/StateBlock";
import { useAuth } from "@/context/AuthContext";
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
  const { user, loading } = useAuth();
  const Tool = TOOL_COMPONENTS[slug];
  const tool = tools.find((item) => item.slug === slug);

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

  if (loading) {
    return (
      <div className="grid min-h-80 place-items-center rounded-xl border border-edge bg-surface">
        <p className="inline-flex items-center gap-2 text-sm text-muted">
          <LoaderCircle size={17} className="animate-spin" aria-hidden="true" />
          Checking your account…
        </p>
      </div>
    );
  }

  if (!user) {
    const toolPath = `/tools/${slug}`;
    const signInPath = `/login?next=${encodeURIComponent(toolPath)}&cancel=${encodeURIComponent(toolPath)}`;
    return (
      <div className="mx-auto max-w-2xl rounded-2xl border border-edge bg-surface p-6 text-center sm:p-10">
        <span className="mx-auto grid h-12 w-12 place-items-center rounded-xl bg-azure-500/10 text-azure-500">
          <LockKeyhole size={21} aria-hidden="true" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">
          Sign in to use {tool?.name || "this tool"}
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
          Sign in with your CODEX AI account to use this tool. You&apos;ll return
          here after signing in, or if you close the sign-in form.
        </p>
        <Button href={signInPath} className="mt-5">
          Sign in to continue
        </Button>
      </div>
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
