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
        <section className="border-b border-edge bg-surface/40">
          <div className="mx-auto grid max-w-6xl items-center gap-10 px-5 py-14 lg:grid-cols-[1.05fr_1fr] lg:py-20">
            <div className="text-center lg:text-left">
              <span className="inline-flex items-center gap-2 rounded-[3px] border border-azure-500/30 bg-azure-500/10 px-2.5 py-1 font-mono text-[11px] font-semibold uppercase tracking-[0.18em] text-azure-500">
                Built with Baileys
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold uppercase leading-[1.05] tracking-tight sm:text-6xl">
                CODEX AI
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-muted lg:mx-0 sm:text-base">
                A multifunctional WhatsApp bot with a plugin marketplace. Pair
                your number, deploy in minutes.
              </p>
              <div className="mt-7 flex flex-wrap justify-center gap-2.5 lg:justify-start">
              </div>
            </div>
            <div className="flex justify-center lg:justify-end">
              <HeroTerminal />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-14">
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
