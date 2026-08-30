"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { UploadCloud, PackagePlus } from "lucide-react";
import { api } from "@/lib/api";
export default function PluginSubmitForm() {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [code, setCode] = useState("");
  const [file, setFile] = useState(null);
  const [status, setStatus] = useState({ state: "idle", message: "" });
  const hasCode = code.trim().length > 0;
  const hasFileSelected = Boolean(file);
  const canSubmit =
    title.trim().length > 0 &&
    description.trim().length > 0 &&
    (hasCode || hasFileSelected);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit) return;

    setStatus({ state: "loading", message: "" });
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      if (hasCode) formData.append("code", code);
      if (file) formData.append("file", file);
      await api.submitPlugin(formData);
      setStatus({
        state: "success",
        message:
          "Submitted — you'll see it in the library once it's approved by our team.",
      });
    } catch (err) {
      setStatus({
        state: "error",
        message:
          err?.message ||
          "We could not submit this plugin for review. Please check the form and try again.",
      });
    }
  };
  if (status.state === "success") {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-edge bg-surface py-16 text-center">
        
        <span className="grid h-12 w-12 place-items-center rounded-full bg-azure-500/10 text-azure-500">
          
          <PackagePlus size={20} />
        </span>
        <p className="max-w-sm text-sm text-muted">{status.message}</p>
        <button
          type="button"
          onClick={() => router.push("/plugins")}
          className="focus-ring mt-2 rounded-lg bg-azure-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-azure-600"
        >
          
          Back to plugins
        </button>
      </div>
    );
  }
  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4 rounded-2xl border border-edge bg-surface p-6 sm:p-8"
    >
      
      <label className="flex flex-col gap-1.5 text-sm">
        
        <span className="font-medium">Plugin name</span>
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Weather Assistant"
          className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        
        <span className="font-medium">Description</span>
        <textarea
          required
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does it do, and who is it for?"
          className="focus-ring resize-none rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-sm">
        
        <span className="font-medium">Code (optional if uploading a file)</span>
        <textarea
          rows={10}
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Paste your plugin's source here, or upload a file instead"
          spellCheck={false}
          className="focus-ring resize-none rounded-lg border border-edge bg-ink-950 px-3 py-2.5 font-mono text-xs text-azure-300 outline-none placeholder:text-white/30"
        />
      </label>
      <label className="flex cursor-pointer flex-col gap-1.5 text-sm">
        
        <span className="font-medium">File (optional, max 5MB)</span>
        <span className="focus-ring flex items-center gap-2 rounded-lg border border-dashed border-edge bg-surface2 px-3 py-3 text-xs text-muted">
          
          <UploadCloud size={15} />
          {file ? file.name : "Attach a zip, script, or asset"}
          <input
            type="file"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </span>
      </label>
      {status.message && (
        <p className="text-sm text-red-400">{status.message}</p>
      )}
      <button
        type="submit"
        disabled={status.state === "loading" || !canSubmit}
        className="focus-ring mt-1 rounded-lg bg-azure-500 py-2.5 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:cursor-not-allowed disabled:opacity-45"
      >
        
        {status.state === "loading" ? "Submitting…" : "Submit for review"}
      </button>
    </form>
  );
}
