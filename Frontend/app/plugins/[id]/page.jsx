"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { TriangleAlert, Loader2 } from "lucide-react";
import PluginFullView from "@/components/plugins/PluginFullView";
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
      <main className="flex min-h-screen items-center justify-center bg-ink-950 px-5 text-fg">
        
        <div className="flex items-center gap-2 text-sm text-muted">
          
          <Loader2 size={16} className="animate-spin" /> Loading plugin…
        </div>
      </main>
    );
  }
  if (error || !plugin) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-ink-950 px-5 text-fg">
        
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
    );
  }
  return <PluginFullView plugin={plugin} />;
}
