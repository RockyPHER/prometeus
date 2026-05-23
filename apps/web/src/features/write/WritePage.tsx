import type { NoteInsertPayload } from "@prometeus/core";
import type { DragEvent } from "react";
import type { Editor } from "@tiptap/react";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { NOTE_DRAG_MIME, listenWriteInsert } from "@/lib/events/note-events";
import { ReferencesPanel } from "@/features/write/ReferencesPanel";
import { TiptapEditor } from "@/features/write/TiptapEditor";
import { WriteStatusBar } from "@/features/write/WriteStatusBar";
import { WriteToolbar } from "@/features/write/WriteToolbar";
import {
  insertNoteIntoEditor,
  synchronizeReferences,
  upsertReference,
  upsertUsedNote,
} from "@/features/write/noteInsertion";
import { useReferences } from "@/features/write/useReferences";
import { useWriteDraft } from "@/features/write/useWriteDraft";

export function WritePage() {
  const { draft, saveState, setDraft, wordCount } = useWriteDraft();
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [editor, setEditor] = useState<Editor | null>(null);
  const editorRef = useRef<Editor | null>(null);
  const {
    focusReference,
    focusedReferenceId,
    isReferencesOpen,
    registerReference,
    setIsReferencesOpen,
  } = useReferences();

  useEffect(() => {
    return listenWriteInsert(insertPayload);
  }, []);

  useEffect(() => {
    editorRef.current = editor;
  }, [editor]);

  function insertPayload(payload: NoteInsertPayload) {
    const currentEditor = editorRef.current;

    if (!currentEditor) {
      return;
    }

    const insertion = insertNoteIntoEditor(currentEditor, payload);

    setDraft((currentDraft) => {
      const referencesWithInsertion = upsertReference(
        currentDraft.references,
        insertion.reference,
      );
      const usedNotesWithInsertion = upsertUsedNote(
        currentDraft.usedNotes,
        insertion.usedNote,
      );
      const synced = synchronizeReferences({
        contentJson: currentEditor.getJSON(),
        references: referencesWithInsertion,
        usedNotes: usedNotesWithInsertion,
      });

      return {
        ...currentDraft,
        contentJson: currentEditor.getJSON(),
        references: synced.references,
        usedNotes: synced.usedNotes,
      };
    });
  }

  function handleDrop(event: DragEvent<HTMLElement>) {
    event.preventDefault();
    setIsDraggingOver(false);

    const rawData = event.dataTransfer.getData(NOTE_DRAG_MIME);

    if (!rawData) {
      return;
    }

    try {
      const payload = JSON.parse(rawData) as NoteInsertPayload;
      const currentEditor = editorRef.current;

      if (currentEditor) {
        const dropPosition = currentEditor.view.posAtCoords({
          left: event.clientX,
          top: event.clientY,
        });

        if (dropPosition?.pos) {
          currentEditor
            .chain()
            .focus()
            .setTextSelection(dropPosition.pos)
            .run();
        }
      }

      insertPayload(payload);
    } catch {
      return;
    }
  }

  return (
    <motion.section
      className="flex min-h-0 w-full flex-1 flex-col bg-surface-stage pt-10 sm:pt-12"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col">
        <div
          onDragOver={(event) => {
            event.preventDefault();
            if (!isDraggingOver) {
              setIsDraggingOver(true);
            }
          }}
          onDragLeave={() => setIsDraggingOver(false)}
          onDrop={handleDrop}
          className={cn(
            "relative flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.5rem] border border-slate-200/80 bg-surface-write-shell shadow-panel-wide backdrop-blur-sm transition duration-200",
            isDraggingOver
              ? "border-workspace-write-300 shadow-accent-wide ring-4 ring-workspace-write-100/70"
              : "",
          )}
        >
          <WriteToolbar
            editor={editor}
            isReferencesOpen={isReferencesOpen}
            onToggleReferences={() =>
              setIsReferencesOpen((current) => !current)
            }
            referenceCount={draft.references.length}
            saveState={saveState}
          />

          <div className="relative min-h-0 flex-1 overflow-hidden">
            <TiptapEditor
              content={draft.contentJson}
              onChange={({ contentJson }) =>
                setDraft((currentDraft) => {
                  const synced = synchronizeReferences({
                    contentJson,
                    references: currentDraft.references,
                    usedNotes: currentDraft.usedNotes,
                  });

                  return {
                    ...currentDraft,
                    contentJson,
                    references: synced.references,
                    usedNotes: synced.usedNotes,
                  };
                })
              }
              onReady={setEditor}
              onReferenceClick={(bibliographyId) =>
                focusReference(bibliographyId)
              }
              onTitleChange={(title) =>
                setDraft((currentDraft) => ({
                  ...currentDraft,
                  title,
                }))
              }
              references={draft.references}
              title={draft.title}
            />

            <AnimatePresence initial={false}>
              {isReferencesOpen ? (
                <ReferencesPanel
                  focusedReferenceId={focusedReferenceId}
                  onClose={() => setIsReferencesOpen(false)}
                  references={draft.references}
                  registerReference={registerReference}
                />
              ) : null}
            </AnimatePresence>
          </div>

          <WriteStatusBar
            noteCount={draft.usedNotes.length}
            referenceCount={draft.references.length}
            saveState={saveState}
            wordCount={wordCount}
          />
        </div>
      </div>
    </motion.section>
  );
}
