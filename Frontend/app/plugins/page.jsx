"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowDownWideNarrow,
  ArrowUpNarrowWide,
  Plus,
} from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
const pluginNavLinks = [
  { href: "/", label: "Home" },
  { href: "/plugins", label: "Plugins" },
  { href: "/create", label: "Create" },
];
import SearchBar from "@/components/plugins/SearchBar";
import PluginGrid from "@/components/plugins/PluginGrid";
import { api } from "@/lib/api";
import { robot } from "@/lib/robot";
export default function PluginsPage() {
  const router = useRouter();
  const [plugins, setPlugins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortNewestFirst, setSortNewestFirst] = useState(true);
  const [modal, setModal] = useState(null);
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
    const t = setTimeout(() => loadPlugins(query), 250);
    return () => clearTimeout(t);
  }, [query]);
  const visiblePlugins = sortNewestFirst ? plugins : [...plugins].reverse();
  return (
    <div className="flex min-h-screen animate-rise flex-col">

      <Navbar navLinks={pluginNavLinks} showCta={false} />
      <main className="flex-1">

        <section className="mx-auto max-w-4xl px-5 pb-4 pt-8 text-center">

          <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-fg sm:text-5xl">
            CODEX PLUGINS
          </h1>
          <p className="mt-3 font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azure-500 sm:text-sm">
            PLUGIN LIBRARY
          </p>
          <p className="mx-auto mt-5 max-w-xl text-muted">
            Discover community plugins and add new capabilities to your bot.
          </p>
        </section>
        <section className="mx-auto max-w-6xl px-5 pb-16 pt-6">

          <div className="mx-auto flex max-w-2xl flex-col gap-2 sm:flex-row sm:items-center">

            <SearchBar value={query} onChange={setQuery} />
            <div className="flex items-center justify-center gap-2 sm:flex-row">

              <button
                type="button"
                onClick={() => setSortNewestFirst((v) => !v)}
                aria-label={
                  sortNewestFirst
                    ? "Showing newest first — click for oldest first"
                    : "Showing oldest first — click for newest first"
                }
                title={sortNewestFirst ? "Newest first" : "Oldest first"}
                className="focus-ring grid h-[42px] w-[42px] flex-shrink-0 place-items-center rounded-lg border border-edge bg-surface2 text-muted transition hover:border-azure-500/60 hover:text-fg active:scale-95"
              >

                {sortNewestFirst ? (
                  <ArrowDownWideNarrow size={16} />
                ) : (
                  <ArrowUpNarrowWide size={16} />
                )}
              </button>
              <button
                type="button"
                onClick={() => router.push("/create")}
                className="focus-ring inline-flex flex-shrink-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-azure-500 px-3 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 active:scale-95"
              >

                <Plus size={15} />
                Create
              </button>
            </div>
          </div>
          <div className="mt-10">

            <PluginGrid plugins={visiblePlugins} loading={loading} />
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}
