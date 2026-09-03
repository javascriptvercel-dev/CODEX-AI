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

export default function PluginsPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);

  const loadPlugins = async (q) => {
    setLoading(true);
    try {
      const { plugins: data } = await api.listPlugins(q);
      setPlugins(data);
    } catch {
      setPlugins([]);
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

  const visiblePlugins = sortNewestFirst ? plugins : [...plugins].reverse();

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <PluginNavbar />

      <main className="flex-1">
        <section className="mx-auto w-full max-w-[1408px] px-4 pb-7 pt-10 text-center sm:px-6 lg:px-8">
          <div className="mx-auto mb-8 max-w-md">
            <p className="mb-3 font-mono text-sm uppercase tracking-normal text-azure-500">
              Plugins
            </p>
            <p className="mt-3 text-sm text-muted">
            Discover and install plugins for your Codex WhatsApp Bot. Create your own plugins and share them with the community.
            </p>
          </div>
        </section>

        <section className="relative -mt-5 mx-auto w-full max-w-[1408px] px-4 pb-16 sm:-mt-6 sm:px-6 lg:px-8">
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
              <button
                type="button"
                onClick={() => router.push("/create")}
                className="focus-ring inline-flex h-10 w-auto shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-azure-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-azure-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-azure-500 focus-visible:ring-offset-2 focus-visible:ring-offset-bg active:scale-[0.98]"
              >
                <Plus size={16} />
                Create Plugin
              </button>
            </div>
          </div>

          <div className="mt-10 sm:mt-12">
            <PluginGrid plugins={visiblePlugins} loading={loading} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
