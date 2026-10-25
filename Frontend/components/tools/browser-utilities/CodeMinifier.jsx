"use client";

import { useState } from "react";
import postcss from "postcss";
import { minify as minifyJavaScript } from "terser";
import { Check, Copy, Download, FileCode2, Sparkles } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  copyToolText,
  downloadToolText,
  TOOL_INPUT_CLASS,
  TOOL_LABEL_CLASS,
  ToolError,
  ToolFrame,
} from "./ToolFrame";

const MAX_SOURCE_LENGTH = 500_000;

function minifyCss(source) {
  const root = postcss.parse(source);
  root.walkComments((comment) => {
    if (!comment.text.startsWith("!")) comment.remove();
  });
  root.raws.before = "";
  root.raws.after = "";
  root.walk((node) => {
    if (node.nodes) node.raws.semicolon = false;
  });
  root.walkRules((rule) => {
    rule.selector = rule.selector.replace(/\s*,\s*/gu, ",");
    rule.raws.before = "";
    rule.raws.between = "";
    rule.raws.after = "";
  });
  root.walkAtRules((rule) => {
    rule.raws.before = "";
    rule.raws.afterName = rule.params ? " " : "";
    rule.raws.between = "";
    rule.raws.after = "";
  });
  root.walkDecls((declaration) => {
    declaration.raws.before = "";
    declaration.raws.between = ":";
  });
  return root.toString();
}

export default function CodeMinifier() {
  const [language, setLanguage] = useState("javascript");
  const [source, setSource] = useState("");
  const [output, setOutput] = useState("");
  const [minifying, setMinifying] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function minify(event) {
    event.preventDefault();
    setError("");
    setOutput("");
    setCopied(false);
    if (!source.trim()) {
      setError("Paste JavaScript or CSS code to minify.");
      return;
    }
    if (source.length > MAX_SOURCE_LENGTH) {
      setError(`Code must be ${MAX_SOURCE_LENGTH.toLocaleString()} characters or fewer.`);
      return;
    }

    setMinifying(true);
    try {
      if (language === "javascript") {
        const result = await minifyJavaScript(source, {
          compress: false,
          mangle: false,
          format: { beautify: false },
        });
        if (!result.code) throw new Error("Could not produce minified JavaScript.");
        setOutput(result.code);
      } else {
        setOutput(minifyCss(source));
      }
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
      description="Remove unnecessary formatting and comments from JavaScript or CSS. Your code is processed locally."
    >
      <form onSubmit={minify} className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <label htmlFor="minifier-language" className={`${TOOL_LABEL_CLASS} min-w-52`}>
            Language
            <select
              id="minifier-language"
              value={language}
              onChange={(event) => {
                setLanguage(event.target.value);
                setOutput("");
                setError("");
              }}
              className={`${TOOL_INPUT_CLASS} mt-2`}
            >
              <option value="javascript">JavaScript</option>
              <option value="css">CSS</option>
            </select>
          </label>
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
              setCopied(false);
            }}
            rows={12}
            maxLength={MAX_SOURCE_LENGTH}
            spellCheck={false}
            autoCapitalize="off"
            autoComplete="off"
            placeholder={language === "javascript" ? "function greet(name) {\n  return `Hello, ${name}!`;\n}" : ".card {\n  color: #ffffff;\n  padding: 1rem;\n}"}
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
                onClick={() => downloadToolText(`minified.${language === "javascript" ? "js" : "css"}`, output, language === "javascript" ? "text/javascript;charset=utf-8" : "text/css;charset=utf-8")}
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
