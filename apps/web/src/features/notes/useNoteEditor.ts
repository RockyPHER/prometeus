import type { Note } from "@prometeus/core";
import { useEffect, useState } from "react";

type UseNoteEditorParams = {
  note: Note;
  onEdit: (note: Note) => void;
};

export function useNoteEditor({ note, onEdit }: UseNoteEditorParams) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [draftTitle, setDraftTitle] = useState(note.title);
  const [draftContent, setDraftContent] = useState(note.content);

  function openEditor() {
    setDraftTitle(note.title);
    setDraftContent(note.content);
    setIsExpanded(true);
  }

  function closeEditor() {
    setIsExpanded(false);
  }

  function saveEditor() {
    const nextTitle = draftTitle.trim() || note.title;
    const nextContent = draftContent.trim() || note.content;

    onEdit({
      ...note,
      title: nextTitle,
      content: nextContent,
      updatedAt: new Date().toISOString(),
    });
    setIsExpanded(false);
  }

  useEffect(() => {
    if (!isExpanded) {
      return;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsExpanded(false);
      }

      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        saveEditor();
      }
    }

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [draftContent, draftTitle, isExpanded, note]);

  return {
    closeEditor,
    draftContent,
    draftTitle,
    isExpanded,
    openEditor,
    saveEditor,
    setDraftContent,
    setDraftTitle,
  };
}
