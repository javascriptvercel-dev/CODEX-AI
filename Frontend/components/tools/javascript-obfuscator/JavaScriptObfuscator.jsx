"use client";

import { useEffect, useRef, useState } from "react";
import {
  Check,
  Clipboard,
  Code2,
  ChevronDown,
  Download,
  FileText,
  LoaderCircle,
  Sparkles,
  Crown,
  Upload,
  UploadCloud,
} from "lucide-react";
import Button from "@/components/ui/Button";
import { api } from "@/lib/api";
import { showToast } from "@/lib/toast";
import { useAuth } from "@/context/AuthContext";

const MAX_CODE_LENGTH = 50_000;
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

const MODES = [
  {
    id: "easy",
    name: "Easy",
    description: "Light transformations with readable line breaks.",
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
  const [dragActive, setDragActive] = useState(false);
  const [uploadSectionOpen, setUploadSectionOpen] = useState(true);
  const uploadInputRef = useRef(null);

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

  function selectUploadFile(file) {
    if (!file) return;
    if (!/\.(js|zip)$/i.test(file.name)) {
      setUploadFile(null);
      setError("Choose a .js file or .zip project.");
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      return;
    }
    if (file.size > MAX_UPLOAD_SIZE) {
      setUploadFile(null);
      setError("Files must be 100 MB or smaller.");
      if (uploadInputRef.current) uploadInputRef.current.value = "";
      return;
    }
    setUploadFile(file);
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
    if (uploadFile.size > MAX_UPLOAD_SIZE) {
      setError("Files must be 100 MB or smaller.");
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
              <button
                type="button"
                aria-expanded={uploadSectionOpen}
                aria-controls="obfuscator-upload-section"
                onClick={() => setUploadSectionOpen((open) => !open)}
                className="focus-ring flex w-full items-center justify-between gap-3 rounded text-left"
              >
                <span className="text-sm font-semibold">Obfuscate a file or ZIP project</span>
                <ChevronDown
                  size={17}
                  aria-hidden="true"
                  className={`flex-none text-muted transition-transform ${uploadSectionOpen ? "rotate-180" : ""}`}
                />
              </button>
              {uploadSectionOpen && (
                <div id="obfuscator-upload-section">
                  {user?.isPremium ? (
                    <>
                      <p className="mt-1 text-xs leading-5 text-muted">
                        Upload JavaScript or a ZIP project. JavaScript files are obfuscated and other project files are preserved.
                      </p>
                      <label
                        htmlFor="obfuscator-upload"
                        onDragEnter={(event) => {
                          event.preventDefault();
                          setDragActive(true);
                        }}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.dataTransfer.dropEffect = "copy";
                          setDragActive(true);
                        }}
                        onDragLeave={(event) => {
                          if (!event.currentTarget.contains(event.relatedTarget)) {
                            setDragActive(false);
                          }
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragActive(false);
                          selectUploadFile(event.dataTransfer.files?.[0]);
                        }}
                        className={`focus-within:ring-2 focus-within:ring-azure-500 focus-within:ring-offset-2 mt-4 flex min-h-48 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-5 py-6 text-center transition-colors ${
                          dragActive
                            ? "border-azure-500 bg-azure-500/10"
                            : "border-edge bg-surface2/30 hover:border-azure-500/60"
                        }`}
                      >
                        {uploadFile ? (
                          <div aria-live="polite" className="flex max-w-full items-center gap-3">
                            <span className="grid h-11 w-11 flex-none place-items-center rounded-lg bg-azure-500/10 text-azure-500">
                              <FileText size={21} aria-hidden="true" />
                            </span>
                            <span className="min-w-0 text-left">
                              <span className="block max-w-full truncate text-sm font-semibold text-fg">
                                {uploadFile.name}
                              </span>
                              <span className="mt-1 block text-xs text-muted">
                                {(uploadFile.size / (1024 * 1024)).toFixed(2)} MB · Ready to obfuscate
                              </span>
                            </span>
                          </div>
                        ) : (
                          <>
                            <UploadCloud size={32} className="text-muted" aria-hidden="true" />
                            <p className="mt-3 text-sm font-semibold text-fg">
                              Drag and drop your file here
                            </p>
                            <p className="mt-1 text-sm text-muted">or</p>
                          </>
                        )}
                        <input
                          ref={uploadInputRef}
                          id="obfuscator-upload"
                          type="file"
                          accept=".js,.zip,application/zip,text/javascript"
                          onChange={(event) => selectUploadFile(event.target.files?.[0])}
                          className="sr-only"
                        />
                        <span className="mt-1 rounded px-2 py-1 text-sm font-semibold text-azure-500 hover:text-azure-600">
                          {uploadFile ? "Choose a different file" : "Browse files"}
                        </span>
                        <p className="mt-2 text-xs text-muted">Accepted: .js and .zip · Maximum size: 100 MB</p>
                      </label>
                      <div className="mt-3 flex justify-end">
                        <Button type="button" onClick={obfuscateUpload} disabled={uploading || !uploadFile}>
                          {uploading ? <LoaderCircle size={15} className="animate-spin" /> : <Upload size={15} />}
                          {uploading ? "Obfuscating…" : "Upload and obfuscate"}
                        </Button>
                      </div>
                    </>
                  ) : (
                    <p className="mt-1 text-xs leading-5 text-muted">
                      File and project uploads are available to Premium members. <a className="font-semibold text-azure-500 hover:underline" href="/dashboard">View Premium in your dashboard</a>.
                    </p>
                  )}
                </div>
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
