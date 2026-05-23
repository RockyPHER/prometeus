import { useMemo } from "react";
import type { Tool } from "@prometeus/core";

export function useToolSearch(tools: Tool[], query: string) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return tools;
    }

    return tools.filter((tool) => {
      const searchable = `${tool.name} ${tool.description}`.toLowerCase();
      return searchable.includes(normalizedQuery);
    });
  }, [tools, query]);
}
