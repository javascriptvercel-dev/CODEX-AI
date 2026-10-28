"use client";

import { useState } from "react";
import { ArrowDownUp, Check, Copy, Link2, RotateCcw } from "lucide-react";
import Button from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import {
  BROWSER_UTILITY_LIMITS,
  consumeBrowserUtilityUsage,
  copyToolText,
  TOOL_CARD_CLASS,
  TOOL_INPUT_CLASS,
  TOOL_LABEL_CLASS,
  ToolError,
  ToolFrame,
  UtilityPlanNotice,
} from "./ToolFrame";

export default function UrlEncoderDecoder() {
  const { user } = useAuth();
  const isPremium = user?.role === "admin" || user?.isPremium;
  const maxCharacters = isPremium
    ? BROWSER_UTILITY_LIMITS.premiumUrlCharacters
    : BROWSER_UTILITY_LIMITS.freeUrlCharacters;
  const [direction, setDirection] = useState("encode");
  const [scope, setScope] = useState("component");
  const [autoTrim, setAutoTrim] = useState(true);
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState(false);

  async function convert(event) {
    event.preventDefault();
    setError("");
    setOutput("");
    setCopied(false);
    if (!input.trim()) {
      setOutput("");
      setError("Enter a URL or text to convert.");
      return;
    }
    if (input.length > maxCharacters) {
      setError(`Your account supports up to ${maxCharacters.toLocaleString()} characters per conversion.`);
      return;
    }

    let result;
    try {
      const transform = direction === "encode"
        ? scope === "component" ? encodeURIComponent : encodeURI
        : scope === "component" ? decodeURIComponent : decodeURI;
      result = input.split(/\r?\n/u).map((line) => {
        const value = autoTrim ? line.trim() : line;
        return value ? transform(value) : "";
      }).join("\n");
    } catch {
      setOutput("");
      setError("The encoded text is incomplete or malformed. Check it and try again.");
      return;
    }

    setConverting(true);
    try {
      await consumeBrowserUtilityUsage("url-encoder-decoder");
      setOutput(result);
    } catch (usageError) {
      setError(usageError?.message || "Could not convert this text.");
    } finally {
      setConverting(false);
    }
  }

  async function validateUrl() {
    const value = input.trim();
    setError("");
    setOutput("");
    if (input.length > maxCharacters) {
      setError(`Your account supports up to ${maxCharacters.toLocaleString()} characters per conversion.`);
      return;
    }
    let parsed;
    try {
      parsed = new URL(value);
      if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("Unsupported protocol");
    } catch {
      setOutput("");
      setError("Enter a complete URL that starts with http:// or https://.");
      return;
    }
    setConverting(true);
    try {
      await consumeBrowserUtilityUsage("url-encoder-decoder");
      setError("");
      setOutput(`${parsed.href}\n\nThis is a valid HTTP or HTTPS URL.`);
    } catch (usageError) {
      setOutput("");
      setError(usageError?.message || "Could not validate this URL.");
    } finally {
      setConverting(false);
    }
  }

  async function copyOutput() {
    try {
      await copyToolText(output, "Converted text copied.");
      setCopied(true);
      setError("");
    } catch {
      setError("Could not copy automatically. Select the result and copy it instead.");
    }
  }

  function reset() {
    setInput("");
    setOutput("");
    setError("");
    setCopied(false);
  }

  return (
    <ToolFrame
      icon={Link2}
      title="URL Encoder / Decoder"
      description="Encode special characters for URLs or decode percent-encoded text locally in your browser."
    >
      <div className="flex flex-wrap gap-2" role="group" aria-label="Conversion direction">
        {["encode", "decode"].map((value) => (
          <Button
            key={value}
            variant={direction === value ? "primary" : "secondary"}
            aria-pressed={direction === value}
            onClick={() => {
              setDirection(value);
              setOutput("");
              setError("");
            }}
          >
            <ArrowDownUp size={15} aria-hidden="true" />
            {value === "encode" ? "Encode" : "Decode"}
          </Button>
        ))}
      </div>

      <form onSubmit={convert} className="space-y-4">
        <label htmlFor="url-codec-input" className={TOOL_LABEL_CLASS}>
          {direction === "encode" ? "Text or URL to encode" : "Encoded text to decode"}
        </label>
        <textarea
          id="url-codec-input"
          value={input}
          onChange={(event) => {
            setInput(event.target.value);
            setOutput("");
            setError("");
          }}
          rows={5}
          maxLength={maxCharacters}
          spellCheck={false}
          placeholder={direction === "encode" ? "https://example.com/search?q=hello world" : "https%3A%2F%2Fexample.com"}
          className={`${TOOL_INPUT_CLASS} resize-y font-mono leading-6`}
        />
        <p className="text-right text-xs text-muted">
          {input.length.toLocaleString()} / {maxCharacters.toLocaleString()} characters
        </p>

        <div className={`${TOOL_CARD_CLASS} grid gap-4 sm:grid-cols-2`}>
          <label className={TOOL_LABEL_CLASS}>
            Encoding mode
            <select
              value={scope}
              onChange={(event) => setScope(event.target.value)}
              className={`${TOOL_INPUT_CLASS} mt-2`}
            >
              <option value="component">URL component (encode reserved characters)</option>
              <option value="url">Full URL (preserve URL separators)</option>
            </select>
          </label>
          <label className="flex items-center gap-2 self-end pb-2 text-sm text-fg">
            <input
              type="checkbox"
              checked={autoTrim}
              onChange={(event) => setAutoTrim(event.target.checked)}
              className="h-4 w-4 accent-azure-500"
            />
            Trim whitespace on each line
          </label>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={converting}>{direction === "encode" ? "Encode" : "Decode"}</Button>
          <Button type="button" variant="secondary" onClick={validateUrl} disabled={converting}>
            Validate URL
          </Button>
          <Button type="button" variant="ghost" onClick={reset}>
            <RotateCcw size={15} aria-hidden="true" />
            Reset
          </Button>
        </div>
      </form>

      <UtilityPlanNotice
        freeBenefit={`${BROWSER_UTILITY_LIMITS.freeUrlCharacters.toLocaleString()} characters per conversion`}
        premiumBenefit={`${BROWSER_UTILITY_LIMITS.premiumUrlCharacters.toLocaleString()} characters per conversion`}
      />

      {output && (
        <section className="space-y-3" aria-labelledby="url-codec-output-label">
          <div className="flex items-center justify-between gap-3">
            <label id="url-codec-output-label" htmlFor="url-codec-output" className={TOOL_LABEL_CLASS}>
              Result
            </label>
            <Button variant="secondary" size="sm" onClick={copyOutput}>
              {copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>
          <textarea
            id="url-codec-output"
            value={output}
            readOnly
            rows={5}
            className={`${TOOL_INPUT_CLASS} resize-y font-mono leading-6`}
          />
        </section>
      )}

      <ToolError message={error} />
      <p className="text-xs leading-5 text-muted">
        All conversion happens in your browser. Your text is not uploaded.
      </p>
    </ToolFrame>
  );
}
