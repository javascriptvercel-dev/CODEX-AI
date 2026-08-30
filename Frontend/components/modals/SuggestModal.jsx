"use client";
import { useState } from "react";
import { Lightbulb, Send } from "lucide-react";
import Modal from "./Modal";
import { api } from "@/lib/api";
export default function SuggestModal({ onClose }) {
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
    } catch (err) {
      setStatus({
        state: "error",
        message:
          "We could not send your suggestion. Please try again in a moment.",
      });
    }
  };
  return (
    <Modal
      title="Suggest an idea"
      icon={<Lightbulb size={18} className="text-azure-500" />}
      onClose={onClose}
    >
      
      <p className="mb-4 text-sm text-muted">
        Tell us what you&apos;d like to see next.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        
        <label className="flex flex-col gap-1.5 text-sm">
          
          <span className="font-medium">Your email</span>
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
          
          <span className="font-medium">Your idea</span>
          <textarea
            required
            rows={4}
            value={idea}
            onChange={(e) => setIdea(e.target.value)}
            placeholder="A plugin, a feature, an integration — anything."
            className="focus-ring resize-none rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
          />
        </label>
        {status.message && (
          <p
            className={`text-sm ${status.state === "error" ? "text-red-400" : "text-azure-500"}`}
          >
            {status.message}
          </p>
        )}
        <button
          type="submit"
          disabled={status.state === "loading"}
          className="focus-ring mt-1 flex items-center justify-center gap-2 rounded-lg bg-azure-500 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:opacity-60"
        >
          <Send size={15} />
          {status.state === "loading" ? "Sending…" : "Send suggestion"}
        </button>
      </form>
    </Modal>
  );
}
