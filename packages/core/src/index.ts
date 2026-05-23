export const workspaceModes = ["lab", "write"] as const;
export type WorkspaceMode = (typeof workspaceModes)[number];

export const toolCategories = [
  "research",
  "reference",
  "analysis",
  "writing",
  "data",
] as const;
export type ToolCategory = (typeof toolCategories)[number];

export const toolStatuses = ["available", "coming_soon", "disabled"] as const;
export type ToolStatus = (typeof toolStatuses)[number];

export const toolAccentColors = ["teal", "purple", "orange"] as const;
export type ToolAccentColor = (typeof toolAccentColors)[number];

export type Tool = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  status: ToolStatus;
  accentColor: ToolAccentColor;
  iconName: string;
};

export const noteTypes = ["free", "reference"] as const;
export type NoteType = (typeof noteTypes)[number];

export type ReferenceSource = {
  excerpt: string;
  label: string;
  href: string;
  citation: string;
  abntReference: string;
  bibliographyId?: string;
  details?: string[];
};

export type NoteSource = ReferenceSource;

type BaseNote = {
  id: string;
  type: NoteType;
  title: string;
  content: string;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
};

export type FreeNote = BaseNote & {
  type: "free";
};

export type ReferenceNote = BaseNote & {
  type: "reference";
  source: ReferenceSource;
};

export type Note = FreeNote | ReferenceNote;

export type NoteInsertPayload = {
  noteId: string;
  noteType: NoteType;
  content: string;
  citation?: string;
  bibliographyEntry?: string;
  bibliographyId?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type ReferenceNavigationPayload = {
  noteId: string;
  bibliographyId?: string;
  citation: string;
  href: string;
};

export type Document = {
  id: string;
  projectId?: string;
  title: string;
  contentJson: Record<string, unknown>;
  createdAt: string;
  updatedAt?: string;
};

export type Project = {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  updatedAt?: string;
};

export type PrometeusEventPayloadMap = {
  "prometeus:write-insert-note": NoteInsertPayload;
  "prometeus:reference-focus": ReferenceNavigationPayload;
  "prometeus:note-edit": Note;
};
