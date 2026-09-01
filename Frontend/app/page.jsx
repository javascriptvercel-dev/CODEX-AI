"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroTerminal from "@/components/home/HeroTerminal";
import FeatureGrid from "@/components/home/FeatureGrid";
import LockedModal from "@/components/modals/LockedModal";
import { getLockedPage } from "@/lib/lockedPages";

export default function HomePage() {
  const router = useRouter();
  const [lockedPage, setLockedPage] = useState(null);

  const handleSelect = (key) => {
    const routes = {
      deploy: "/deploy",
      session: "/session",
      plugins: "/plugins",
      support: "/support",
      repository: "/repository",
      suggest: "/suggest",
      tools: "/tools",
      apis: "/apis",
    };

    if (routes[key]) {
      const locked = getLockedPage(routes[key]);
      if (locked) {
        setLockedPage(locked);
        return;
      }

      router.push(routes[key]);
    }
  };

  return (
    <div className="flex min-h-screen animate-rise flex-col">
      <Navbar />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-8 text-center sm:pt-12">
          <h1 className="font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
            CODEX AI
          </h1>
          <p className="mx-auto mt-4 max-w-2xl font-mono text-xs font-semibold uppercase tracking-[0.18em] text-azure-500 sm:text-sm">
            MULTIFUNCTIONAL WHATSAPP BOT BUILT WITH BAILEYS
          </p>
        </section>

        <section className="mx-auto flex max-w-6xl justify-center px-5 pb-16">
          <HeroTerminal />
        </section>

        <section className="mx-auto max-w-6xl px-5 pb-24">
          <FeatureGrid onSelect={handleSelect} />
        </section>
      </main>
      <Footer />
      {lockedPage ? (
        <LockedModal
          title={lockedPage.title}
          status={lockedPage.status}
          message={lockedPage.message}
          onClose={() => setLockedPage(null)}
        />
      ) : null}
    </div>
  );
}
