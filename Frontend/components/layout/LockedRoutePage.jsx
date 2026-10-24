import { Lock, Wrench } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import {
  LOCKED_PAGE_STATUS,
  getLockedPageMessage,
} from "@/lib/lockedPages";

export default function LockedRoutePage({ page }) {
  const isRepair = page.status === LOCKED_PAGE_STATUS.REPAIR;
  const Icon = isRepair ? Wrench : Lock;

  return (
    <div className="flex min-h-dvh flex-col bg-bg text-fg">
      <Navbar />
      <main className="mx-auto flex w-full max-w-6xl flex-1 items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <section
          aria-labelledby="locked-page-title"
          className="w-full max-w-2xl rounded-3xl border border-edge bg-surface p-6 text-center shadow-glow sm:p-10"
        >
          <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-full bg-azure-500/10 text-azure-500 sm:h-16 sm:w-16">
            <Icon size={28} aria-hidden="true" />
          </div>
          <p className="font-mono text-sm font-semibold uppercase tracking-[0.18em] text-azure-500">
            {isRepair ? "Temporarily unavailable" : "In development"}
          </p>
          <h1
            id="locked-page-title"
            className="mt-3 font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            {page.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-muted sm:text-base">
            {getLockedPageMessage(page)}
          </p>
          <Button href="/" size="lg" className="mt-6">
            Return home
          </Button>
        </section>
      </main>
      <Footer />
    </div>
  );
}
