"use client";
import { Search } from "lucide-react";
export default function SearchBar({ value, onChange }) {
  return (
    <div className="relative flex-1">
      
      <Search
        size={16}
        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
      />
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search plugins by name or creator…"
        className="focus-ring w-full rounded-lg border border-edge bg-surface2 py-2.5 pl-10 pr-3 text-sm outline-none placeholder:text-muted/70"
      />
    </div>
  );
}
