import {
  animate,
  motion,
  useDragControls,
  useMotionValue,
  type PanInfo,
} from "framer-motion";
import type { Note } from "@prometeus/core";
import { cn } from "@/lib/cn";
import { fallbackNotes } from "@/mock/fallbackNotes";
import { NotesList } from "@/features/notes/NotesList";
import { NotesToolbar } from "@/features/notes/NotesToolbar";
import { useNoteSearch } from "@/hooks/useNoteSearch";
import { getNotes } from "@/lib/api";
import {
  buildReferenceNavigationPayload,
  dispatchNoteEdit,
  dispatchReferenceFocus,
} from "@/lib/events/note-events";
import { useEffect, useLayoutEffect, useRef, useState } from "react";

const drawerSurfaceClass = "bg-slate-100";
const CLOSED_VISIBLE_HEIGHT = 64;
const HIDDEN_OFFSET = 24;
type DrawerLevel = "collapsed" | "half" | "expanded";
type DrawerTransitionSource = "click" | "drag" | "layout";

type BottomDrawerProps = {
  canInsertNotes?: boolean;
};

export function BottomDrawer({ canInsertNotes = false }: BottomDrawerProps) {
  const handleRef = useRef<HTMLButtonElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const drawerRef = useRef<HTMLElement | null>(null);
  const dragControls = useDragControls();
  const drawerY = useMotionValue(0);
  const [drawerLevel, setDrawerLevel] = useState<DrawerLevel>("collapsed");
  const [snapPoints, setSnapPoints] = useState({
    expanded: 0,
    half: 0,
    collapsed: 0,
    hidden: 0,
  });
  const [notes, setNotes] = useState<Note[]>(fallbackNotes);
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<Note["type"] | "all">("all");
  const [draggedNoteId, setDraggedNoteId] = useState<string | null>(null);
  const [isDragOutsideDrawer, setIsDragOutsideDrawer] = useState(false);
  const [isHandleHovered, setIsHandleHovered] = useState(false);
  const suppressHandleClickRef = useRef(false);
  const isDraggingDrawerRef = useRef(false);
  const hasMeasuredLayoutRef = useRef(false);
  const drawerLevelRef = useRef<DrawerLevel>("collapsed");
  const transitionSourceRef = useRef<DrawerTransitionSource>("layout");
  const searchedNotes = useNoteSearch(notes, query);
  const filteredNotes = searchedNotes.filter((note) =>
    activeFilter === "all" ? true : note.type === activeFilter,
  );

  useEffect(() => {
    drawerLevelRef.current = drawerLevel;
  }, [drawerLevel]);

  useLayoutEffect(() => {
    const wrapperElement = wrapperRef.current;

    if (!wrapperElement) {
      return;
    }

    function updateSnapPoints() {
      const nextWrapperElement = wrapperRef.current;
      const nextHandleElement = handleRef.current;

      if (!nextWrapperElement) {
        return;
      }

      const wrapperHeight = nextWrapperElement.offsetHeight;
      const visibleHeight = Math.max(
        nextHandleElement?.offsetHeight ?? 0,
        CLOSED_VISIBLE_HEIGHT,
      );
      const collapsed = Math.max(wrapperHeight - visibleHeight, 0);
      const half = collapsed / 2;
      const nextSnapPoints = {
        expanded: 0,
        half,
        collapsed,
        hidden: wrapperHeight + HIDDEN_OFFSET,
      };

      setSnapPoints(nextSnapPoints);

      if (!isDragOutsideDrawer && !isDraggingDrawerRef.current) {
        if (!hasMeasuredLayoutRef.current) {
          drawerY.jump(nextSnapPoints[drawerLevelRef.current]);
          hasMeasuredLayoutRef.current = true;
          return;
        }

        if (transitionSourceRef.current === "layout") {
          drawerY.jump(nextSnapPoints[drawerLevelRef.current]);
        }
      }
    }

    updateSnapPoints();

    const resizeObserver = new ResizeObserver(() => {
      updateSnapPoints();
    });

    resizeObserver.observe(wrapperElement);
    window.addEventListener("resize", updateSnapPoints);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateSnapPoints);
    };
  }, [drawerY, isDragOutsideDrawer]);

  useEffect(() => {
    const targetY = isDragOutsideDrawer
      ? snapPoints.hidden
      : snapPoints[drawerLevel];
    const transition =
      transitionSourceRef.current === "click"
        ? {
            type: "spring" as const,
            stiffness: 185,
            damping: 22,
            mass: 0.95,
          }
        : {
            type: "spring" as const,
            stiffness: 190,
            damping: 28,
          };

    const controls = animate(drawerY, targetY, transition);

    transitionSourceRef.current = "layout";

    return () => {
      controls.stop();
    };
  }, [drawerLevel, drawerY, isDragOutsideDrawer, snapPoints]);

  useEffect(() => {
    let isMounted = true;

    getNotes()
      .then((remoteNotes) => {
        if (isMounted) {
          setNotes(remoteNotes);
        }
      })
      .catch(() => {
        if (isMounted) {
          setNotes(fallbackNotes);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!draggedNoteId) {
      return;
    }

    function handleGlobalDragOver(event: DragEvent) {
      const drawerElement = drawerRef.current;

      if (!drawerElement) {
        return;
      }

      const rect = drawerElement.getBoundingClientRect();
      const isInsideDrawer =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;

      setIsDragOutsideDrawer(!isInsideDrawer);
    }

    function handleGlobalDrop() {
      setDraggedNoteId(null);
      setIsDragOutsideDrawer(false);
    }

    window.addEventListener("dragover", handleGlobalDragOver);
    window.addEventListener("drop", handleGlobalDrop);
    window.addEventListener("dragend", handleGlobalDrop);

    return () => {
      window.removeEventListener("dragover", handleGlobalDragOver);
      window.removeEventListener("drop", handleGlobalDrop);
      window.removeEventListener("dragend", handleGlobalDrop);
    };
  }, [draggedNoteId]);

  function handleOpenReference(note: Note) {
    if (note.type !== "reference") {
      return;
    }

    const payload = buildReferenceNavigationPayload(note);
    dispatchReferenceFocus(payload);
  }

  function handleDelete(note: Note) {
    setNotes((currentNotes) =>
      currentNotes.filter((currentNote) => currentNote.id !== note.id),
    );
  }

  function handleEdit(note: Note) {
    setNotes((currentNotes) =>
      currentNotes.map((currentNote) =>
        currentNote.id === note.id ? note : currentNote,
      ),
    );
    dispatchNoteEdit(note);
  }

  function handleDragStartNote(note: Note) {
    setDraggedNoteId(note.id);
    setIsDragOutsideDrawer(false);
  }

  function handleDragEndNote() {
    setDraggedNoteId(null);
    setIsDragOutsideDrawer(false);
  }

  function handleDragOverNote(targetNote: Note) {
    if (!draggedNoteId || draggedNoteId === targetNote.id) {
      return;
    }

    const visibleIds = filteredNotes.map((note) => note.id);
    const draggedVisibleIndex = visibleIds.indexOf(draggedNoteId);
    const targetVisibleIndex = visibleIds.indexOf(targetNote.id);

    if (draggedVisibleIndex === -1 || targetVisibleIndex === -1) {
      return;
    }

    const reorderedVisibleIds = [...visibleIds];
    const [draggedVisibleId] = reorderedVisibleIds.splice(
      draggedVisibleIndex,
      1,
    );
    reorderedVisibleIds.splice(targetVisibleIndex, 0, draggedVisibleId);

    setNotes((currentNotes) => {
      const noteById = new Map(currentNotes.map((note) => [note.id, note]));
      const visibleIdSet = new Set(visibleIds);
      let nextVisibleIndex = 0;

      return currentNotes.map((note) => {
        if (!visibleIdSet.has(note.id)) {
          return note;
        }

        const reorderedNote = noteById.get(
          reorderedVisibleIds[nextVisibleIndex],
        );
        nextVisibleIndex += 1;
        return reorderedNote ?? note;
      });
    });
  }

  function handleHandlePointerDown(
    event: React.PointerEvent<HTMLButtonElement>,
  ) {
    suppressHandleClickRef.current = false;
    dragControls.start(event);
  }

  function handleHandleClick() {
    if (suppressHandleClickRef.current) {
      suppressHandleClickRef.current = false;
      return;
    }

    transitionSourceRef.current = "click";

    if (drawerLevel === "collapsed") {
      setDrawerLevel("half");
      return;
    }

    if (drawerLevel === "half") {
      setDrawerLevel("expanded");
      return;
    }

    setDrawerLevel("collapsed");
  }

  function handleDrawerDragStart() {
    isDraggingDrawerRef.current = true;
    transitionSourceRef.current = "drag";
  }

  function handleDrawerDragEnd(
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) {
    isDraggingDrawerRef.current = false;
    const currentY = drawerY.get();
    const projectedY = currentY + info.velocity.y * 0.14;
    const snapCandidates: Array<{ level: DrawerLevel; value: number }> = [
      { level: "expanded", value: snapPoints.expanded },
      { level: "half", value: snapPoints.half },
      { level: "collapsed", value: snapPoints.collapsed },
    ];
    const nextLevel = snapCandidates.reduce((closest, candidate) => {
      if (
        Math.abs(candidate.value - projectedY) <
        Math.abs(closest.value - projectedY)
      ) {
        return candidate;
      }

      return closest;
    }).level;

    suppressHandleClickRef.current = Math.abs(info.offset.y) > 6;
    setDrawerLevel(nextLevel);
  }

  return (
    <div className="pointer-events-none fixed inset-0 z-50 flex items-end justify-center">
      <motion.div
        ref={wrapperRef}
        className="pointer-events-none flex w-full flex-col items-center gap-0"
        initial={false}
        style={{ y: drawerY }}
        drag="y"
        dragControls={dragControls}
        dragListener={false}
        dragConstraints={{
          top: snapPoints.expanded,
          bottom: snapPoints.collapsed,
        }}
        dragElastic={{ top: 0, bottom: 0.04 }}
        dragMomentum={false}
        onDragStart={handleDrawerDragStart}
        onDragEnd={handleDrawerDragEnd}
        animate={{ opacity: isDragOutsideDrawer ? 0 : 1 }}
        transition={{ opacity: { duration: 0.16 } }}
      >
        <button
          ref={handleRef}
          type="button"
          aria-label={
            drawerLevel === "collapsed"
              ? "Abrir drawer de notas"
              : "Fechar drawer de notas"
          }
          title={
            drawerLevel === "collapsed"
              ? "Abrir drawer de notas"
              : "Fechar drawer de notas"
          }
          onPointerDown={handleHandlePointerDown}
          onClick={handleHandleClick}
          onMouseEnter={() => setIsHandleHovered(true)}
          onMouseLeave={() => setIsHandleHovered(false)}
          className={cn(
            "bg-white/88 pointer-events-auto z-20 -mb-px inline-flex h-9 w-16 items-center justify-center rounded-b-none rounded-t-full border-x border-t border-slate-200 shadow-panel-soft transition-[border-color,background-color] duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300/70",
            drawerSurfaceClass,
            isHandleHovered && "border-slate-300 bg-white",
          )}
        >
          <span className="sr-only">
            {drawerLevel === "collapsed"
              ? "Abrir drawer de notas"
              : "Fechar drawer de notas"}
          </span>
          <span className="pointer-events-none flex flex-col gap-[3px]">
            <span
              className={cn(
                "h-[1.5px] w-5 rounded-full bg-slate-400/75 transition duration-300",
                isHandleHovered && "bg-slate-500/80",
              )}
            />
            <span
              className={cn(
                "h-[1.5px] w-5 rounded-full bg-slate-400/75 transition duration-300",
                isHandleHovered && "bg-slate-500/80",
              )}
            />
            <span
              className={cn(
                "h-[1.5px] w-5 rounded-full bg-slate-400/75 transition duration-300",
                isHandleHovered && "bg-slate-500/80",
              )}
            />
          </span>
        </button>

        <motion.aside
          ref={drawerRef}
          animate={{
            scale:
              drawerLevel === "collapsed"
                ? 0.992
                : drawerLevel === "half"
                  ? 0.997
                  : 1,
          }}
          transition={{
            type: "spring",
            stiffness: 180,
            damping: 24,
            mass: 0.96,
          }}
          className={cn(
            "pointer-events-auto relative h-[calc(100dvh-3rem)] max-h-[calc(100dvh-3rem)] min-h-72 w-full rounded-t-[2rem] border border-slate-300 shadow-sm",
            drawerSurfaceClass,
          )}
        >
          <div className="mx-auto flex h-full w-full flex-col gap-5 overflow-hidden px-5 pb-5 pt-8 sm:px-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Drawer de notas
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Materiais compartilhados entre Lab e Write para consultar,
                  editar e inserir.
                </p>
              </div>

              <NotesToolbar
                query={query}
                activeFilter={activeFilter}
                onQueryChange={setQuery}
                onFilterChange={setActiveFilter}
              />
            </div>

            <NotesList
              canInsertNotes={canInsertNotes}
              draggedNoteId={draggedNoteId}
              notes={filteredNotes}
              onDeleteNote={handleDelete}
              onDragEndNote={handleDragEndNote}
              onDragOverNote={handleDragOverNote}
              onDragStartNote={handleDragStartNote}
              onEditNote={handleEdit}
              onOpenReference={handleOpenReference}
            />
          </div>
        </motion.aside>
      </motion.div>
    </div>
  );
}
