"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import PluginFullView from "@/components/plugins/PluginFullView";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";
export default function PluginDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [plugin, setPlugin] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const load = async () => {
      if (!params?.id) return;
      setLoading(true);
      setError("");
      try {
        const data = await api.getPlugin(params.id);
        const resolved = data?.plugin ?? data;
        if (!active) return;
        setPlugin(resolved);
      } catch {
        if (!active) return;
        setError(
          "We could not load this plugin. Please return to the plugin library and try again.",
        );
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [params?.id]);
  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <Navbar />
        <div className="mx-auto w-full max-w-7xl px-5 pt-4 pb-2 sm:px-6 lg:px-8">
          <span className="inline-flex items-center gap-2 text-sm font-semibold text-muted">
            ← Back to plugins
          </span>
        </div>
        <main className="mx-auto w-full max-w-7xl flex-1 px-5 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="animate-pulse rounded-2xl border border-edge bg-surface p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1 space-y-3">
                <div className="h-8 w-2/3 rounded-lg bg-surface2 sm:h-10" />
                <div className="h-4 w-1/3 rounded bg-surface2" />
              </div>
              <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-row">
                <div className="h-9 w-full rounded-lg bg-surface2 sm:w-28" />
                <div className="h-9 w-full rounded-lg bg-surface2 sm:w-32" />
              </div>
            </div>
            <div className="mt-8 space-y-2 border-t border-edge pt-7">
              <div className="h-4 w-full rounded bg-surface2" />
              <div className="h-4 w-5/6 rounded bg-surface2" />
            </div>
            <div className="mt-8 border-t border-edge pt-7">
              <div className="h-40 rounded-xl border border-edge bg-ink-950/60" />
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  if (error || !plugin) {
    return (
      <div className="flex min-h-dvh flex-col bg-bg text-fg">
        <Navbar />
        <main className="flex flex-1 items-center justify-center px-5 py-12">

        <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6 text-center">

          <TriangleAlert className="mx-auto text-amber-400" size={22} />
          <h1 className="mt-3 font-display text-lg font-bold">
            Plugin unavailable
          </h1>
          <p className="mt-2 text-sm leading-6 text-muted">

            {error || "This plugin could not be found."}
          </p>
          <button
            type="button"
            onClick={() => router.push("/plugins")}
            className="focus-ring mt-5 rounded-lg bg-azure-500 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600"
          >

            Back to plugins
          </button>
        </div>
        </main>
        <Footer />
      </div>
    );
  }
  return <PluginFullView plugin={plugin} />;
}
