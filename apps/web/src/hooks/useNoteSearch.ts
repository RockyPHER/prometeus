import { useMemo } from "react";
import type { Note } from "@prometeus/core";

export function useNoteSearch(notes: Note[], query: string) {
  return useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    if (!normalizedQuery) {
      return notes;
    }

    return notes.filter((note) => {
      const searchable = [
        note.title,
        note.type,
        note.content,
        ...note.tags,
        ...(note.type === "reference"
          ? [
              note.source.label,
              note.source.excerpt,
              note.source.citation,
              note.source.abntReference,
              ...(note.source.details ?? []),
            ]
          : []),
      ]
        .join(" ")
        .toLowerCase();

      return searchable.includes(normalizedQuery);
    });
  }, [notes, query]);
}
