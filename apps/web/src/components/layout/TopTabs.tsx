import { FlaskConical, PencilLine } from "lucide-react";
import type { WorkspaceMode } from "@prometeus/core";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";
import { useI18n } from "@/components/providers/AppProviders";
import { workspaceThemes } from "@/theme/semantic";

type TopTabsProps = {
  activeMode: WorkspaceMode;
  onModeChange: (mode: WorkspaceMode) => void;
};

export function TopTabs({ activeMode, onModeChange }: TopTabsProps) {
  const { messages } = useI18n();
  const labTheme = workspaceThemes.lab;
  const writeTheme = workspaceThemes.write;

  return (
    <div className="relative inline-flex items-center justify-center rounded-[1rem] border border-slate-200/90 bg-white/80 p-1 shadow-panel-float backdrop-blur">
      <button
        type="button"
        onClick={() => onModeChange("lab")}
        className={cn(
          "relative z-10 flex h-11 min-w-[6rem] items-center justify-center gap-2 rounded-[0.8rem] px-4 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2",
          labTheme.tabFocus,
          activeMode === "lab" ? labTheme.tabActive : labTheme.tabInactive,
        )}
      >
        <FlaskConical className="h-4 w-4" strokeWidth={1.8} />
        <span>{messages.workspace.lab}</span>
        {activeMode === "lab" ? (
          <motion.span
            layoutId="workspace-tab-pill"
            className="bg-sky-50 absolute inset-0 -z-10 rounded-[0.8rem]"
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.8,
            }}
          />
        ) : null}
      </button>

      <button
        type="button"
        onClick={() => onModeChange("write")}
        className={cn(
          "relative z-10 flex h-11 min-w-[6rem] items-center justify-center gap-2 rounded-[0.8rem] px-4 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2",
          writeTheme.tabFocus,
          activeMode === "write"
            ? writeTheme.tabActive
            : writeTheme.tabInactive,
        )}
      >
        <PencilLine className="h-4 w-4" strokeWidth={1.8} />
        <span>{messages.workspace.write}</span>
        {activeMode === "write" ? (
          <motion.span
            layoutId="workspace-tab-pill"
            className="absolute inset-0 -z-10 rounded-[0.8rem] bg-teal-50"
            transition={{
              type: "spring",
              stiffness: 420,
              damping: 32,
              mass: 0.8,
            }}
          />
        ) : null}
      </button>
    </div>
  );
}
