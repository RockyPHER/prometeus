import type { NoteInsertPayload } from "@prometeus/core";
import type { JSONContent } from "@tiptap/core";
import type { Editor } from "@tiptap/react";
import type { ReferenceItem, UsedNoteItem } from "@/features/write/types";

export type ReferenceMarkAttributes = {
  noteId: string;
  sourceId?: string;
  bibliographyId: string;
  citation: string;
  bibliographyEntry: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

type SynchronizeReferencesArgs = {
  contentJson: JSONContent;
  references: ReferenceItem[];
  usedNotes: UsedNoteItem[];
};

export function insertNoteIntoEditor(
  editor: Editor,
  payload: NoteInsertPayload,
) {
  editor.chain().focus().run();

  if (
    payload.noteType === "reference" &&
    payload.citation &&
    payload.bibliographyEntry
  ) {
    const markAttributes = buildReferenceMarkAttributes(payload);
    const referenceText = payload.content.trim();

    if (!referenceText) {
      return {
        reference: buildReferenceItem(payload),
        usedNote: buildUsedNote(payload),
      };
    }

    editor
      .chain()
      .focus()
      .insertContent({
        type: "text",
        text: referenceText,
        marks: [
          {
            type: "referenceMark",
            attrs: markAttributes,
          },
        ],
      })
      .insertContent({
        type: "text",
        text: " ",
      })
      .run();

    return {
      reference: buildReferenceItem(payload),
      usedNote: buildUsedNote(payload),
    };
  }

  const blocks = textToDocumentBlocks(payload.content);

  editor.chain().focus().insertContent(blocks).run();

  return {
    reference: null,
    usedNote: buildUsedNote(payload),
  };
}

export function synchronizeReferences({
  contentJson,
  references,
  usedNotes,
}: SynchronizeReferencesArgs) {
  const referenceMap = new Map<string, ReferenceItem>();

  for (const reference of references) {
    referenceMap.set(reference.bibliographyId, reference);
  }

  const activeReferenceMap = collectReferenceMarks(contentJson, referenceMap);
  const nextReferences = Array.from(activeReferenceMap.values());
  const nextUsedNotes = dedupeUsedNotes([
    ...usedNotes.filter((usedNote) => usedNote.noteType !== "reference"),
    ...nextReferences.map((reference) => ({
      noteId: reference.noteId,
      noteType: "reference" as const,
      citation: reference.citation,
      bibliographyId: reference.bibliographyId,
      sourceLabel: reference.sourceLabel,
      sourceUrl: reference.sourceUrl,
    })),
  ]);

  return {
    references: nextReferences,
    usedNotes: nextUsedNotes,
  };
}

export function upsertReference(
  references: ReferenceItem[],
  reference: ReferenceItem | null,
) {
  if (!reference) {
    return references;
  }

  if (
    references.some((item) => item.bibliographyId === reference.bibliographyId)
  ) {
    return references;
  }

  return [...references, reference];
}

export function upsertUsedNote(
  usedNotes: UsedNoteItem[],
  usedNote: UsedNoteItem,
) {
  return dedupeUsedNotes([...usedNotes, usedNote]);
}

export function extractTextContent(content: JSONContent | undefined): string {
  if (!content) {
    return "";
  }

  if (typeof content.text === "string") {
    return content.text;
  }

  return (content.content ?? []).map(extractTextContent).join(" ");
}

export function countWordsFromContent(content: JSONContent) {
  return extractTextContent(content).trim().match(/\S+/g)?.length ?? 0;
}

export function buildReferenceItem(
  payload: NoteInsertPayload,
): ReferenceItem | null {
  if (!payload.citation || !payload.bibliographyEntry) {
    return null;
  }

  return {
    bibliographyId: payload.bibliographyId ?? payload.noteId,
    noteId: payload.noteId,
    citation: payload.citation,
    bibliographyEntry: payload.bibliographyEntry,
    sourceId: payload.noteId,
    sourceLabel: payload.sourceLabel,
    sourceUrl: payload.sourceUrl,
  };
}

export function buildUsedNote(payload: NoteInsertPayload): UsedNoteItem {
  return {
    noteId: payload.noteId,
    noteType: payload.noteType,
    citation: payload.citation,
    bibliographyId: payload.bibliographyId,
    sourceLabel: payload.sourceLabel,
    sourceUrl: payload.sourceUrl,
  };
}

function buildReferenceMarkAttributes(
  payload: NoteInsertPayload,
): ReferenceMarkAttributes {
  return {
    noteId: payload.noteId,
    sourceId: payload.noteId,
    bibliographyId: payload.bibliographyId ?? payload.noteId,
    citation: payload.citation ?? "",
    bibliographyEntry: payload.bibliographyEntry ?? "",
    sourceLabel: payload.sourceLabel,
    sourceUrl: payload.sourceUrl,
  };
}

function collectReferenceMarks(
  content: JSONContent,
  knownReferences: Map<string, ReferenceItem>,
) {
  const collected = new Map<string, ReferenceItem>();

  walkContent(content, (node) => {
    for (const mark of node.marks ?? []) {
      if (mark.type !== "referenceMark" || !mark.attrs) {
        continue;
      }

      const bibliographyId = asString(mark.attrs.bibliographyId);
      const citation = asString(mark.attrs.citation);
      const bibliographyEntry = asString(mark.attrs.bibliographyEntry);
      const noteId = asString(mark.attrs.noteId);

      if (!bibliographyId || !citation || !bibliographyEntry || !noteId) {
        continue;
      }

      const known = knownReferences.get(bibliographyId);

      collected.set(bibliographyId, {
        bibliographyId,
        noteId,
        citation,
        bibliographyEntry,
        sourceId: asOptionalString(mark.attrs.sourceId) ?? known?.sourceId,
        sourceLabel:
          asOptionalString(mark.attrs.sourceLabel) ?? known?.sourceLabel,
        sourceUrl: asOptionalString(mark.attrs.sourceUrl) ?? known?.sourceUrl,
      });
    }
  });

  return collected;
}

function walkContent(
  content: JSONContent | undefined,
  visit: (node: JSONContent) => void,
) {
  if (!content) {
    return;
  }

  visit(content);

  for (const child of content.content ?? []) {
    walkContent(child, visit);
  }
}

function dedupeUsedNotes(usedNotes: UsedNoteItem[]) {
  const map = new Map<string, UsedNoteItem>();

  for (const usedNote of usedNotes) {
    map.set(`${usedNote.noteType}:${usedNote.noteId}`, usedNote);
  }

  return Array.from(map.values());
}

function textToDocumentBlocks(text: string): JSONContent[] {
  const paragraphs = text
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

  if (!paragraphs.length) {
    return [
      {
        type: "paragraph",
      },
    ];
  }

  return paragraphs.map((paragraph) => ({
    type: "paragraph",
    content: paragraph
      .split("\n")
      .filter(Boolean)
      .flatMap((line, index, lines) => {
        const parts: JSONContent[] = [{ type: "text", text: line }];

        if (index < lines.length - 1) {
          parts.push({ type: "hardBreak" });
        }

        return parts;
      }),
  }));
}

function asString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function asOptionalString(value: unknown) {
  return typeof value === "string" && value.length ? value : undefined;
}
