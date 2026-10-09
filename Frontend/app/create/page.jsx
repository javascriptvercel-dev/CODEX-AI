"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import PluginNavbar from "@/components/layout/PluginNavbar";
import Footer from "@/components/layout/Footer";
import PluginSubmitForm from "@/components/plugins/PluginSubmitForm";
import { useAuth } from "@/context/AuthContext";

export default function CreatePluginPage() {
  const { user, loading, hasFreshSession } = useAuth();
  const router = useRouter();

  const fromConsole =
    typeof window !== "undefined" &&
    new URLSearchParams(window.location.search).get("from") === "console";

  useEffect(() => {
    if (loading) return;

    if (user?.role === "admin" && !fromConsole) {
      router.replace("/console");
      return;
    }

    if (!user || !hasFreshSession()) {
      router.replace("/login?next=%2Fcreate&cancel=%2Fplugins");
    }
  }, [loading, user, hasFreshSession, router, fromConsole]);

  if (loading) {
    return null;
  }

  if (user?.role === "admin" && !fromConsole) {
    return null;
  }

  const needsAuth = !user || !hasFreshSession();
  if (needsAuth) {
    return <div className="min-h-dvh bg-bg" />;
  }

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <PluginNavbar />
      <main className="flex-1">
        <section className="mx-auto w-full max-w-[1408px] px-4 py-7 sm:px-6 sm:py-9 lg:px-8 lg:py-10">
          <Link
            href="/plugins"
            className="focus-ring mb-8 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-fg transition hover:text-azure-500 sm:text-[15px]"
          >
            <ArrowLeft size={18} /> Back to plugins
          </Link>
          <PluginSubmitForm />
        </section>
      </main>
      <Footer />
    </div>
  );
}
