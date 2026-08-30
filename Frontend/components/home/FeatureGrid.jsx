"use client";
import {
  Rocket,
  Puzzle,
  Headset,
  Wrench,
  Network,
  Github,
  Lightbulb,
  Satellite,
} from "lucide-react";
const CARDS = [
  { key: "deploy", icon: Rocket, title: "Deploy", text: "Deploy your bot" },
  {
    key: "session",
    icon: Satellite,
    title: "Session",
    text: "Pair your number",
  },
  { key: "plugins", icon: Puzzle, title: "Plugins", text: "Add ons" },
  { key: "support", icon: Headset, title: "Support", text: "Communities." },
  { key: "tools", icon: Wrench, title: "Tools", text: " — coming soon." },
  { key: "apis", icon: Network, title: "APIs", text: " — coming soon." },
  {
    key: "repository",
    icon: Github,
    title: "Repository",
    text: "Access Repository",
  },
  { key: "suggest", icon: Lightbulb, title: "Suggest", text: "Share ideas" },
];
export default function FeatureGrid({ onSelect }) {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">

      {CARDS.map(({ key, icon: Icon, title, text }) => (
        <button
          key={key}
          type="button"
          onClick={() => onSelect(key)}
          className="focus-ring group flex min-h-[132px] flex-col items-center justify-center rounded-xl border border-edge bg-surface px-4 py-4 text-center transition hover:-translate-y-0.5 hover:border-azure-500/60 hover:shadow-glow sm:min-h-[138px]"
        >

          <span className="mb-3 grid h-9 w-9 place-items-center rounded-lg bg-azure-500/10 text-azure-500 transition group-hover:bg-azure-500 group-hover:text-white">

            <Icon size={18} />
          </span>
          <span className="font-display text-[15px] font-bold leading-tight">

            {title}
          </span>
          <span className="mt-2 max-w-[180px] text-xs leading-5 text-muted">

            {text}
          </span>
        </button>
      ))}
    </div>
  );
}
