"use client";

import { useState } from "react";
import { Check, Copy, Download, FileCode2, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  detectCodeLanguage,
  getMinifiedFilename,
  minifyCode,
} from "./codeMinifier.mjs";
import {
  copyToolText,
  downloadToolText,
  TOOL_INPUT_CLASS,
  TOOL_LABEL_CLASS,
  ToolError,
  ToolFrame,
} from "./ToolFrame";

const MAX_SOURCE_LENGTH = 500_000;

export default function CodeMinifier() {
  const [source, setSource] = useState("");
  const [output, setOutput] = useState("");
  const [minifying, setMinifying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const language = detectCodeLanguage(source);

  async function minify(event) {
    event.preventDefault();
    setError("");
    setOutput("");
    setCopied(false);
    if (!source.trim()) {
      setError("Paste code to detect its language and minify it.");
      return;
    }
    if (source.length > MAX_SOURCE_LENGTH) {
      setError(`Code must be ${MAX_SOURCE_LENGTH.toLocaleString()} characters or fewer.`);
      return;
    }

    setMinifying(true);
    try {
      setOutput(await minifyCode(source, language));
    } catch (minifyError) {
      setError(minifyError?.message || "Could not minify this code. Check the syntax and try again.");
    } finally {
      setMinifying(false);
    }
  }

  async function copyOutput() {
    try {
      await copyToolText(output, "Minified code copied.");
      setCopied(true);
      setError("");
    } catch {
      setError("Could not copy automatically. Select the output and copy it instead.");
    }
  }

  const savedCharacters = Math.max(0, source.length - output.length);
  const savedPercent = source.length
    ? Math.round((savedCharacters / source.length) * 100)
    : 0;

  return (
    <ToolFrame
      icon={FileCode2}
      title="Code Minifier"
      description="Automatically detect and minify code in your browser, with no language selector."
    >
      <form onSubmit={minify} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="min-w-52">
            <span className="text-sm font-semibold text-fg">Language</span>
            <p className="mt-2 text-sm text-muted" aria-live="polite">
              {language || "Paste code to detect"}
            </p>
          </div>
          <span className="text-xs text-muted">
            {source.length.toLocaleString()} / {MAX_SOURCE_LENGTH.toLocaleString()} characters
          </span>
        </div>

        <label htmlFor="minifier-source" className={TOOL_LABEL_CLASS}>
          Source code
          <textarea
            id="minifier-source"
            value={source}
            onChange={(event) => {
              setSource(event.target.value);
              setOutput("");
              setError("");
              setCopied(false);
            }}
            rows={12}
            maxLength={MAX_SOURCE_LENGTH}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            placeholder={'Paste JavaScript, CSS, or JSON code here.\n\nExample:\nconst message = "Hello";'}
            className={`${TOOL_INPUT_CLASS} mt-2 resize-y font-mono text-xs leading-5`}
          />
        </label>

        <div className="flex flex-wrap gap-2">
          <Button type="submit" disabled={minifying || !source.trim()}>
            <Sparkles size={15} aria-hidden="true" />
            {minifying ? "Minifying…" : "Minify code"}
          </Button>
          {output && (
            <>
              <Button type="button" variant="secondary" onClick={copyOutput}>
                {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
                {copied ? "Copied" : "Copy result"}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => downloadToolText(getMinifiedFilename(language), output)}
              >
                <Download size={15} aria-hidden="true" />
                Download
              </Button>
            </>
          )}
        </div>
      </form>

      {output && (
        <section className="space-y-3" aria-labelledby="minifier-output-label">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <label id="minifier-output-label" htmlFor="minifier-output" className={TOOL_LABEL_CLASS}>
              Minified output
            </label>
            <span className="text-xs text-muted">
              {savedCharacters.toLocaleString()} characters saved · {savedPercent}%
            </span>
          </div>
          <textarea
            id="minifier-output"
            value={output}
            readOnly
            rows={9}
            spellCheck={false}
            className={`${TOOL_INPUT_CLASS} resize-y font-mono text-xs leading-5`}
          />
        </section>
      )}
      <ToolError message={error} />
      <p className="text-xs leading-5 text-muted">
        Minification changes formatting only; it does not compress files or make code secure. Review and test the result before using it.
      </p>
    </ToolFrame>
  );
}
