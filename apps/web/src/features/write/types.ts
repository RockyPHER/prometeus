import type { NoteInsertPayload } from "@prometeus/core";
import type { JSONContent } from "@tiptap/core";

export const WRITE_DRAFT_STORAGE_KEY = "prometeus:write-draft:v2";
export const LEGACY_WRITE_DRAFT_STORAGE_KEY = "prometeus:write-draft:v1";

export type ReferenceItem = {
  bibliographyId: string;
  noteId: string;
  citation: string;
  bibliographyEntry: string;
  sourceId?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type UsedNoteItem = {
  noteId: string;
  noteType: NoteInsertPayload["noteType"];
  citation?: string;
  bibliographyId?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type WriteDraft = {
  title: string;
  contentJson: JSONContent;
  references: ReferenceItem[];
  usedNotes: UsedNoteItem[];
};

export type SaveState = "draft" | "saved";

export const emptyDocumentContent: JSONContent = {
  type: "doc",
  content: [
    {
      type: "paragraph",
    },
  ],
};

export const emptyDraft: WriteDraft = {
  title: "",
  contentJson: emptyDocumentContent,
  references: [],
  usedNotes: [],
};
