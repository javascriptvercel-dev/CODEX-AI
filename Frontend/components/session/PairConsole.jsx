"use client";
import { useEffect, useRef, useState } from "react";
import {
  KeyRound,
  QrCode,
  Satellite,
  Copy,
  Check,
  Loader2,
  TriangleAlert,
} from "lucide-react";
import { API_URL } from "@/lib/api";
const FAIL_PATTERN = /unavailable|failed|invalid|error/i;
export default function PairConsole() {
  const [mode, setMode] = useState("pair");
  const [number, setNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [loaderLabel, setLoaderLabel] = useState("");
  const [result, setResult] = useState({ state: "idle", text: "" });
  const [qr, setQr] = useState(null);
  const [copied, setCopied] = useState(false);
  const requestController = useRef(null);
  const requestQR = async (signal) => {
    setLoading(true);
    setLoaderLabel("GENERATING QR CODE...");
    setResult({ state: "idle", text: "" });
    setQr(null);
    try {
      const res = await fetch(`${API_URL}/api/whatsapp/qr`, { signal });
      const data = await res.json().catch(() => ({}));
      if (data.qr) {
        setQr({
          image: data.qr,
          hint: data.message || "Scan this code with WhatsApp to continue",
        });
      } else {
        setResult({
          state: "error",
          text: "We could not generate a QR code right now. Please try again.",
        });
      }
    } catch (error) {
      if (error?.name === "AbortError") return;
      setResult({
        state: "error",
        text: "We could not reach the session service. Please try again.",
      });
    } finally {
      if (requestController.current?.signal === signal) {
        requestController.current = null;
        setLoading(false);
      }
    }
  };
  useEffect(() => {
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoading(false);
    setLoaderLabel("");
    setResult({ state: "idle", text: "" });
    setQr(null);
    setCopied(false);
    if (mode === "qr") requestQR(controller.signal);
    return () => {
      controller.abort();
      if (requestController.current === controller)
        requestController.current = null;
    };
  }, [mode]);
  const canRequestPairCode = number.trim().replace(/[^0-9]/g, "").length > 0;
  const requestPairCode = async () => {
    const num = number.trim().replace(/[^0-9]/g, "");
    if (!num || !canRequestPairCode) return;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    setLoaderLabel("GENERATING PAIRING CODE...");
    setLoading(true);
    setResult({ state: "idle", text: "" });
    try {
      const res = await fetch(
        `${API_URL}/api/whatsapp?number=${encodeURIComponent(num)}`,
        { signal: controller.signal },
      );
      const data = await res.json().catch(() => ({}));
      const code = data.code;
      const failed = !code || FAIL_PATTERN.test(String(code));
      setResult({
        state: failed ? "error" : "ok",
        text: failed
          ? "We could not generate a pairing code. Please verify the number and try again."
          : code,
      });
    } catch (error) {
      if (error?.name === "AbortError") return;
      setResult({
        state: "error",
        text: "We could not reach the session service. Please try again.",
      });
    } finally {
      if (requestController.current === controller) {
        requestController.current = null;
        setLoading(false);
      }
    }
  };
  const copyCode = async () => {
    if (result.state !== "ok" || !result.text) return;
    try {
      await navigator.clipboard.writeText(result.text);
    } catch {
      setResult({
        state: "error",
        text: "We could not copy the code. Please copy it manually.",
      });
      return;
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <div className="w-full max-w-md rounded-2xl border border-edge bg-surface p-6 sm:p-8">
      
      <div className="mb-5 flex items-center gap-2.5">
        
        <span className="grid h-9 w-9 place-items-center rounded-lg bg-azure-500/10 text-azure-500">
          
          <Satellite size={17} />
        </span>
        <div>
          
          <h2 className="font-display text-base font-bold">Link device</h2>
          <p className="text-xs text-muted">
            Securely link a WhatsApp number to your workspace
          </p>
        </div>
      </div>
      <div className="mb-5 grid grid-cols-2 gap-1 rounded-xl border border-edge bg-surface2 p-1">
        
        <button
          type="button"
          onClick={() => setMode("pair")}
          className={`focus-ring flex min-w-0 items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "pair" ? "bg-azure-500 text-white" : "text-muted hover:text-fg"}`}
        >
          
          <span className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap">
            
            <KeyRound size={13} /> Pair Code
          </span>
        </button>
        <button
          type="button"
          onClick={() => setMode("qr")}
          className={`focus-ring flex min-w-0 items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition ${mode === "qr" ? "bg-azure-500 text-white" : "text-muted hover:text-fg"}`}
        >
          
          <span className="inline-flex min-w-0 items-center justify-center gap-1.5 whitespace-nowrap">
            
            <QrCode size={13} /> QR Code
          </span>
        </button>
      </div>
      {mode === "pair" && (
        <>
          
          <label className="mb-4 flex flex-col gap-1.5 text-sm">
            
            <span className="font-medium">
              
              WhatsApp Number <span className="text-azure-500">*</span>
            </span>
            <input
              type="tel"
              value={number}
              onChange={(e) => setNumber(e.target.value)}
              placeholder="e.g. 2347019135989"
              autoComplete="off"
              className="focus-ring rounded-lg border border-edge bg-surface2 px-3 py-2.5 text-sm outline-none placeholder:text-muted/70"
            />
          </label>
          <button
            type="button"
            onClick={requestPairCode}
            disabled={loading || !canRequestPairCode}
            className="focus-ring mb-4 flex w-full items-center justify-center gap-2 rounded-lg bg-azure-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-azure-600 disabled:cursor-not-allowed disabled:opacity-45"
          >
            
            {loading ? (
              <Loader2 size={15} className="animate-spin" />
            ) : (
              <Satellite size={15} />
            )}
            Request Pairing Code
          </button>
        </>
      )}
      {loading && (
        <div className="mb-4 flex flex-col items-center gap-3 rounded-xl border border-azure-500/25 bg-azure-500/5 py-8">
          
          <Loader2 size={26} className="animate-spin text-azure-500" />
          <p className="font-mono text-[11px] uppercase tracking-[0.16em] text-azure-500">
            {loaderLabel}
          </p>
        </div>
      )}
      {!loading && mode === "pair" && (
        <div className="mb-4 flex min-h-[60px] flex-col items-center justify-center gap-2 rounded-xl border border-edge bg-surface2 px-4 py-4 text-center">
          
          {result.state === "idle" && (
            <span className="text-xs text-muted">
              Your pairing code
            </span>
          )}
          {result.state === "ok" && (
            <span className="font-mono text-xl font-semibold tracking-[0.22em] text-azure-500">
              {result.text}
            </span>
          )}
          {result.state === "error" && (
            <span className="flex items-center gap-1.5 text-xs text-red-400">
              
              <TriangleAlert size={13} /> {result.text}
            </span>
          )}
        </div>
      )}
      {!loading && mode === "qr" && (
        <div className="mb-4 rounded-xl border border-edge bg-surface2 p-5 text-center">
          
          {qr ? (
            <>
              
              <img
                src={qr.image}
                alt="WhatsApp QR code"
                className="mx-auto mb-3 max-w-[210px] rounded-lg"
              />
              <p className="text-xs text-muted">{qr.hint}</p>
            </>
          ) : result.state === "error" ? (
            <span className="flex items-center justify-center gap-1.5 text-xs text-red-400">
              
              <TriangleAlert size={13} /> {result.text}
            </span>
          ) : (
            <span className="text-xs text-muted">Preparing your QR code…</span>
          )}
        </div>
      )}
      {mode === "pair" && (
        <button
          type="button"
          onClick={copyCode}
          disabled={result.state !== "ok"}
          className="focus-ring flex w-full items-center justify-center gap-2 rounded-lg border border-edge bg-surface2 px-4 py-2.5 text-sm font-semibold transition hover:border-azure-500/60 disabled:cursor-not-allowed disabled:opacity-50"
        >
          
          {copied ? (
            <Check size={14} className="text-green-400" />
          ) : (
            <Copy size={14} />
          )}
          {copied ? "Copied" : "Copy Code"}
        </button>
      )}
    </div>
  );
}
