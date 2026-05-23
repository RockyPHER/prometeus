import type { Note } from "@prometeus/core";
import { GlassPanel, IconButton } from "@/components/ui";
import { cn } from "@/lib/cn";
import { useNoteEditor } from "@/features/notes/useNoteEditor";
import {
  NOTE_DRAG_MIME,
  buildInsertPayload,
  dispatchWriteInsert,
} from "@/lib/events/note-events";
import { motion } from "framer-motion";
import {
  BookMarked,
  Check,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Link2,
  Pencil,
  Plus,
  Quote,
  ScrollText,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { createPortal } from "react-dom";
import { webColors, withAlpha } from "@/theme/colors";
import { noteThemes } from "@/theme/semantic";

const shellBaseClass =
  "group relative flex min-w-0 cursor-grab select-none flex-col overflow-hidden rounded-[1rem] border border-slate-200/90 bg-white p-4 shadow-panel transition duration-200 active:cursor-grabbing";

const contentSurfaceClass =
  "mt-2 rounded-[0.8rem] bg-transparent px-0 py-0 text-left";

const referenceSurfaceClass = "mt-3 space-y-3 rounded-[0.9rem] p-3";

const editorBackdropClass =
  "fixed inset-0 z-[100] flex h-dvh w-screen items-center justify-center bg-black/60 p-4 backdrop-blur-sm";

const editorCardClass =
  "relative flex h-[min(92dvh,920px)] w-[min(94vw,1040px)] flex-col overflow-hidden rounded-[1rem] border border-slate-200 bg-white shadow-2xl";

const editorFieldWrapClass = "rounded-[0.9rem] bg-slate-100 p-1.5";

const editorFieldClass =
  "w-full rounded-[0.8rem] bg-white px-4 outline-none ring-1 ring-slate-200 transition focus:ring-slate-300";

type NoteCardProps = {
  canInsert?: boolean;
  note: Note;
  draggedNoteId: string | null;
  onDelete: (note: Note) => void;
  onDragEndNote: () => void;
  onDragOverNote: (targetNote: Note) => void;
  onDragStartNote: (note: Note) => void;
  onEdit: (note: Note) => void;
  onOpenReference: (note: Note) => void;
};

export function NoteCard({
  canInsert = false,
  note,
  draggedNoteId,
  onDelete,
  onDragEndNote,
  onDragOverNote,
  onDragStartNote,
  onEdit,
  onOpenReference,
}: NoteCardProps) {
  const updatedLabel = formatTimestamp(note.updatedAt ?? note.createdAt);
  const isDragging = draggedNoteId === note.id;
  const isDropTarget = draggedNoteId !== null && draggedNoteId !== note.id;
  const noteTheme = noteThemes[note.type];
  const [isReferenceExpanded, setIsReferenceExpanded] = useState(false);
  const {
    closeEditor,
    draftContent,
    draftTitle,
    isExpanded,
    openEditor,
    saveEditor,
    setDraftContent,
    setDraftTitle,
  } = useNoteEditor({ note, onEdit });
  const referenceSummary =
    note.type === "reference"
      ? note.source.citation?.trim() || note.source.label
      : null;

  function handleDragStart(event: React.DragEvent<HTMLElement>) {
    if (isExpanded) {
      event.preventDefault();
      return;
    }

    if ((event.target as HTMLElement).closest("[data-no-drag='true']")) {
      event.preventDefault();
      return;
    }

    const payload = buildInsertPayload(note);

    event.dataTransfer.effectAllowed = "copy";
    event.dataTransfer.setData(NOTE_DRAG_MIME, JSON.stringify(payload));
    event.dataTransfer.setData("text/plain", payload.content);
    setDragPreview(event, note);
    onDragStartNote(note);
  }

  function handleInsertNote() {
    dispatchWriteInsert(buildInsertPayload(note));
  }

  return (
    <>
      <motion.article
        draggable
        initial={{ opacity: 0, y: 10, scale: 0.98 }}
        animate={{
          opacity: isDragging ? 0.48 : 1,
          y: 0,
          scale: isDragging ? 0.985 : 1,
        }}
        exit={{ opacity: 0, y: 8, scale: 0.98 }}
        transition={{
          opacity: { duration: 0.18 },
          scale: { duration: 0.2 },
          y: { duration: 0.2 },
        }}
        onDragEnter={(event) => {
          event.preventDefault();
          onDragOverNote(note);
        }}
        onDragOver={(event) => event.preventDefault()}
        onDragStartCapture={handleDragStart}
        onDragEndCapture={onDragEndNote}
        className="min-h-0 w-full self-start"
      >
        <GlassPanel
          className={cn(
            shellBaseClass,
            noteTheme.shell,
            noteTheme.hover,
            isDragging && "shadow-none ring-1 ring-slate-200",
            isDropTarget && "shadow-panel-soft ring-1 ring-workspace-lab-200",
          )}
        >
          <div
            className={cn(
              "absolute inset-x-4 top-0 h-[3px] rounded-b-full",
              noteTheme.strip,
            )}
          />

          <NoteHeader note={note} updatedLabel={updatedLabel} />

          <button
            type="button"
            data-no-drag="true"
            onClick={openEditor}
            className="group/title relative mt-3 w-full cursor-text text-left"
          >
            <h3 className="pr-8 text-[17px] font-semibold leading-6 text-slate-950">
              {note.title}
            </h3>
            <span className="pointer-events-none absolute right-3 top-1/2 inline-flex -translate-y-1/2 items-center gap-0.5 opacity-0 transition duration-200 group-hover/title:opacity-100">
              <Pencil
                className={cn("h-3.5 w-3.5", noteTheme.icon)}
                strokeWidth={1.9}
              />
              <ChevronRight
                className={cn("h-3 w-3", noteTheme.badgeText)}
                strokeWidth={1.9}
              />
            </span>
          </button>

          <button
            type="button"
            data-no-drag="true"
            onClick={openEditor}
            className={cn(
              contentSurfaceClass,
              "group/content relative w-full cursor-text pr-8",
            )}
          >
            <p className="line-clamp-3 text-[14px] leading-6 text-slate-600">
              {note.content}
            </p>
            <span className="pointer-events-none absolute right-0 top-0 inline-flex items-center gap-0.5 opacity-0 transition duration-200 group-hover/content:opacity-100">
              <Pencil
                className={cn("h-3.5 w-3.5", noteTheme.icon)}
                strokeWidth={1.9}
              />
              <ChevronRight
                className={cn("h-3 w-3", noteTheme.badgeText)}
                strokeWidth={1.9}
              />
            </span>
          </button>

          {note.type === "reference" ? (
            <>
              <div className="mt-4 flex items-center gap-2">
                <button
                  type="button"
                  data-no-drag="true"
                  onClick={() => onOpenReference(note)}
                  className={cn(
                    "flex min-w-0 flex-1 items-center gap-3 rounded-[0.85rem] border px-3 py-2.5 text-left transition duration-200",
                    noteTheme.control,
                  )}
                >
                  <span
                    className={cn(
                      "inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/90 shadow-sm",
                      noteTheme.badgeText,
                    )}
                  >
                    <Link2 className="h-4 w-4" strokeWidth={2} />
                  </span>
                  <span className="min-w-0">
                    <span
                      className={cn(
                        "block truncate text-[13px] font-medium",
                        noteTheme.badgeText,
                      )}
                    >
                      {referenceSummary}
                      <span className="text-note-reference-600/80">
                        {" "}
                        · ABNT
                      </span>
                    </span>
                    <span className="block truncate text-[11px] text-note-reference-700/75">
                      Fonte vinculada
                    </span>
                  </span>
                </button>
                <button
                  type="button"
                  data-no-drag="true"
                  aria-expanded={isReferenceExpanded}
                  aria-label={
                    isReferenceExpanded
                      ? "Recolher detalhes da referência"
                      : "Expandir detalhes da referência"
                  }
                  onClick={() => setIsReferenceExpanded((current) => !current)}
                  className={cn(
                    "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.85rem] border bg-white shadow-sm transition duration-200",
                    noteTheme.control,
                  )}
                >
                  <ChevronDown
                    className={cn(
                      "h-4 w-4 transition duration-200",
                      isReferenceExpanded && "rotate-180",
                    )}
                    strokeWidth={2.2}
                  />
                </button>
              </div>

              {isReferenceExpanded ? (
                <ReferenceSection
                  note={note}
                  onOpenReference={onOpenReference}
                />
              ) : null}
            </>
          ) : null}

          <NoteFooter
            canInsert={canInsert}
            note={note}
            onDelete={onDelete}
            onInsert={handleInsertNote}
            onOpenReference={onOpenReference}
          />
        </GlassPanel>
      </motion.article>

      <NoteExpandedEditor
        draftContent={draftContent}
        draftTitle={draftTitle}
        isOpen={isExpanded}
        note={note}
        onChangeContent={setDraftContent}
        onChangeTitle={setDraftTitle}
        onClose={closeEditor}
        onSave={saveEditor}
        updatedLabel={updatedLabel}
      />
    </>
  );
}

type NoteHeaderProps = {
  note: Note;
  updatedLabel: string;
};

function NoteHeader({ note, updatedLabel }: NoteHeaderProps) {
  const TypeIcon = note.type === "reference" ? BookMarked : FileText;
  const noteTheme = noteThemes[note.type];

  return (
    <div className="flex min-w-0 items-start justify-between gap-3">
      <div className="flex min-w-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-[0.85rem]",
              noteTheme.badge,
            )}
          >
            <TypeIcon
              className={cn("h-[1.05rem] w-[1.05rem]", noteTheme.icon)}
              strokeWidth={1.9}
            />
          </span>
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.08em] text-slate-400">
          {updatedLabel}
        </span>
      </div>
    </div>
  );
}

type NoteFooterProps = {
  canInsert: boolean;
  note: Note;
  onDelete: (note: Note) => void;
  onInsert: () => void;
  onOpenReference: (note: Note) => void;
};

function NoteFooter({
  canInsert,
  note,
  onDelete,
  onInsert,
  onOpenReference,
}: NoteFooterProps) {
  const noteTheme = noteThemes[note.type];

  return (
    <div className="mt-4 flex items-end justify-between gap-3 border-t border-slate-200/70 pt-3">
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {note.tags.map((tag) => (
          <span
            key={tag}
            className={cn(
              "rounded-full border px-2.5 py-1 text-[11px] font-medium",
              noteTheme.tag,
            )}
          >
            {tag}
          </span>
        ))}
      </div>

      <div className="flex shrink-0 items-center gap-1">
        {canInsert ? (
          <IconButton
            data-no-drag="true"
            label="Inserir nota no Write"
            onClick={onInsert}
            className={cn(
              "h-8 w-8 border-transparent bg-transparent shadow-none transition duration-200",
              noteTheme.footerAction,
            )}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2} />
          </IconButton>
        ) : null}

        {note.type === "reference" ? (
          <IconButton
            data-no-drag="true"
            label="Abrir referência"
            onClick={() => onOpenReference(note)}
            className={cn(
              "h-8 w-8 border-transparent bg-transparent shadow-none transition duration-200",
              noteTheme.footerAction,
            )}
          >
            <ExternalLink className="h-3.5 w-3.5" strokeWidth={2} />
          </IconButton>
        ) : null}

        <IconButton
          data-no-drag="true"
          label="Excluir nota"
          onClick={() => onDelete(note)}
          className="h-8 w-8 border-transparent bg-transparent text-slate-400 shadow-none transition duration-200 hover:border-rose-100 hover:bg-rose-50 hover:text-rose-600"
        >
          <Trash2 className="h-3.5 w-3.5" strokeWidth={2} />
        </IconButton>
      </div>
    </div>
  );
}

type NoteExpandedEditorProps = {
  draftContent: string;
  draftTitle: string;
  isOpen: boolean;
  note: Note;
  onChangeContent: (content: string) => void;
  onChangeTitle: (title: string) => void;
  onClose: () => void;
  onSave: () => void;
  updatedLabel: string;
};

function NoteExpandedEditor({
  draftContent,
  draftTitle,
  isOpen,
  note,
  onChangeContent,
  onChangeTitle,
  onClose,
  onSave,
  updatedLabel,
}: NoteExpandedEditorProps) {
  if (!isOpen) {
    return null;
  }

  if (typeof document === "undefined") {
    return null;
  }

  const TypeIcon = note.type === "reference" ? BookMarked : FileText;
  const noteTheme = noteThemes[note.type];

  return createPortal(
    <div className={editorBackdropClass} data-no-drag="true" onClick={onClose}>
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.985, y: 8 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        className="flex h-full w-full items-center justify-center"
        onClick={(event) => event.stopPropagation()}
      >
        <GlassPanel className={editorCardClass}>
          <div className="flex items-start justify-between gap-4 border-b border-slate-200/70 px-5 py-4 sm:px-6">
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={cn(
                  "inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium",
                  noteTheme.editorBadge,
                )}
              >
                <TypeIcon
                  className={cn("h-[1.1rem] w-[1.1rem]", noteTheme.icon)}
                  strokeWidth={1.9}
                />
              </span>
              <span className="text-sm text-slate-400">{updatedLabel}</span>
            </div>

            <div className="flex items-center gap-2">
              <IconButton
                data-no-drag="true"
                label="Salvar edição"
                onClick={onSave}
                className={cn("h-9 w-9", noteTheme.control)}
              >
                <Check className="h-4 w-4" strokeWidth={1.9} />
              </IconButton>
              <IconButton
                data-no-drag="true"
                label="Fechar edição"
                onClick={onClose}
                className="h-9 w-9 border border-slate-200 bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
              >
                <X className="h-4 w-4" strokeWidth={1.9} />
              </IconButton>
            </div>
          </div>

          <div className="flex min-h-0 flex-1 flex-col gap-4 px-5 py-5 sm:px-6">
            <div className={editorFieldWrapClass}>
              <input
                data-no-drag="true"
                value={draftTitle}
                onChange={(event) => onChangeTitle(event.target.value)}
                className={cn(
                  editorFieldClass,
                  "py-3 text-lg font-semibold leading-7 text-slate-950",
                )}
              />
            </div>

            <div className="min-h-0 flex-1">
              <div className={cn(editorFieldWrapClass, "flex h-full flex-col")}>
                <textarea
                  data-no-drag="true"
                  value={draftContent}
                  onChange={(event) => onChangeContent(event.target.value)}
                  className={cn(
                    editorFieldClass,
                    "h-full min-h-0 flex-1 resize-none py-4 text-[15px] leading-7 text-slate-700",
                  )}
                />
              </div>
            </div>
          </div>
        </GlassPanel>
      </motion.div>
    </div>,
    document.body,
  );
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
  }).format(new Date(value));
}

function setDragPreview(event: React.DragEvent<HTMLElement>, note: Note) {
  const preview = document.createElement("div");

  preview.textContent = note.title;
  preview.style.position = "fixed";
  preview.style.top = "-120px";
  preview.style.left = "0";
  preview.style.maxWidth = "280px";
  preview.style.padding = "12px 14px";
  preview.style.border = `1px solid ${withAlpha(webColors.slate[200], 1)}`;
  preview.style.borderRadius = "18px";
  preview.style.background = withAlpha(webColors.white, 1);
  preview.style.boxShadow = `0 10px 24px ${withAlpha(webColors.slate[900], 0.08)}`;
  preview.style.color = webColors.slate[900];
  preview.style.font = "600 13px Inter, ui-sans-serif, system-ui, sans-serif";
  preview.style.pointerEvents = "none";
  preview.style.whiteSpace = "nowrap";
  preview.style.overflow = "hidden";
  preview.style.textOverflow = "ellipsis";

  document.body.appendChild(preview);
  event.dataTransfer.setDragImage(preview, 18, 18);

  window.setTimeout(() => {
    preview.remove();
  }, 0);
}

type ReferenceSectionProps = {
  note: Extract<Note, { type: "reference" }>;
  onOpenReference: (note: Note) => void;
};

function ReferenceSection({ note, onOpenReference }: ReferenceSectionProps) {
  const noteTheme = noteThemes.reference;

  return (
    <motion.div
      initial={{ height: 0, opacity: 0 }}
      animate={{ height: "auto", opacity: 1 }}
      exit={{ height: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="overflow-hidden"
    >
      <div className={cn(referenceSurfaceClass, noteTheme.surface)}>
        <div className="rounded-[0.8rem] bg-note-reference-50/80 px-3 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-note-reference-800">
            <Quote className="h-4 w-4" strokeWidth={1.9} />
            <span>Trecho vinculado</span>
          </div>
          <p className="text-[14px] leading-6 text-slate-700">
            {note.source.excerpt}
          </p>
        </div>

        <div className="rounded-[0.8rem] bg-note-free-50/85 px-3 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-slate-600">
            <ExternalLink
              className="h-4 w-4 text-note-reference-600"
              strokeWidth={1.9}
            />
            <span>Fonte</span>
          </div>
          <div className="space-y-2">
            <button
              type="button"
              data-no-drag="true"
              onClick={() => onOpenReference(note)}
              className="block text-left text-sm font-medium text-slate-700 transition hover:text-note-reference-800"
            >
              {note.source.label}
            </button>
            {note.source.details?.length ? (
              <p className="text-xs leading-5 text-slate-500">
                {note.source.details.join(" · ")}
              </p>
            ) : null}
            {note.source.href ? (
              <a
                data-no-drag="true"
                href={note.source.href}
                target="_blank"
                rel="noreferrer"
                className="inline-flex max-w-full items-center gap-1 truncate text-xs font-medium text-note-reference-700 underline decoration-note-reference-200 underline-offset-4"
              >
                <span className="truncate">{note.source.href}</span>
                <ExternalLink
                  className="h-3.5 w-3.5 shrink-0"
                  strokeWidth={1.8}
                />
              </a>
            ) : null}
          </div>
        </div>

        <div className="rounded-[0.8rem] bg-note-free-50/85 px-3 py-3">
          <div className="mb-1.5 flex items-center gap-2 text-[12px] font-semibold text-slate-600">
            <ScrollText
              className="h-4 w-4 text-note-reference-600"
              strokeWidth={1.9}
            />
            <span>Referência ABNT</span>
          </div>
          <p className="text-[14px] leading-6 text-slate-600">
            {note.source.abntReference}
          </p>
        </div>

        <button
          type="button"
          data-no-drag="true"
          onClick={() => onOpenReference(note)}
          className={cn(
            "inline-flex items-center gap-1 text-xs font-medium",
            noteTheme.expandableAction,
          )}
        >
          {note.source.citation}
          <ExternalLink className="h-3.5 w-3.5" strokeWidth={1.8} />
        </button>
      </div>
    </motion.div>
  );
}
