"use client";
import { useEffect, useState } from "react";
const COMMANDS = [
  ".install plugin/addweather-assistant",
  ".install plugin/addlead-capture",
  ".install plugin/addbooking-bot",
];
export default function HeroTerminal() {
  const [commandIndex, setCommandIndex] = useState(0);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState("typing");
  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduceMotion) {
      setText(COMMANDS[0]);
      return;
    }
    const current = COMMANDS[commandIndex];
    let timeout;
    if (phase === "typing") {
      if (text.length < current.length) {
        timeout = setTimeout(
          () => setText(current.slice(0, text.length + 1)),
          45,
        );
      } else {
        timeout = setTimeout(() => setPhase("installing"), 2000);
      }
    } else if (phase === "installing") {
      timeout = setTimeout(() => setPhase("installed"), 800);
    } else if (phase === "installed") {
      timeout = setTimeout(() => setPhase("deleting"), 1000);
    } else if (phase === "deleting") {
      if (text.length > 0) {
        timeout = setTimeout(() => setText(text.slice(0, -1)), 20);
      } else {
        setCommandIndex((i) => (i + 1) % COMMANDS.length);
        setPhase("typing");
      }
    }
    return () => clearTimeout(timeout);
  }, [text, phase, commandIndex]);
  return (
    <div className="w-full max-w-md overflow-hidden rounded-2xl border border-edge bg-ink-950 shadow-glow">

      <div className="flex items-center gap-1.5 border-b border-white/10 px-4 py-3">

        <span className="h-2.5 w-2.5 rounded-full bg-red-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-400/70" />
        <span className="ml-2 font-mono text-xs text-white/40">panel</span>
      </div>
      <div className="min-h-[140px] p-4 font-mono text-sm text-azure-300">

        <p className="break-all">

          <span className="text-white/40">codex@bot</span>
          <span className="text-white/20">:~$</span> {text}
          <span className="terminal-caret animate-blink h-4 align-middle" />
        </p>
        {text === COMMANDS[commandIndex] && phase === "installing" && (
          <p className="mt-3 text-white/30">Installing...</p>
        )}
        {text === COMMANDS[commandIndex] && phase === "installed" && (
          <p className="mt-3 text-white/30">Installed</p>
        )}
      </div>
    </div>
  );
}
