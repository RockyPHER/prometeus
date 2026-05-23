import { CheckCircle2, CircleDashed } from "lucide-react";
import type { SaveState } from "@/features/write/types";

type WriteStatusBarProps = {
  noteCount: number;
  referenceCount: number;
  saveState: SaveState;
  wordCount: number;
};

export function WriteStatusBar({
  noteCount,
  referenceCount,
  saveState,
  wordCount,
}: WriteStatusBarProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200/70 bg-white/55 px-6 py-3 text-sm text-slate-500 sm:px-8">
      <div className="flex flex-wrap items-center gap-3">
        <span>
          {wordCount} palavra{wordCount === 1 ? "" : "s"}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-300/75" />
        <span>
          {noteCount} nota{noteCount === 1 ? "" : "s"}
        </span>
        <span className="h-1 w-1 rounded-full bg-slate-300/75" />
        <span>{referenceCount} ref.</span>
      </div>

      <span className="inline-flex items-center gap-2 text-xs font-medium text-slate-500/95">
        {saveState === "saved" ? (
          <CheckCircle2
            className="h-3.5 w-3.5 text-workspace-write-600"
            strokeWidth={1.8}
          />
        ) : (
          <CircleDashed
            className="h-3.5 w-3.5 text-slate-400"
            strokeWidth={1.8}
          />
        )}
        {saveState === "saved" ? "Salvo localmente" : "Rascunho"}
      </span>
    </div>
  );
}
