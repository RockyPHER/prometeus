import type { Tool } from "@prometeus/core";

export const fallbackTools: Tool[] = [
  {
    id: "article-search",
    name: "Article Search",
    description: "Search academic articles across trusted sources.",
    category: "research",
    status: "available",
    iconName: "file-search",
    accentColor: "teal",
  },
  {
    id: "citation-generator",
    name: "Citation Generator",
    description: "Create structured references and citations.",
    category: "reference",
    status: "available",
    iconName: "quote",
    accentColor: "purple",
  },
  {
    id: "matrix-builder",
    name: "Matrix Builder",
    description: "Build comparison matrices for technical analysis.",
    category: "analysis",
    status: "available",
    iconName: "table",
    accentColor: "orange",
  },
];
