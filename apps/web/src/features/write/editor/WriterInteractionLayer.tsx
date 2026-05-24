"use client";

import type {
  ClipboardEvent,
  FocusEvent as ReactFocusEvent,
  KeyboardEvent as ReactKeyboardEvent,
  MouseEvent as ReactMouseEvent,
  ReactNode,
} from "react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
} from "react";
import {
  applyEnter,
  updateWriterBlockContent,
  type PaginatedDocument,
  type WriterDocument,
  type WriterRangeSelection,
  type WriterSelection,
} from "@/features/write/document/writerDocument";
import {
  areWriterPositionsEqual,
  areWriterRangeSelectionsEqual,
  deleteWriterRange,
  getPlainTextFromWriterRange,
  insertPlainTextAtSelection,
  isWriterRangeSelectionCollapsed,
  replaceWriterRangeWithText,
  selectAllWriterDocument,
} from "@/features/write/document/writerSelection";
import {
  findClosestWriterEditable,
  resolveWriterSelectionTargetFromPoint,
  syncNativeSelectionForWriterRange,
  type WriterSelectionTarget,
} from "@/features/write/editor/writerInteractionDom";
import type {
  WriterSurfaceEditEvent,
  WriterSurfaceSelectionEvent,
} from "@/features/write/editor/writerSurfaceEvents";

type WriterInteractionLayerProps = {
  children: ReactNode;
  onChangeDocument: (
    nextDocument: WriterDocument,
    nextSelection: WriterSelection | null,
    options?: { flush?: boolean },
  ) => void;
  onEditableFocusChange?: (isFocused: boolean) => void;
  onChangeRangeSelection: (
    nextRangeSelection: WriterRangeSelection | null,
  ) => void;
  onChangeSelection: (
    nextSelection: WriterSelection | null,
    options?: { flush?: boolean },
  ) => void;
  paginatedDocument: PaginatedDocument;
  rangeSelection: WriterRangeSelection | null;
  selection: WriterSelection | null;
  writerDocument: WriterDocument;
};

type WriterInteractionContextValue = {
  onSurfaceEdit: (event: WriterSurfaceEditEvent) => void;
  onSurfaceSelection: (event: WriterSurfaceSelectionEvent) => void;
  rangeSelection: WriterRangeSelection | null;
  selection: WriterSelection | null;
  writerDocument: WriterDocument;
};

type DragSelectionState = {
  anchorPosition: WriterSelectionTarget["position"];
  lastTarget: WriterSelectionTarget;
};

const WriterInteractionContext =
  createContext<WriterInteractionContextValue | null>(null);

export function WriterInteractionLayer({
  children,
  onChangeDocument,
  onEditableFocusChange,
  onChangeRangeSelection,
  onChangeSelection,
  paginatedDocument,
  rangeSelection,
  selection,
  writerDocument,
}: WriterInteractionLayerProps) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const dragSelectionRef = useRef<DragSelectionState | null>(null);
  const paginatedDocumentRef = useRef(paginatedDocument);
  const rangeSelectionRef = useRef(rangeSelection);
  const selectionRef = useRef(selection);
  const writerDocumentRef = useRef(writerDocument);

  useEffect(() => {
    paginatedDocumentRef.current = paginatedDocument;
  }, [paginatedDocument]);

  useEffect(() => {
    rangeSelectionRef.current = rangeSelection;
  }, [rangeSelection]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    writerDocumentRef.current = writerDocument;
  }, [writerDocument]);

  useLayoutEffect(() => {
    if (!rootRef.current || !rangeSelection) {
      return;
    }

    syncNativeSelectionForWriterRange(
      rootRef.current,
      paginatedDocument,
      writerDocument,
      rangeSelection,
    );
  }, [paginatedDocument, rangeSelection, writerDocument]);

  const commitCollapsedSelection = useCallback(
    (
      target: {
        affinity?: WriterSelection["affinity"];
        position: {
          blockId: string;
          offset: number;
        };
      },
      options: { flush?: boolean } = {},
    ) => {
      onChangeRangeSelection(null);
      onChangeSelection(
        {
          affinity: target.affinity,
          blockId: target.position.blockId,
          offset: target.position.offset,
        },
        options,
      );
    },
    [onChangeRangeSelection, onChangeSelection],
  );

  const commitDocumentMutation = useCallback(
    (
      result: { document: WriterDocument; selection: WriterSelection },
      options: { flush?: boolean } = {},
    ) => {
      onChangeRangeSelection(null);
      onChangeDocument(result.document, result.selection, options);
    },
    [onChangeDocument, onChangeRangeSelection],
  );

  const handleSurfaceSelection = useCallback(
    (event: WriterSurfaceSelectionEvent) => {
      const hasRange = event.anchorOffset !== event.focusOffset;
      const nextRangeSelection = hasRange
        ? {
            anchor: {
              blockId: event.blockId,
              offset: event.anchorOffset,
            },
            focus: {
              blockId: event.blockId,
              offset: event.focusOffset,
            },
          }
        : null;

      if (
        !areWriterRangeSelectionsEqual(
          rangeSelectionRef.current,
          nextRangeSelection,
        )
      ) {
        onChangeRangeSelection(nextRangeSelection);
      }

      onChangeSelection({
        affinity: event.affinity,
        blockId: event.blockId,
        offset: event.focusOffset,
      });
    },
    [onChangeRangeSelection, onChangeSelection],
  );

  const handleSurfaceEdit = useCallback(
    (event: WriterSurfaceEditEvent) => {
      const nextRangeSelection =
        event.anchorOffset === event.focusOffset
          ? null
          : {
              anchor: {
                blockId: event.blockId,
                offset: event.anchorOffset,
              },
              focus: {
                blockId: event.blockId,
                offset: event.focusOffset,
              },
            };

      if (
        !areWriterRangeSelectionsEqual(
          rangeSelectionRef.current,
          nextRangeSelection,
        )
      ) {
        onChangeRangeSelection(nextRangeSelection);
      }

      onChangeDocument(
        updateWriterBlockContent(
          writerDocumentRef.current,
          event.blockId,
          event.content,
        ),
        {
          affinity: event.affinity,
          blockId: event.blockId,
          offset: event.focusOffset,
        },
      );
    },
    [onChangeDocument, onChangeRangeSelection],
  );

  useEffect(() => {
    const handleMouseMove = (event: MouseEvent) => {
      const dragSelection = dragSelectionRef.current;
      const rootElement = rootRef.current;

      if (!dragSelection || !rootElement) {
        return;
      }

      if ((event.buttons & 1) === 0) {
        dragSelectionRef.current = null;
        return;
      }

      const nextTarget = resolveWriterSelectionTargetFromPoint(
        rootElement,
        paginatedDocumentRef.current,
        event.clientX,
        event.clientY,
      );

      if (!nextTarget) {
        return;
      }

      dragSelection.lastTarget = nextTarget;
      const nextRangeSelection = areWriterPositionsEqual(
        dragSelection.anchorPosition,
        nextTarget.position,
      )
        ? null
        : {
            anchor: dragSelection.anchorPosition,
            focus: nextTarget.position,
          };

      if (
        !areWriterRangeSelectionsEqual(
          rangeSelectionRef.current,
          nextRangeSelection,
        )
      ) {
        onChangeRangeSelection(nextRangeSelection);
      }
    };

    const handleMouseUp = () => {
      const dragSelection = dragSelectionRef.current;

      if (!dragSelection) {
        return;
      }

      dragSelectionRef.current = null;

      if (
        areWriterPositionsEqual(
          dragSelection.anchorPosition,
          dragSelection.lastTarget.position,
        )
      ) {
        onChangeRangeSelection(null);
        commitCollapsedSelection(dragSelection.lastTarget, { flush: true });
        return;
      }

      onChangeRangeSelection({
        anchor: dragSelection.anchorPosition,
        focus: dragSelection.lastTarget.position,
      });
      onChangeSelection(
        {
          affinity: dragSelection.lastTarget.affinity,
          blockId: dragSelection.lastTarget.position.blockId,
          offset: dragSelection.lastTarget.position.offset,
        },
        { flush: true },
      );
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [commitCollapsedSelection, onChangeRangeSelection, onChangeSelection]);

  const handleMouseDownCapture = useCallback(
    (event: ReactMouseEvent<HTMLDivElement>) => {
      if (event.button !== 0) {
        return;
      }

      const rootElement = rootRef.current;
      const editable = findClosestWriterEditable(event.target);

      if (!rootElement || !editable || !rootElement.contains(editable)) {
        return;
      }

      const target = resolveWriterSelectionTargetFromPoint(
        rootElement,
        paginatedDocumentRef.current,
        event.clientX,
        event.clientY,
      );

      if (!target) {
        return;
      }

      event.preventDefault();

      const currentSelection = selectionRef.current;

      if (event.shiftKey && currentSelection) {
        const anchorPosition = {
          blockId: currentSelection.blockId,
          offset: currentSelection.offset,
        };

        onChangeRangeSelection({
          anchor: anchorPosition,
          focus: target.position,
        });
        onChangeSelection(
          {
            affinity: target.affinity,
            blockId: target.position.blockId,
            offset: target.position.offset,
          },
          { flush: true },
        );
        dragSelectionRef.current = {
          anchorPosition,
          lastTarget: target,
        };
        return;
      }

      commitCollapsedSelection(target, { flush: true });
      dragSelectionRef.current = {
        anchorPosition: target.position,
        lastTarget: target,
      };
    },
    [commitCollapsedSelection, onChangeRangeSelection, onChangeSelection],
  );

  const handleFocusCapture = useCallback(
    (event: ReactFocusEvent<HTMLDivElement>) => {
      const rootElement = rootRef.current;
      const editable = findClosestWriterEditable(event.target);

      if (!rootElement || !editable || !rootElement.contains(editable)) {
        return;
      }

      onEditableFocusChange?.(true);
    },
    [onEditableFocusChange],
  );

  const handleBlurCapture = useCallback(
    (event: ReactFocusEvent<HTMLDivElement>) => {
      const rootElement = rootRef.current;

      if (!rootElement) {
        return;
      }

      const nextEditable = findClosestWriterEditable(event.relatedTarget);

      if (nextEditable && rootElement.contains(nextEditable)) {
        return;
      }

      onEditableFocusChange?.(false);
    },
    [onEditableFocusChange],
  );

  const handleKeyDownCapture = useCallback(
    (event: ReactKeyboardEvent<HTMLDivElement>) => {
      const isSelectAllShortcut =
        (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "a";
      const activeRangeSelection = rangeSelectionRef.current;

      if (isSelectAllShortcut) {
        const nextRangeSelection = selectAllWriterDocument(
          writerDocumentRef.current,
        );

        if (!nextRangeSelection) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        onChangeRangeSelection(nextRangeSelection);
        onChangeSelection(
          {
            affinity: "end",
            blockId: nextRangeSelection.focus.blockId,
            offset: nextRangeSelection.focus.offset,
          },
          { flush: true },
        );
        return;
      }

      if (
        !activeRangeSelection ||
        isWriterRangeSelectionCollapsed(activeRangeSelection)
      ) {
        return;
      }

      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onChangeRangeSelection(null);
        onChangeSelection(
          {
            blockId: activeRangeSelection.focus.blockId,
            offset: activeRangeSelection.focus.offset,
          },
          { flush: true },
        );
        return;
      }

      if (event.key === "Backspace" || event.key === "Delete") {
        event.preventDefault();
        event.stopPropagation();
        commitDocumentMutation(
          deleteWriterRange(writerDocumentRef.current, activeRangeSelection),
          { flush: true },
        );
        return;
      }

      if (event.key === "Enter" && !event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();
        const deletedRange = deleteWriterRange(
          writerDocumentRef.current,
          activeRangeSelection,
        );
        const result = applyEnter(
          deletedRange.document,
          deletedRange.selection,
        );

        onChangeRangeSelection(null);
        onChangeDocument(result.document, result.selection, { flush: true });
        return;
      }

      if (
        !event.altKey &&
        !event.ctrlKey &&
        !event.metaKey &&
        event.key.length === 1 &&
        !event.nativeEvent.isComposing
      ) {
        event.preventDefault();
        event.stopPropagation();
        commitDocumentMutation(
          replaceWriterRangeWithText(
            writerDocumentRef.current,
            activeRangeSelection,
            event.key,
          ),
          { flush: true },
        );
      }
    },
    [
      commitDocumentMutation,
      onChangeDocument,
      onChangeRangeSelection,
      onChangeSelection,
    ],
  );

  const handleCopyCapture = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const activeRangeSelection = rangeSelectionRef.current;

      if (
        !activeRangeSelection ||
        isWriterRangeSelectionCollapsed(activeRangeSelection) ||
        !event.clipboardData
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.clipboardData.setData(
        "text/plain",
        getPlainTextFromWriterRange(
          writerDocumentRef.current,
          activeRangeSelection,
        ),
      );
    },
    [],
  );

  const handleCutCapture = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const activeRangeSelection = rangeSelectionRef.current;

      if (
        !activeRangeSelection ||
        isWriterRangeSelectionCollapsed(activeRangeSelection) ||
        !event.clipboardData
      ) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      event.clipboardData.setData(
        "text/plain",
        getPlainTextFromWriterRange(
          writerDocumentRef.current,
          activeRangeSelection,
        ),
      );
      commitDocumentMutation(
        deleteWriterRange(writerDocumentRef.current, activeRangeSelection),
        { flush: true },
      );
    },
    [commitDocumentMutation],
  );

  const handlePasteCapture = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const pastedText = event.clipboardData.getData("text/plain");
      const activeRangeSelection = rangeSelectionRef.current;
      const currentSelection = selectionRef.current;

      if (!pastedText || (!activeRangeSelection && !currentSelection)) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (
        activeRangeSelection &&
        !isWriterRangeSelectionCollapsed(activeRangeSelection)
      ) {
        commitDocumentMutation(
          replaceWriterRangeWithText(
            writerDocumentRef.current,
            activeRangeSelection,
            pastedText,
          ),
          { flush: true },
        );
        return;
      }

      commitDocumentMutation(
        insertPlainTextAtSelection(
          writerDocumentRef.current,
          currentSelection,
          pastedText,
        ),
        { flush: true },
      );
    },
    [commitDocumentMutation],
  );

  return (
    <WriterInteractionContext.Provider
      value={{
        onSurfaceEdit: handleSurfaceEdit,
        onSurfaceSelection: handleSurfaceSelection,
        rangeSelection,
        selection,
        writerDocument,
      }}
    >
      <div
        ref={rootRef}
        onCopyCapture={handleCopyCapture}
        onCutCapture={handleCutCapture}
        onFocusCapture={handleFocusCapture}
        onBlurCapture={handleBlurCapture}
        onKeyDownCapture={handleKeyDownCapture}
        onMouseDownCapture={handleMouseDownCapture}
        onPasteCapture={handlePasteCapture}
      >
        {children}
      </div>
    </WriterInteractionContext.Provider>
  );
}

export function useWriterInteraction() {
  const context = useContext(WriterInteractionContext);

  if (!context) {
    throw new Error(
      "useWriterInteraction must be used within WriterInteractionLayer.",
    );
  }

  return context;
}
