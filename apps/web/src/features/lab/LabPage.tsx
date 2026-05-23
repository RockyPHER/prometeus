import { AnimatePresence, motion } from "framer-motion";
import type { Tool } from "@prometeus/core";
import { SearchBar } from "@/components/layout/SearchBar";
import { fallbackTools } from "@/mock/fallbackTools";
import { ToolGrid } from "@/features/lab/ToolGrid";
import { useToolSearch } from "@/hooks/useToolSearch";
import { getTools } from "@/lib/api";
import { cn } from "@/lib/cn";
import { useEffect, useState } from "react";
import { getToolAccentTheme, workspaceThemes } from "@/theme/semantic";

export function LabPage() {
  const [tools, setTools] = useState<Tool[]>(fallbackTools);
  const [query, setQuery] = useState("");
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const filteredTools = useToolSearch(tools, query);
  const selectedAccent = selectedTool
    ? getToolAccentTheme(selectedTool.accentColor)
    : null;

  useEffect(() => {
    let isMounted = true;

    getTools()
      .then((remoteTools) => {
        if (isMounted) {
          setTools(remoteTools);
        }
      })
      .catch(() => {
        if (isMounted) {
          setTools(fallbackTools);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <section className="flex w-full flex-1 flex-col items-center pt-9 sm:pt-10">
      <SearchBar
        value={query}
        onChange={setQuery}
        placeholder="Search tools..."
        className={workspaceThemes.lab.searchFocus}
      />

      <ToolGrid
        tools={filteredTools}
        selectedToolId={selectedTool?.id}
        onSelectTool={setSelectedTool}
      />

      <AnimatePresence mode="wait">
        {selectedTool ? (
          <motion.p
            key={selectedTool.id}
            className={cn(
              "mt-7 rounded-full border bg-white px-5 py-2 text-sm font-medium shadow-sm",
              selectedAccent?.pill,
            )}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.22 }}
          >
            Selected: {selectedTool.name}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </section>
  );
}
