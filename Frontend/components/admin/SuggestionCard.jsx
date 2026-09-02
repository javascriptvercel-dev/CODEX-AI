import { Lightbulb } from "lucide-react";
export default function SuggestionCard({ suggestion }) {
  return (
    <div className="rounded-2xl border border-edge bg-surface p-5 transition hover:border-azure-500/30 hover:shadow-lg hover:shadow-black/5">

      <div className="flex items-start justify-between gap-3">

        <div className="flex min-w-0 items-center gap-2">

          <span className="grid h-8 w-8 flex-shrink-0 place-items-center rounded-lg bg-azure-500/10 text-azure-500">

            <Lightbulb size={14} />
          </span>
          <p className="min-w-0 break-words text-sm font-semibold [overflow-wrap:anywhere]">{suggestion.email}</p>
        </div>
        <span className="flex-shrink-0 rounded-full border border-edge bg-surface2 px-2.5 py-1 text-[11px] text-muted">

          {new Date(suggestion.createdAt).toLocaleDateString()}
        </span>
      </div>
      <p className="mt-3 break-words text-sm text-muted [overflow-wrap:anywhere]">{suggestion.idea}</p>
    </div>
  );
}
