"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowDownWideNarrow, ArrowUpNarrowWide, Plus } from "lucide-react";
import PluginNavbar from "@/components/layout/PluginNavbar";
import SearchBar from "@/components/plugins/SearchBar";
import PluginGrid from "@/components/plugins/PluginGrid";
import { api } from "@/lib/api";
import { robot } from "@/lib/robot";
import Footer from "@/components/layout/Footer";
import Container from "@/components/ui/Container";
import PageHeader from "@/components/ui/PageHeader";
import Button from "@/components/ui/Button";
import StateBlock from "@/components/ui/StateBlock";
import { sortPluginsByDate } from "@/lib/sortPlugins";

export default function PluginsPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const loadPlugins = async (q) => {
    setLoading(true);
    setError("");
    try {
      const { plugins: data } = await api.listPlugins(q);
      setPlugins(data);
    } catch (err) {
      setPlugins([]);
      setError(err?.message || "We could not load plugins. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!window.localStorage.getItem("codex_robot_plugins_greeting_shown")) {
      robot.say("Looking for something useful?");
      window.localStorage.setItem("codex_robot_plugins_greeting_shown", "true");
    }
    const timer = window.setTimeout(() => loadPlugins(query), 250);
    return () => window.clearTimeout(timer);
  }, [query]);

  // Real date-based sort — previously this just reversed whatever
  // order the API happened to return, which only looked correct
  // when the API's default order was already newest-first.
  const visiblePlugins = sortPluginsByDate(plugins, sortNewestFirst);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <PluginNavbar />

      <main className="flex-1">
        <Container size="wide" className="pb-7 pt-10 text-center">
          <PageHeader
            kicker="Plugins"
            title="Plugins"
            description="Discover and install plugins for your WhatsApp Bot, or create your own plugins and share them with the community."
            titleClassName="sr-only"
            className="mx-auto max-w-md"
          />
        </Container>

        <Container size="wide" className="relative -mt-5 pb-16 sm:-mt-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center">
            <SearchBar value={query} onChange={setQuery} />

            <div className="flex flex-col items-center gap-3 md:flex-row md:flex-shrink-0">
              <button
                type="button"
                onClick={() => setSortNewestFirst((value) => !value)}
                aria-label={sortNewestFirst ? "Showing newest first" : "Showing oldest first"}
                title={sortNewestFirst ? "Newest first" : "Oldest first"}
                className="focus-ring grid h-10 w-10 shrink-0 place-items-center rounded-md border border-edge bg-surface text-fg transition hover:border-azure-500/60 hover:bg-surface2 active:scale-95"
              >
                {sortNewestFirst ? <ArrowDownWideNarrow size={16} /> : <ArrowUpNarrowWide size={16} />}
              </button>
              <Button onClick={() => router.push("/create")}>
                <Plus size={16} />
                Create Plugin
              </Button>
            </div>
          </div>

          <div className="mt-10 sm:mt-12">
            {error ? (
              <StateBlock
                tone="error"
                title="Couldn't load plugins"
                message={error}
                onRetry={() => loadPlugins(query)}
              />
            ) : (
              <PluginGrid plugins={visiblePlugins} loading={loading} />
            )}
          </div>
        </Container>
      </main>
      <Footer />
    </div>
  );
}
