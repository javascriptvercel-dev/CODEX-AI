"use client";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="focus-ring relative grid h-9 w-9 flex-shrink-0 place-items-center overflow-hidden rounded-lg border border-edge bg-surface2 text-fg transition hover:border-azure-500/60 active:scale-90"
    >

      <Sun
        size={16}
        className={`absolute transition-all duration-300 ease-out ${isDark ? "translate-y-0 rotate-0 opacity-100" : "-translate-y-6 rotate-90 opacity-0"}`}
      />
      <Moon
        size={16}
        className={`absolute transition-all duration-300 ease-out ${isDark ? "translate-y-6 -rotate-90 opacity-0" : "translate-y-0 rotate-0 opacity-100"}`}
      />
    </button>
  );
}
