"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import CreateNavbar from "@/components/layout/CreateNavbar";
import AuthModal from "@/components/auth/AuthModal";
import PluginSubmitForm from "@/components/plugins/PluginSubmitForm";
import { useAuth } from "@/context/AuthContext";
export default function CreatePluginPage() {
  const { user, loading, hasFreshSession } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const fromConsole =
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).get("from") === "console";

    if (user?.role === "admin" && !fromConsole) {
      router.replace("/console");
    }
  }, [user, router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        
        <div className="h-8 w-8 animate-pulse rounded-full bg-azure-500/30" />
      </div>
    );
  }
  const needsAuth = !user || !hasFreshSession();
  if (needsAuth) {
    return (
      <div className="min-h-screen bg-bg">
        
        <AuthModal
          message={
            !user
              ? "Sign in to submit a plugin."
              : "For your security, please sign in again to continue."
          }
          onClose={() => router.push("/plugins")}
        />
      </div>
    );
  }
  return (
    <div className="flex min-h-screen animate-rise flex-col">
      
      <CreateNavbar />
      <main className="flex-1">
        
        <section className="mx-auto max-w-3xl px-5 py-12">
          
          <p className="mb-2 font-mono text-xs uppercase tracking-[0.2em] text-azure-500">
            New submission
          </p>
          <h1 className="mb-6 font-display text-3xl font-bold tracking-tight">
            Submit a plugin
          </h1>
          <PluginSubmitForm />
        </section>
      </main>
    </div>
  );
}
