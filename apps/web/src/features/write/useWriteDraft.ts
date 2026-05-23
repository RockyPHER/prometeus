import type { JSONContent } from "@tiptap/core";
import { useEffect, useState } from "react";
import { markdownToInitialContent } from "@/features/write/legacyMarkdown";
import {
  countWordsFromContent,
  synchronizeReferences,
} from "@/features/write/noteInsertion";
import {
  LEGACY_WRITE_DRAFT_STORAGE_KEY,
  WRITE_DRAFT_STORAGE_KEY,
  emptyDraft,
  emptyDocumentContent,
  type ReferenceItem,
  type SaveState,
  type UsedNoteItem,
  type WriteDraft,
} from "@/features/write/types";

type LegacyWriteDraft = {
  title?: unknown;
  markdown?: unknown;
  references?: unknown;
  usedNotes?: unknown;
};

export function useWriteDraft() {
  const [draft, setDraft] = useState<WriteDraft>(readStoredDraft);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const wordCount = countWordsFromContent(draft.contentJson);

  useEffect(() => {
    setSaveState("draft");

    const timeout = window.setTimeout(() => {
      storeDraft(draft);
      setSaveState("saved");
    }, 280);

    return () => window.clearTimeout(timeout);
  }, [draft]);

  return {
    draft,
    saveState,
    setDraft,
    wordCount,
  };
}

function readStoredDraft(): WriteDraft {
  if (typeof window === "undefined") {
    return emptyDraft;
  }

  try {
    const storedDraft = window.localStorage.getItem(WRITE_DRAFT_STORAGE_KEY);

    if (storedDraft) {
      return sanitizeDraft(JSON.parse(storedDraft) as Partial<WriteDraft>);
    }

    const legacyDraft = window.localStorage.getItem(
      LEGACY_WRITE_DRAFT_STORAGE_KEY,
    );

    if (!legacyDraft) {
      return emptyDraft;
    }

    return migrateLegacyDraft(JSON.parse(legacyDraft) as LegacyWriteDraft);
  } catch {
    return emptyDraft;
  }
}

function sanitizeDraft(parsedDraft: Partial<WriteDraft>): WriteDraft {
  const contentJson = isJsonContent(parsedDraft.contentJson)
    ? parsedDraft.contentJson
    : emptyDocumentContent;
  const references = Array.isArray(parsedDraft.references)
    ? parsedDraft.references.filter(isReferenceItem)
    : [];
  const usedNotes = Array.isArray(parsedDraft.usedNotes)
    ? parsedDraft.usedNotes.filter(isUsedNoteItem)
    : [];
  const synced = synchronizeReferences({
    contentJson,
    references,
    usedNotes,
  });

  return {
    title: typeof parsedDraft.title === "string" ? parsedDraft.title : "",
    contentJson,
    references: synced.references,
    usedNotes: synced.usedNotes,
  };
}

function migrateLegacyDraft(parsedDraft: LegacyWriteDraft): WriteDraft {
  const markdown =
    typeof parsedDraft.markdown === "string" ? parsedDraft.markdown : "";
  const contentJson = markdownToInitialContent(
    stripLegacyReferenceMarkers(markdown),
  );
  const references = Array.isArray(parsedDraft.references)
    ? parsedDraft.references.filter(isReferenceItem)
    : [];
  const usedNotes = Array.isArray(parsedDraft.usedNotes)
    ? parsedDraft.usedNotes.filter(isUsedNoteItem)
    : [];
  const synced = synchronizeReferences({
    contentJson,
    references,
    usedNotes,
  });

  return {
    title: typeof parsedDraft.title === "string" ? parsedDraft.title : "",
    contentJson,
    references: synced.references.length ? synced.references : references,
    usedNotes: synced.usedNotes,
  };
}

function storeDraft(draft: WriteDraft) {
  try {
    window.localStorage.setItem(WRITE_DRAFT_STORAGE_KEY, JSON.stringify(draft));
  } catch {
    return;
  }
}

function isReferenceItem(value: unknown): value is ReferenceItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const reference = value as Partial<ReferenceItem>;

  return (
    typeof reference.bibliographyId === "string" &&
    typeof reference.noteId === "string" &&
    typeof reference.citation === "string" &&
    typeof reference.bibliographyEntry === "string"
  );
}

function isUsedNoteItem(value: unknown): value is UsedNoteItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const note = value as Partial<UsedNoteItem>;

  return typeof note.noteId === "string" && typeof note.noteType === "string";
}

function isJsonContent(value: unknown): value is JSONContent {
  return !!value && typeof value === "object" && "type" in value;
}

function stripLegacyReferenceMarkers(markdown: string) {
  return markdown
    .replace(/\[\[ref:[^[\]]+\]\]/g, "")
    .replace(/^## Referências\s*[\s\S]*$/im, "")
    .trim();
}
