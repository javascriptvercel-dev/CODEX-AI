"use client";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
export default function CopyButton({ label, value, icon: Icon = Copy }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      type="button"
      onClick={handleCopy}
      className="focus-ring flex items-center gap-2 rounded-lg border border-edge bg-surface2 px-3.5 py-2 text-xs font-semibold transition hover:border-azure-500/60"
    >
      
      {copied ? (
        <Check size={14} className="text-green-400" />
      ) : (
        <Icon size={14} className="text-azure-500" />
      )}
      {copied ? "Copied" : label}
    </button>
  );
}
