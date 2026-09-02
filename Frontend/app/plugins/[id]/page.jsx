"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import PluginFullView from "@/components/plugins/PluginFullView";
import PluginNavbar from "@/components/layout/PluginNavbar";
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
        if (active) setPlugin(resolved);
      } catch {
        if (active) setError("We could not load this plugin. Please return to the plugin library and try again.");
      } finally {
        if (active) setLoading(false);
      }
    };
    load();
    return () => {
      active = false;
    };
  }, [params?.id]);

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <PluginNavbar />

      {loading ? (
        <main className="mx-auto w-full max-w-[1408px] flex-1 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <div className="mb-7 h-5 w-36 animate-pulse rounded bg-surface2" />
          <div className="animate-pulse rounded-xl border border-edge bg-surface p-6 sm:p-8 lg:p-10">
            <div className="h-10 w-2/3 rounded bg-surface2" />
            <div className="mt-4 h-4 w-1/3 rounded bg-surface2" />
            <div className="mt-10 h-24 rounded bg-surface2" />
            <div className="mt-8 h-64 rounded bg-surface2" />
          </div>
        </main>
      ) : error || !plugin ? (
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md rounded-xl border border-edge bg-surface p-7 text-center">
            <TriangleAlert className="mx-auto text-amber-400" size={24} />
            <h1 className="mt-4 font-display text-xl font-bold">Plugin unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{error || "This plugin could not be found."}</p>
            <button
              type="button"
              onClick={() => router.push("/plugins")}
              className="focus-ring mt-6 rounded-lg bg-azure-500 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600"
            >
              Back to plugins
            </button>
          </div>
        </main>
      ) : (
        <PluginFullView plugin={plugin} />
      )}
    </div>
  );
}
