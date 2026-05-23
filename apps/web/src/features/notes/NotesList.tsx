import type { Note } from "@prometeus/core";
import { NoteCard } from "@/features/notes/NoteCard";
import { AnimatePresence } from "framer-motion";

type NotesListProps = {
  canInsertNotes?: boolean;
  draggedNoteId: string | null;
  notes: Note[];
  onDeleteNote: (note: Note) => void;
  onDragEndNote: () => void;
  onDragOverNote: (targetNote: Note) => void;
  onDragStartNote: (note: Note) => void;
  onEditNote: (note: Note) => void;
  onOpenReference: (note: Note) => void;
};

export function NotesList({
  canInsertNotes = false,
  draggedNoteId,
  notes,
  onDeleteNote,
  onDragEndNote,
  onDragOverNote,
  onDragStartNote,
  onEditNote,
  onOpenReference,
}: NotesListProps) {
  if (notes.length === 0) {
    return (
      <div className="flex min-h-32 items-center rounded-2xl border border-white/60 bg-white/35 px-5 text-sm text-slate-500">
        Nenhuma nota encontrada com esse filtro.
      </div>
    );
  }

  return (
    <div className="drawer-scroll grid min-h-0 auto-rows-max grid-cols-1 content-start items-start gap-4 overflow-y-auto overflow-x-hidden pb-3 pr-2 md:grid-cols-2 2xl:grid-cols-3">
      <AnimatePresence initial={false}>
        {notes.map((note) => (
          <NoteCard
            key={note.id}
            canInsert={canInsertNotes}
            note={note}
            draggedNoteId={draggedNoteId}
            onDelete={onDeleteNote}
            onDragEndNote={onDragEndNote}
            onDragOverNote={onDragOverNote}
            onDragStartNote={onDragStartNote}
            onEdit={onEditNote}
            onOpenReference={onOpenReference}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
