"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PackagePlus, UploadCloud } from "lucide-react";
import { api } from "@/lib/api";

export default function PluginSubmitForm({ onSubmitted, onBack, submitLabel = "Submit for review" }) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const MAX_FILE_SIZE = 5 * 1024 * 1024;
  const hasCode = code.trim().length > 0;
  const hasFileSelected = Boolean(file);
  const canSubmit = title.trim().length > 0 && description.trim().length > 0 && (hasCode || hasFileSelected);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!canSubmit) return;
    if (file && file.size > MAX_FILE_SIZE) {
      setStatus({ state: "error", message: "That file is larger than 5MB. Please choose a smaller file." });
      return;
    }

    setStatus({ state: "loading", message: "" });
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (hasCode) formData.append("code", code);
      if (file) formData.append("file", file);
      await api.submitPlugin(formData);
      onSubmitted?.();
      setStatus({ state: "success", message: "Submitted — you'll see it in the library once it's approved by our team." });
    } catch (err) {
      setStatus({ state: "error", message: err?.message || "We could not submit this plugin for review. Please check the form and try again." });
    }
  };

  if (status.state === "success") {
    return (
      <div className="flex flex-col items-center gap-4 rounded-xl border border-edge bg-surface px-5 py-20 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-azure-500/10 text-azure-500"><PackagePlus size={21} /></span>
        <p className="max-w-sm text-sm leading-6 text-muted [overflow-wrap:anywhere]">{status.message}</p>
        <button type="button" onClick={() => (onSubmitted ? onSubmitted() : router.push("/plugins"))} className="focus-ring mt-2 rounded-lg bg-azure-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-azure-600">{onSubmitted ? "Review submissions" : "Back to plugins"}</button>
      </div>
    );
  }

  return (
    <div>
      {onBack ? (
        <button
          type="button"
          onClick={onBack}
          className="focus-ring mb-6 inline-flex items-center gap-2 rounded-md text-sm font-semibold text-fg transition hover:text-azure-500 sm:text-[15px]"
        >
          <ArrowLeft size={18} /> Back to submissions
        </button>
      ) : null}
      <form onSubmit={handleSubmit} className="rounded-xl border border-edge bg-surface p-6 sm:p-8 lg:p-8 xl:p-9">
      <div className="mb-8">
        <h1 className="font-display text-[30px] font-bold tracking-[-0.025em] sm:text-4xl">Create a New Plugin</h1>
      </div>

      <div className="grid gap-6">
        <label className="flex flex-col gap-2 text-base">
          <span className="font-semibold">Plugin Name</span>
          <input required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g., weather-forecast" className="focus-ring h-[50px] rounded-lg border border-edge bg-surface2 px-3.5 text-base outline-none placeholder:text-muted/80" />
        </label>

        <label className="flex flex-col gap-2 text-base">
          <span className="font-semibold">Description</span>
          <textarea required rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Describe what your plugin does..." className="focus-ring min-h-[108px] resize-y rounded-lg border border-edge bg-surface2 px-3.5 py-3 text-base outline-none placeholder:text-muted/80" />
        </label>

        <label className="flex flex-col gap-2 text-base">
          <span className="font-semibold">Plugin Code</span>
          <textarea rows={14} value={code} onChange={(e) => setCode(e.target.value)} placeholder="Paste your plugin's source here, or upload a file instead" spellCheck={false} className="focus-ring min-h-[260px] resize-y rounded-lg border border-edge bg-ink-950 px-3.5 py-3 font-mono text-sm leading-6 text-azure-300 outline-none placeholder:text-white/30" />
        </label>

        <label className="flex cursor-pointer flex-col gap-2 text-base">
          <span className="font-semibold">Plugin File <span className="font-normal text-muted">(optional, max 5MB)</span></span>
          <span className="focus-ring flex min-w-0 items-center gap-3 rounded-lg border border-dashed border-edge bg-ink-950 px-3.5 py-3.5 text-sm text-muted">
            <UploadCloud size={17} className="shrink-0" />
            <span className="min-w-0 truncate">{file ? file.name : "Attach a zip, script, or asset"}</span>
            <input type="file" className="hidden" onChange={(e) => {
              const selected = e.target.files?.[0] || null;
              if (selected && selected.size > MAX_FILE_SIZE) {
                setFile(null);
                setStatus({ state: "error", message: "That file is larger than 5MB. Please choose a smaller file." });
                e.target.value = "";
                return;
              }
              setStatus({ state: "idle", message: "" });
              setFile(selected);
            }} />
          </span>
        </label>

        {status.message ? <p className="text-sm leading-6 text-red-400">{status.message}</p> : null}

        <button type="submit" disabled={status.state === "loading" || !canSubmit} className="focus-ring mt-1 h-12 rounded-lg bg-azure-500 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:cursor-not-allowed disabled:opacity-45">
          {status.state === "loading" ? "Submitting…" : submitLabel}
        </button>
      </div>
      </form>
    </div>
  );
}
