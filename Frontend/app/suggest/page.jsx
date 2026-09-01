"use client";
import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { api } from "@/lib/api";

export default function SuggestPage() {
  const [email, setEmail] = useState("");
  const [idea, setIdea] = useState("");
  const [status, setStatus] = useState({ state: "idle", message: "" });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus({ state: "loading", message: "" });

    try {
      await api.submitSuggestion({ email, idea });
      setStatus({ state: "success", message: "Thanks — your idea is in." });
      setEmail("");
      setIdea("");
    } catch (error) {
      setStatus({
        state: "error",
        message: "We could not send your suggestion. Please try again in a moment.",
      });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="mx-auto flex w-full max-w-3xl flex-1 px-5 py-12">
        <div className="w-full rounded-2xl border border-edge bg-surface p-6 shadow-glow sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-azure-500/10 text-azure-500">
              <Lightbulb size={18} />
            </span>
            <div>
              <p className="font-mono text-xs font-semibold uppercase tracking-[0.2em] text-azure-500">Suggest</p>
              <h1 className="font-display text-3xl font-bold uppercase tracking-tight text-fg">Share an idea</h1>
            </div>
          </div>

          <p className="mb-6 text-sm text-muted">Tell us what you&apos;d like to see next.</p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-fg">Your email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="font-medium text-fg">Your idea</span>
              <textarea
                required
                rows={5}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                placeholder="A plugin, a feature, an integration — anything."
                className="focus-ring resize-none rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
              />
            </label>

            {status.message ? (
              <p className={`text-sm ${status.state === "error" ? "text-red-400" : "text-azure-500"}`}>
                {status.message}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={status.state === "loading"}
              className="focus-ring mt-2 inline-flex items-center justify-center gap-2 rounded-lg bg-azure-500 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:opacity-60"
            >
              <Send size={15} />
              {status.state === "loading" ? "Sending…" : "Send suggestion"}
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </div>
  );
}
