"use client";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import PairConsole from "@/components/session/PairConsole";
export default function SessionPage() {
  return (
    <div className="flex min-h-screen animate-rise flex-col">

      <Navbar />
      <main className="flex flex-1 flex-col items-center px-5 py-10">

        <div className="mb-8 max-w-md text-center">

          <p className="mb-3 font-mono text-xs uppercase tracking-[0.2em] text-azure-500">
            Session
          </p>
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">

            Pair your WhatsApp number
          </h1>
          <p className="mt-3 text-sm text-muted">

            Choose a secure linking method to connect your number. Once linked,
            continue to <span className="text-fg">Deploy</span> to configure
            your workspace.
          </p>
        </div>
        <PairConsole />
      </main>
      <Footer />
    </div>
  );
}
