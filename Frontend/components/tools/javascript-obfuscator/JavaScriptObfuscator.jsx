"use client";

import { useEffect, useState } from "react";
import {
  Check,
  Clipboard,
  Code2,
  Download,
  LoaderCircle,
  Sparkles,
  Crown,
  Upload,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

const MAX_CODE_LENGTH = 50_000;

const MODES = [
  {
    id: "easy",
    name: "Easy",
    description: "Compact output with light transformations.",
  },
  {
    id: "medium",
    name: "Medium",
    description: "Adds string transformations for stronger obfuscation.",
  },
  {
    id: "hard",
    name: "Hard",
    description: "More complex transformations; compatibility may vary.",
  },
];

export default function JavaScriptObfuscator() {
  const { user } = useAuth();
  const [source, setSource] = useState("");
  const [mode, setMode] = useState("easy");
  const [output, setOutput] = useState("");
  const [working, setWorking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");
  const [uploadFile, setUploadFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    let active = true;
    api.dashboardToolSettings()
      .then(({ settings }) => {
        const saved = settings.find((item) => item.tool === "javascript-obfuscator");
        if (active && ["easy", "medium", "hard"].includes(saved?.values?.mode)) {
          setMode(saved.values.mode);
        }
      })
      .catch((requestError) => {
        if (active) setError(requestError.message);
      });
    return () => {
      active = false;
    };
  }, []);

  function updateSource(value) {
    setSource(value);
    setOutput("");
    setCopied(false);
    setError("");
  }

  async function obfuscate(event) {
    event.preventDefault();
    setError("");
    setOutput("");
    setCopied(false);

    if (!source.trim()) {
      setError("Paste JavaScript code to obfuscate.");
      return;
    }
    if (source.length > MAX_CODE_LENGTH) {
      setError("Code must be 50,000 characters or fewer.");
      return;
    }

    setWorking(true);
    try {
      const result = await api.obfuscateJavaScript(source, mode);
      setOutput(result.code);
      showToast("Obfuscated code is ready. Review it before using it.");
    } catch (requestError) {
      setError(requestError?.message || "Could not obfuscate this code.");
    } finally {
      setWorking(false);
    }
  }

  async function copyOutput() {
    try {
      await navigator.clipboard.writeText(output);
      setCopied(true);
      setError("");
      showToast("Obfuscated code copied.");
    } catch {
      setError("Could not copy automatically. Select the output and copy it instead.");
    }
  }

  function downloadOutput() {
    const file = new Blob([output], { type: "text/javascript;charset=utf-8" });
    const downloadUrl = URL.createObjectURL(file);
    const anchor = document.createElement("a");
    anchor.href = downloadUrl;
    anchor.download = "obfuscated.js";
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
  }

  async function obfuscateUpload() {
    if (!uploadFile) {
      setError("Choose a .js file or .zip project to upload.");
      return;
    }
    if (uploadFile.size > 100 * 1024 * 1024) {
      setError("Uploads are limited to 100 MB.");
      return;
    }
    setUploading(true);
    setError("");
    try {
      const blob = await api.obfuscateJavaScriptUpload(uploadFile, mode);
      const downloadUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = downloadUrl;
      anchor.download = `${uploadFile.name.replace(/\.(js|zip)$/i, "")}.obfuscated.${uploadFile.name.toLowerCase().endsWith(".zip") ? "zip" : "js"}`;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      window.setTimeout(() => URL.revokeObjectURL(downloadUrl), 1000);
      showToast("Your obfuscated download is ready.");
    } catch (requestError) {
      setError(requestError?.message || "Could not obfuscate this upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl overflow-hidden rounded-xl border border-edge bg-surface">
      <header className="flex items-start gap-4 border-b border-edge p-5 sm:p-6">
        <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          <Code2 size={21} aria-hidden="true" />
        </span>
        <div>
          <h2 className="font-display text-lg font-bold">Obfuscate JavaScript</h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Choose a strength, paste your code, and generate a harder-to-read version.
          </p>
        </div>
      </header>

      <form onSubmit={obfuscate} className="space-y-5 p-5 sm:p-6">
        <fieldset>
          <legend className="mb-2.5 text-sm font-semibold text-fg">
            Obfuscation strength
          </legend>
          <div className="grid gap-2 sm:grid-cols-3">
            {MODES.map((option) => (
              <label
                key={option.id}
                className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                  mode === option.id
                    ? "border-azure-500/60 bg-azure-500/5"
                    : "border-edge bg-surface2/50 hover:border-azure-500/40"
                }`}
              >
                <input
                  type="radio"
                  name="obfuscation-mode"
                  value={option.id}
                  checked={mode === option.id}
                  onChange={() => {
                    setMode(option.id);
                    setOutput("");
                    setCopied(false);
                    setError("");
                  }}
                  className="mt-1 accent-azure-500"
                />
                <span>
                  <span className="block text-sm font-semibold text-fg">
                    {option.name}
                  </span>
                  <span className="mt-0.5 block text-xs leading-5 text-muted">
                    {option.description}
                  </span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>

        <section className="rounded-lg border border-edge bg-surface2/40 p-4">
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 flex-none place-items-center rounded-lg bg-amber-400/10 text-amber-400">
              {user?.isPremium ? <Crown size={17} aria-hidden="true" /> : <Upload size={17} aria-hidden="true" />}
            </span>
            <div className="min-w-0 flex-1">
              <h3 className="text-sm font-semibold">Obfuscate a file or ZIP project</h3>
              {user?.isPremium ? (
                <>
                  <p className="mt-1 text-xs leading-5 text-muted">
                    Upload JavaScript or a ZIP (up to 100 MB). JavaScript files are obfuscated and other project files are preserved.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-center">
                    <input
                      type="file"
                      accept=".js,.zip,application/zip,text/javascript"
                      onChange={(event) => setUploadFile(event.target.files?.[0] || null)}
                      className="focus-ring min-w-0 flex-1 text-xs text-muted file:mr-3 file:rounded-md file:border-0 file:bg-surface2 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-fg"
                    />
                    <Button type="button" onClick={obfuscateUpload} disabled={uploading || !uploadFile}>
                      {uploading ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
                      {uploading ? "Obfuscating…" : "Upload and obfuscate"}
                    </Button>
                  </div>
                  {uploadFile && <p className="mt-1.5 text-xs text-muted">{uploadFile.name} · {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB</p>}
                </>
              ) : (
                <p className="mt-1 text-xs leading-5 text-muted">
                  File and project uploads are available to Premium members. <a className="font-semibold text-azure-500 hover:underline" href="/dashboard">View Premium in your dashboard</a>.
                </p>
              )}
            </div>
          </div>
        </section>

        <div className="grid gap-4 lg:grid-cols-2">
          <label className="block min-w-0">
            <span className="mb-2 block text-sm font-semibold text-fg">
              Your JavaScript
            </span>
            <textarea
              value={source}
              onChange={(event) => updateSource(event.target.value)}
              maxLength={MAX_CODE_LENGTH}
              rows={16}
              spellCheck={false}
              autoCapitalize="off"
              autoComplete="off"
              placeholder={"function greet(name) {\n  return `Hello, ${name}!`;\n}"}
              className="focus-ring w-full resize-y rounded-lg border border-edge bg-code-surface p-3.5 font-mono text-xs leading-5 text-code-text outline-none placeholder:text-code-placeholder"
            />
            <span className="mt-1.5 block text-right text-xs text-muted">
              {source.length.toLocaleString()} / {MAX_CODE_LENGTH.toLocaleString()}
            </span>
          </label>

          <div className="min-w-0">
            <div className="mb-2 flex min-h-6 items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-fg">Obfuscated output</h3>
              {output && (
                <div className="flex items-center gap-1.5">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={copyOutput}
                  >
                    {copied ? (
                      <Check size={13} aria-hidden="true" />
                    ) : (
                      <Clipboard size={13} aria-hidden="true" />
                    )}
                    {copied ? "Copied" : "Copy"}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={downloadOutput}
                  >
                    <Download size={13} aria-hidden="true" />
                    Download
                  </Button>
                </div>
              )}
            </div>
            <textarea
              value={output}
              readOnly
              rows={16}
              spellCheck={false}
              aria-label="Obfuscated JavaScript output"
              placeholder="Your obfuscated code will appear here."
              className="w-full resize-y rounded-lg border border-edge bg-code-surface p-3.5 font-mono text-xs leading-5 text-code-text outline-none placeholder:text-code-placeholder"
            />
          </div>
        </div>

        <div className="flex flex-col gap-3 border-t border-edge pt-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="max-w-2xl text-xs leading-5 text-muted">
            Obfuscation is not encryption or a security boundary. Never include
            passwords, API keys, or other secrets in browser code. Test the output
            before using it; stronger modes can affect compatibility.
          </p>
          <Button type="submit" disabled={working || !source.trim()}>
            {working ? (
              <LoaderCircle size={16} className="animate-spin" aria-hidden="true" />
            ) : (
              <Sparkles size={16} aria-hidden="true" />
            )}
            {working ? "Obfuscating…" : "Obfuscate code"}
          </Button>
        </div>

        {error && (
          <p
            role="alert"
            className="rounded-lg border border-red-500/30 bg-red-500/5 px-3 py-2 text-sm text-red-400"
          >
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
