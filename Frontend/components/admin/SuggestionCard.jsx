import { Lightbulb } from "lucide-react";
export default function SuggestionCard({ suggestion }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5">

      <div className="flex items-start justify-between gap-3">

        <div className="flex items-center gap-2">

          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-azure-500/10 text-azure-500">

            <Lightbulb size={14} />
          </span>
          <p className="text-sm font-semibold">{suggestion.email}</p>
        </div>
        <span className="flex-shrink-0 rounded-full border border-edge bg-surface2 px-2.5 py-1 text-[11px] text-muted">

          {new Date(suggestion.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-3 text-sm text-muted">{suggestion.idea}</p>
    </div>
  );
}
