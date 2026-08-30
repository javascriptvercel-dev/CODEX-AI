"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import HeroTerminal from "@/components/home/HeroTerminal";
import FeatureGrid from "@/components/home/FeatureGrid";
import SupportModal from "@/components/modals/SupportModal";
import LockedModal from "@/components/modals/LockedModal";
import RepositoryModal from "@/components/modals/RepositoryModal";
import SuggestModal from "@/components/modals/SuggestModal";

export default function HomePage() {
  const [section, setSection] = useState(null);
  const router = useRouter();

  const handleSelect = (key) => {
    if (key === "deploy") return router.push("/deploy");
    if (key === "session") return router.push("/session");
    if (key === "plugins") return router.push("/plugins");
    setSection(key);
  };

  return (
    <div className="flex min-h-screen animate-rise flex-col">
      <Navbar onOpenSection={setSection} />
      <main className="flex-1">
        <section className="mx-auto max-w-6xl px-5 pb-10 pt-12 text-center sm:pt-16">
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
      <Footer onOpenSection={setSection} />
      {section === "support" && <SupportModal onClose={() => setSection(null)} />}
      {section === "repository" && <RepositoryModal onClose={() => setSection(null)} />}
      {section === "suggest" && <SuggestModal onClose={() => setSection(null)} />}
      {(section === "tools" || section === "apis") && (
        <LockedModal
          title={section === "tools" ? "Tools" : "APIs"}
          onClose={() => setSection(null)}
        />
      )}
    </div>
  );
}
