"use client";

import { useState } from "react";
import { Check, Copy, KeyRound, RefreshCw } from "lucide-react";
import Button from "@/components/ui/Button";
import {
  copyToolText,
  TOOL_CARD_CLASS,
  TOOL_INPUT_CLASS,
  ToolError,
  ToolFrame,
} from "./ToolFrame";

const CHARACTER_GROUPS = {
  uppercase: "ABCDEFGHIJKLMNOPQRSTUVWXYZ",
  lowercase: "abcdefghijklmnopqrstuvwxyz",
  numbers: "0123456789",
  symbols: "!@#$%^&*()-_=+[]{};:,.?/",
};
const AMBIGUOUS_CHARACTERS = new Set(["O", "0", "I", "l", "1"]);

function secureIndex(max) {
  const range = 0x1_0000_0000;
  const limit = Math.floor(range / max) * max;
  const value = new Uint32Array(1);
  do {
    globalThis.crypto.getRandomValues(value);
  } while (value[0] >= limit);
  return value[0] % max;
}

function secureShuffle(items) {
  for (let index = items.length - 1; index > 0; index -= 1) {
    const other = secureIndex(index + 1);
    [items[index], items[other]] = [items[other], items[index]];
  }
  return items;
}

function generatePassword(length, options) {
  const groups = Object.entries(CHARACTER_GROUPS)
    .filter(([name]) => options[name])
    .map(([, characters]) => characters);
  if (!groups.length) throw new Error("Select at least one character group.");

  const availableGroups = options.excludeAmbiguous
    ? groups.map((group) => Array.from(group).filter((char) => !AMBIGUOUS_CHARACTERS.has(char)).join(""))
    : groups;
  if (availableGroups.some((group) => !group.length)) {
    throw new Error("That selection has no available characters.");
  }

  const pool = Array.from(new Set(availableGroups.join("")));
  if (options.noRepeats && length > pool.length) {
    throw new Error(`The selected groups allow up to ${pool.length} unique characters.`);
  }

  const password = availableGroups.map((group) => group[secureIndex(group.length)]);
  if (options.noRepeats) {
    const remaining = pool.filter((char) => !password.includes(char));
    while (password.length < length) {
      const index = secureIndex(remaining.length);
      password.push(remaining.splice(index, 1)[0]);
    }
  } else {
    while (password.length < length) password.push(pool[secureIndex(pool.length)]);
  }

  return secureShuffle(password).join("");
}

export default function PasswordGenerator() {
  const [length, setLength] = useState(16);
  const [options, setOptions] = useState({
    uppercase: true,
    lowercase: true,
    numbers: true,
    symbols: true,
    excludeAmbiguous: false,
    noRepeats: false,
  });
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  function toggle(name) {
    setOptions((current) => ({ ...current, [name]: !current[name] }));
    setPassword("");
    setCopied(false);
  }

  function generate() {
    try {
      setPassword(generatePassword(length, options));
      setError("");
      setCopied(false);
    } catch (generationError) {
      setPassword("");
      setError(generationError.message || "Could not generate a password.");
    }
  }

  async function copyPassword() {
    try {
      await copyToolText(password, "Password copied.");
      setCopied(true);
      setError("");
    } catch {
      setError("Could not copy automatically. Select the password and copy it instead.");
    }
  }

  const selectedGroups = Object.entries(CHARACTER_GROUPS)
    .filter(([name]) => options[name])
    .map(([, group]) => group).join("");
  const poolSize = options.excludeAmbiguous
    ? Array.from(new Set(selectedGroups.split("").filter((char) => !AMBIGUOUS_CHARACTERS.has(char)))).length
    : new Set(selectedGroups).size;
  const strengthBits = length * Math.log2(Math.max(poolSize, 1));
  const strength = strengthBits >= 100 ? "Very strong" : strengthBits >= 70 ? "Strong" : strengthBits >= 45 ? "Fair" : "Needs improvement";
  const strengthColor = strengthBits >= 70 ? "bg-emerald-500" : strengthBits >= 45 ? "bg-amber-400" : "bg-red-500";

  return (
    <ToolFrame
      icon={KeyRound}
      title="Password Generator"
      description="Create a random password with the length and character types you choose. Generated locally in your browser."
    >
      <div className={`${TOOL_CARD_CLASS} space-y-4`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label htmlFor="password-length" className="text-sm font-semibold text-fg">
            Password length
          </label>
          <span className="font-mono text-sm font-semibold text-fg">{length}</span>
        </div>
        <input
          id="password-length"
          type="range"
          min="8"
          max="64"
          value={length}
          onChange={(event) => {
            setLength(Number(event.target.value));
            setPassword("");
          }}
          className="block w-full accent-azure-500"
        />
        <div className="grid gap-2 sm:grid-cols-2">
          {[
            ["uppercase", "Uppercase letters (A–Z)"],
            ["lowercase", "Lowercase letters (a–z)"],
            ["numbers", "Numbers (0–9)"],
            ["symbols", "Symbols"],
            ["excludeAmbiguous", "Exclude similar characters (O, 0, I, l, 1)"],
            ["noRepeats", "Avoid repeating characters"],
          ].map(([name, label]) => (
            <label key={name} className="flex min-h-11 items-center gap-2 rounded-lg border border-edge bg-surface px-3 py-2 text-sm text-fg">
              <input
                type="checkbox"
                checked={options[name]}
                onChange={() => toggle(name)}
                className="h-4 w-4 accent-azure-500"
              />
              {label}
            </label>
          ))}
        </div>
      </div>

      <section className={`${TOOL_CARD_CLASS} space-y-3`} aria-label="Generated password">
        <label htmlFor="generated-password" className="text-sm font-semibold text-fg">
          Your password
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input
            id="generated-password"
            value={password}
            readOnly
            placeholder="Generate a password to see it here"
            className={`${TOOL_INPUT_CLASS} min-w-0 flex-1 font-mono`}
          />
          <Button variant="secondary" onClick={copyPassword} disabled={!password}>
            {copied ? <Check size={15} aria-hidden="true" /> : <Copy size={15} aria-hidden="true" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        {password && (
          <div>
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Estimated complexity</span>
              <span className="font-semibold text-fg">{strength}</span>
            </div>
            <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
              <div className={`h-full rounded-full ${strengthColor}`} style={{ width: `${Math.min(100, strengthBits)}%` }} />
            </div>
          </div>
        )}
      </section>

      <div className="flex flex-wrap gap-2">
        <Button onClick={generate}>
          <RefreshCw size={15} aria-hidden="true" />
          Generate password
        </Button>
      </div>
      <ToolError message={error} />
      <p className="text-xs leading-5 text-muted">
        Uses cryptographically secure browser randomness. Complexity is an estimate; store passwords in a trusted password manager.
      </p>
    </ToolFrame>
  );
}
