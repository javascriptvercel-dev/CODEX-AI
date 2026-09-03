"use client";
import { Github } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const REPO_URL = "https://github.com/codexverified/CODEX-AI";

export default function RepositoryPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center px-5 py-12">
        <div className="rounded-2xl border border-edge bg-surface p-8 shadow-glow sm:p-10">
          <div className="mb-5 flex items-center gap-3 text-azure-500">
            <Github size={24} />
            <p className="font-mono text-sm font-semibold uppercase tracking-[0.2em]">Repository</p>
          </div>

          <h1 className="font-display text-4xl font-bold uppercase tracking-tight text-fg">Explore the project</h1>
          <p className="mt-4 max-w-xl text-sm leading-6 text-muted">
            Review the codebase, keep up with updates, report issues, and contribute improvements to the CODEX AI ecosystem.
          </p>

          <a
            href={REPO_URL}
            target="_blank"
            rel="noreferrer noopener"
            className="focus-ring mt-8 inline-flex items-center justify-center gap-2 rounded-xl border border-edge bg-surface2 px-4 py-3 text-sm font-semibold text-fg transition hover:border-azure-500/60"
          >
            <Github size={17} />
            View on GitHub
          </a>
        </div>
      </main>
      <Footer />
    </div>
  );
}
