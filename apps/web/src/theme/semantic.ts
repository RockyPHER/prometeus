import type { ToolAccentColor, WorkspaceMode } from "@prometeus/core";

export const workspaceThemes: Record<
  WorkspaceMode,
  {
    tabActive: string;
    tabInactive: string;
    tabFocus: string;
    searchFocus: string;
  }
> = {
  lab: {
    tabActive:
      "bg-workspace-lab-50 text-workspace-lab-800 shadow-sm ring-1 ring-workspace-lab-100/90",
    tabInactive:
      "text-slate-500 hover:bg-workspace-lab-50/75 hover:text-workspace-lab-800",
    tabFocus: "focus:ring-workspace-lab-200/80",
    searchFocus:
      "focus-within:border-workspace-lab-300 focus-within:ring-4 focus-within:ring-workspace-lab-100/60",
  },
  write: {
    tabActive:
      "bg-workspace-write-50 text-workspace-write-700 shadow-sm ring-1 ring-workspace-write-100/90",
    tabInactive:
      "text-slate-500 hover:bg-workspace-write-50/75 hover:text-workspace-write-800",
    tabFocus: "focus:ring-workspace-write-200/80",
    searchFocus:
      "focus-within:border-workspace-write-300 focus-within:ring-4 focus-within:ring-workspace-write-100/60",
  },
};

export const toolAccentThemes: Record<
  ToolAccentColor,
  {
    badge: string;
    bubble: string;
    buttonFocus: string;
    description: string;
    icon: string;
    label: string;
    pill: string;
    selected: string;
  }
> = {
  teal: {
    badge: "border-tool-teal-200 bg-tool-teal-50 text-tool-teal-700",
    bubble:
      "border-tool-teal-200/90 bg-tool-teal-50/70 group-hover:border-tool-teal-300 group-hover:bg-tool-teal-50",
    buttonFocus:
      "focus-visible:ring-4 focus-visible:ring-tool-teal-100 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50",
    description: "text-tool-teal-700/80",
    icon: "text-tool-teal-700",
    label: "text-tool-teal-800",
    pill: "border-tool-teal-200 bg-tool-teal-50/90 text-tool-teal-700",
    selected: "ring-tool-teal-100/90 shadow-panel-soft",
  },
  purple: {
    badge: "border-tool-purple-200 bg-tool-purple-50 text-tool-purple-700",
    bubble:
      "border-tool-purple-200/90 bg-tool-purple-50/70 group-hover:border-tool-purple-300 group-hover:bg-tool-purple-50",
    buttonFocus:
      "focus-visible:ring-4 focus-visible:ring-tool-purple-100 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50",
    description: "text-tool-purple-700/80",
    icon: "text-tool-purple-700",
    label: "text-tool-purple-800",
    pill: "border-tool-purple-200 bg-tool-purple-50/90 text-tool-purple-700",
    selected: "ring-tool-purple-100/90 shadow-panel-soft",
  },
  orange: {
    badge: "border-tool-orange-200 bg-tool-orange-50 text-tool-orange-700",
    bubble:
      "border-tool-orange-200/90 bg-tool-orange-50/70 group-hover:border-tool-orange-300 group-hover:bg-tool-orange-50",
    buttonFocus:
      "focus-visible:ring-4 focus-visible:ring-tool-orange-100 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50",
    description: "text-tool-orange-700/80",
    icon: "text-tool-orange-700",
    label: "text-tool-orange-800",
    pill: "border-tool-orange-200 bg-tool-orange-50/90 text-tool-orange-700",
    selected: "ring-tool-orange-100/90 shadow-panel-soft",
  },
};

export type NoteThemeKey = "free" | "reference" | "future-one" | "future-two";

export const noteThemes: Record<
  NoteThemeKey,
  {
    badge: string;
    badgeMuted: string;
    badgeText: string;
    control: string;
    editorBadge: string;
    expandableAction: string;
    footerAction: string;
    hover: string;
    icon: string;
    referencePanelHeading?: string;
    shell: string;
    strip: string;
    surface: string;
    tag: string;
  }
> = {
  free: {
    badge:
      "bg-note-free-100/90 text-note-free-700 ring-1 ring-note-free-200/80",
    badgeMuted: "bg-note-free-50 text-note-free-600",
    badgeText: "text-note-free-700",
    control:
      "border-note-free-200 bg-note-free-50 text-note-free-700 hover:border-note-free-300 hover:bg-note-free-100 hover:text-note-free-900",
    editorBadge: "bg-note-free-50 text-note-free-700",
    expandableAction: "text-note-free-700 transition hover:text-note-free-900",
    footerAction:
      "text-note-free-700 hover:border-note-free-100 hover:bg-note-free-50 hover:text-note-free-900",
    hover: "hover:border-note-free-300 hover:shadow-panel-hover",
    icon: "text-note-free-600",
    referencePanelHeading: "text-note-free-600",
    shell: "border-note-free-200/90 bg-white",
    strip: "bg-note-free-300/80",
    surface: "border-note-free-200 bg-note-free-50/85",
    tag: "border-note-free-200 bg-note-free-50 text-note-free-600",
  },
  reference: {
    badge:
      "bg-note-reference-50/80 text-note-reference-700 ring-1 ring-note-reference-100",
    badgeMuted: "bg-note-reference-50/75 text-note-reference-700",
    badgeText: "text-note-reference-700",
    control:
      "border-note-reference-100 bg-note-reference-50 text-note-reference-700 hover:border-note-reference-200 hover:bg-note-reference-100 hover:text-note-reference-900",
    editorBadge: "bg-note-reference-50/75 text-note-reference-700",
    expandableAction:
      "text-note-reference-700 transition hover:text-note-reference-900",
    footerAction:
      "text-note-reference-700 hover:border-note-reference-100 hover:bg-note-reference-50 hover:text-note-reference-900",
    hover: "hover:border-note-reference-200 hover:shadow-accent-strong",
    icon: "text-note-reference-700",
    referencePanelHeading: "text-note-reference-800",
    shell:
      "border-note-reference-100/90 bg-gradient-to-b from-white to-note-reference-50/30",
    strip: "bg-note-reference-400/70",
    surface: "border-note-reference-100/80 bg-white/80",
    tag: "border-note-reference-100 bg-note-reference-50/80 text-note-reference-700",
  },
  "future-one": {
    badge:
      "bg-note-future-one-50/80 text-note-future-one-700 ring-1 ring-note-future-one-100",
    badgeMuted: "bg-note-future-one-50 text-note-future-one-700",
    badgeText: "text-note-future-one-700",
    control:
      "border-note-future-one-100 bg-note-future-one-50 text-note-future-one-700 hover:border-note-future-one-200 hover:bg-note-future-one-100 hover:text-note-future-one-900",
    editorBadge: "bg-note-future-one-50 text-note-future-one-700",
    expandableAction:
      "text-note-future-one-700 transition hover:text-note-future-one-900",
    footerAction:
      "text-note-future-one-700 hover:border-note-future-one-100 hover:bg-note-future-one-50 hover:text-note-future-one-900",
    hover: "hover:border-note-future-one-200 hover:shadow-panel-hover",
    icon: "text-note-future-one-700",
    shell:
      "border-note-future-one-100/90 bg-gradient-to-b from-white to-note-future-one-50/25",
    strip: "bg-note-future-one-400/70",
    surface: "border-note-future-one-100/80 bg-white/80",
    tag: "border-note-future-one-100 bg-note-future-one-50/80 text-note-future-one-700",
  },
  "future-two": {
    badge:
      "bg-note-future-two-50/80 text-note-future-two-700 ring-1 ring-note-future-two-100",
    badgeMuted: "bg-note-future-two-50 text-note-future-two-700",
    badgeText: "text-note-future-two-700",
    control:
      "border-note-future-two-100 bg-note-future-two-50 text-note-future-two-700 hover:border-note-future-two-200 hover:bg-note-future-two-100 hover:text-note-future-two-900",
    editorBadge: "bg-note-future-two-50 text-note-future-two-700",
    expandableAction:
      "text-note-future-two-700 transition hover:text-note-future-two-900",
    footerAction:
      "text-note-future-two-700 hover:border-note-future-two-100 hover:bg-note-future-two-50 hover:text-note-future-two-900",
    hover: "hover:border-note-future-two-200 hover:shadow-panel-hover",
    icon: "text-note-future-two-700",
    shell:
      "border-note-future-two-100/90 bg-gradient-to-b from-white to-note-future-two-50/25",
    strip: "bg-note-future-two-400/70",
    surface: "border-note-future-two-100/80 bg-white/80",
    tag: "border-note-future-two-100 bg-note-future-two-50/80 text-note-future-two-700",
  },
};

export const badgeToneClasses = {
  neutral: "border-note-free-200 bg-white text-note-free-600",
  lab: "border-workspace-lab-200 bg-workspace-lab-50 text-workspace-lab-700",
  write:
    "border-workspace-write-200 bg-workspace-write-50 text-workspace-write-700",
  toolTeal: toolAccentThemes.teal.badge,
  toolPurple: toolAccentThemes.purple.badge,
  toolOrange: toolAccentThemes.orange.badge,
  noteFree: noteThemes.free.badge,
  noteReference: noteThemes.reference.badge,
  noteFutureOne: noteThemes["future-one"].badge,
  noteFutureTwo: noteThemes["future-two"].badge,
} as const;

export type BadgeTone = keyof typeof badgeToneClasses;

export function getToolAccentTheme(accentColor: ToolAccentColor) {
  return toolAccentThemes[accentColor];
}
