"use client";

import { useState } from "react";
import { Check, Copy, Download, Fingerprint, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  BROWSER_UTILITY_LIMITS,
  consumeBrowserUtilityUsage,
  copyToolText,
  downloadToolText,
  TOOL_CARD_CLASS,
  TOOL_LABEL_CLASS,
  ToolError,
  ToolFrame,
  TOOL_INPUT_CLASS,
  UtilityPlanNotice,
} from "./ToolFrame";

function randomUuid() {
  const bytes = globalThis.crypto.getRandomValues(new Uint8Array(16));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

export default function UuidGenerator() {
  const { user } = useAuth();
  const isPremium = user?.role === "admin" || user?.isPremium;
  const maxBatch = isPremium
    ? BROWSER_UTILITY_LIMITS.premiumUuidBatch
    : BROWSER_UTILITY_LIMITS.freeUuidBatch;
  const [count, setCount] = useState(5);
  const effectiveCount = Math.min(count, maxBatch);
  const [uppercase, setUppercase] = useState(false);
  const [uuids, setUuids] = useState([]);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [generating, setGenerating] = useState(false);

  async function generate() {
    setGenerating(true);
    try {
      const values = Array.from({ length: effectiveCount }, () => randomUuid());
      await consumeBrowserUtilityUsage("uuid-generator");
      setUuids(uppercase ? values.map((value) => value.toUpperCase()) : values);
      setError("");
      setCopied(false);
    } catch (generationError) {
      setError(generationError?.message || "Secure random generation is unavailable in this browser.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyAll() {
    try {
      await copyToolText(uuids.join("\n"), "UUIDs copied.");
      setCopied(true);
      setError("");
    } catch {
      setError("Could not copy automatically. Select the UUIDs and copy them instead.");
    }
  }

  return (
    <ToolFrame
      icon={Fingerprint}
      title="UUID Generator"
      description="Generate secure, random UUID v4 values instantly. Everything is created in your browser."
    >
      <div className="grid gap-4 sm:grid-cols-[1fr_1fr]">
        <label className={TOOL_LABEL_CLASS}>
          Number of UUIDs <span className="font-normal text-muted">({effectiveCount})</span>
          <input
            type="range"
            min="1"
            max={maxBatch}
            value={effectiveCount}
            onChange={(event) => setCount(Math.min(maxBatch, Number(event.target.value)))}
            className="mt-3 block w-full accent-azure-500"
          />
          <span className="mt-1 block text-xs font-normal text-muted">
            Up to {maxBatch} per batch
          </span>
        </label>
        <label className={`${TOOL_CARD_CLASS} flex items-center justify-between gap-3 text-sm`}>
          <span>
            <span className="block font-semibold text-fg">Uppercase format</span>
            <span className="mt-1 block text-xs font-normal text-muted">Convert generated letters to A–F</span>
          </span>
          <input
            type="checkbox"
            checked={uppercase}
            onChange={(event) => setUppercase(event.target.checked)}
            className="h-4 w-4 accent-azure-500"
          />
        </label>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate} disabled={generating}>
          <RefreshCw size={15} aria-hidden="true" />
          {generating ? "Generating…" : `Generate ${effectiveCount} UUID${effectiveCount === 1 ? "" : "s"}`}
        </Button>
        {uuids.length > 0 && (
          <>
            <Button variant="secondary" onClick={copyAll}>
              {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
              {copied ? "Copied" : "Copy all"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => downloadToolText("uuids.txt", uuids.join("\n"))}
            >
              <Download size={15} aria-hidden="true" />
              Download
            </Button>
          </>
        )}
      </div>

      {uuids.length > 0 && (
        <section aria-label="Generated UUIDs" className={`${TOOL_CARD_CLASS} space-y-2`}>
          {uuids.map((uuid) => (
            <div key={uuid} className="flex min-w-0 items-center gap-2">
              <code className={`${TOOL_INPUT_CLASS} min-w-0 flex-1 break-all font-mono`}>
                {uuid}
              </code>
              <button
                type="button"
                aria-label={`Copy ${uuid}`}
                onClick={async () => {
                  try {
                    await copyToolText(uuid, "UUID copied.");
                    setError("");
                  } catch {
                    setError("Could not copy automatically. Select the UUID and copy it instead.");
                  }
                }}
                className="focus-ring grid h-10 w-10 flex-none place-items-center rounded-lg border border-edge bg-surface text-muted hover:text-fg"
              >
                <Copy size={15} aria-hidden="true" />
              </button>
            </div>
          ))}
        </section>
      )}
      <UtilityPlanNotice
        freeBenefit={`${BROWSER_UTILITY_LIMITS.freeUuidBatch} UUIDs per batch`}
        premiumBenefit={`${BROWSER_UTILITY_LIMITS.premiumUuidBatch} UUIDs per batch`}
      />
      <ToolError message={error} />
      <p className="text-xs leading-5 text-muted">
        Uses your browser&apos;s cryptographically secure random generator. No data is sent to a server.
      </p>
    </ToolFrame>
  );
}
