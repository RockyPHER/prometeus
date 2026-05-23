import { Badge } from "@/components/ui";
import type { NoteType } from "@prometeus/core";
import { Search } from "lucide-react";
import { cn } from "@/lib/cn";
import { workspaceThemes } from "@/theme/semantic";

type NotesToolbarProps = {
  query: string;
  activeFilter: NoteType | "all";
  onQueryChange: (query: string) => void;
  onFilterChange: (filter: NoteType | "all") => void;
};

const filters: Array<{ label: string; value: NoteType | "all" }> = [
  { label: "Todas", value: "all" },
  { label: "Livres", value: "free" },
  { label: "Referência", value: "reference" },
];

export function NotesToolbar({
  query,
  activeFilter,
  onQueryChange,
  onFilterChange,
}: NotesToolbarProps) {
  function getFilterTone(filter: NoteType | "all") {
    if (activeFilter !== filter) {
      return "neutral" as const;
    }

    if (filter === "free") {
      return "noteFree" as const;
    }

    if (filter === "reference") {
      return "noteReference" as const;
    }

    return "lab" as const;
  }

  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            type="button"
            onClick={() => onFilterChange(filter.value)}
            className="text-left transition duration-200 hover:translate-y-[-1px]"
          >
            <Badge tone={getFilterTone(filter.value)}>{filter.label}</Badge>
          </button>
        ))}
      </div>

      <label
        className={cn(
          "flex h-10 min-w-0 items-center gap-2 rounded-full border border-slate-200 bg-white px-3 shadow-sm sm:w-64",
          workspaceThemes.write.searchFocus,
        )}
      >
        <Search className="h-4 w-4 text-slate-400" strokeWidth={1.8} />
        <input
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Buscar notas"
          className="min-w-0 flex-1 bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
          type="search"
        />
      </label>
    </div>
  );
}
