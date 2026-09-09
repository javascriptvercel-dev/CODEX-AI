"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TriangleAlert } from "lucide-react";
import PluginFullView from "@/components/plugins/PluginFullView";
import PluginNavbar from "@/components/layout/PluginNavbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
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
        <main
          aria-busy="true"
          className="mx-auto w-full max-w-[1408px] flex-1 px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10"
        >
          <span className="sr-only">Loading plugin…</span>
          <div className="mb-7 h-6 w-36 animate-pulse rounded bg-surface2" />
          <div className="animate-pulse overflow-hidden rounded-xl border border-edge bg-surface p-6 sm:p-8 lg:p-10">
            <div className="flex flex-col gap-7 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0 flex-1">
                <div className="h-9 w-2/3 rounded bg-surface2 sm:h-10 lg:h-12" />
                <div className="mt-4 h-4 w-1/3 rounded bg-surface2" />
              </div>
              <div className="flex w-full gap-2 sm:w-auto">
                <div className="h-9 w-28 rounded-lg bg-surface2 sm:h-11" />
                <div className="h-9 w-32 rounded-lg bg-surface2 sm:h-11" />
              </div>
            </div>
            <div className="mt-9 border-t border-edge pt-8">
              <div className="h-5 w-28 rounded bg-surface2" />
              <div className="mt-3 h-20 rounded bg-surface2" />
            </div>
            <div className="mt-9 border-t border-edge pt-8">
              <div className="h-5 w-28 rounded bg-surface2" />
              <div className="mt-4 h-64 rounded bg-surface2" />
            </div>
          </div>
        </main>
      ) : error || !plugin ? (
        <main className="flex flex-1 items-center justify-center px-4 py-12 sm:px-6">
          <div className="w-full max-w-md rounded-xl border border-edge bg-surface p-7 text-center">
            <TriangleAlert className="mx-auto text-amber-400" size={24} aria-hidden="true" />
            <h1 className="mt-4 font-display text-xl font-bold">Plugin unavailable</h1>
            <p className="mt-2 text-sm leading-6 text-muted">{error || "This plugin could not be found."}</p>
            <Button size="lg" className="mt-6" onClick={() => router.push("/plugins")}>
              Back to plugins
            </Button>
          </div>
        </main>
      ) : (
        <PluginFullView plugin={plugin} />
      )}

      <Footer />
    </div>
  );
}
