"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import {
  ReferenceTooltip,
  type HoveredReference,
} from "@/features/write/components/ReferenceTooltip";
import { ReferencesPanel } from "@/features/write/components/ReferencesPanel";
import { WriteStatusBar } from "@/features/write/components/WriteStatusBar";
import {
  SaveState,
  WriteToolbar,
} from "@/features/write/components/WriteToolbar";
import {
  addParagraphAfter,
  applyBackspace,
  applyDelete,
  applyEnter,
  createEmptyWriterDocument,
  ensureWriterDocument,
  getBlockTextLength,
  getNextWriterSelectionVersion,
  getNextEditableBlock,
  getPlainText,
  getPreviousEditableBlock,
  isRichTextContentEmpty,
  isRichTextBlock,
  normalizeWriterSelection,
  setWriterBlockType,
  type WriterBlock,
  type WriterDocument,
  type WriterEditResult,
  type WriterRangeSelection,
  type WriterSelection,
} from "@/features/write/document/writerDocument";
import {
  areWriterRangeSelectionsEqual,
  isWriterRangeSelectionCollapsed,
  normalizeWriterRangeSelection,
} from "@/features/write/document/writerSelection";
import {
  getOrderedReferences,
  getReferenceByBibliographyId,
  syncWriterReferences,
} from "@/features/write/document/writeReferences";
import {
  hydrateWriterDocument,
  loadWriterDocument,
  saveWriterDocument,
} from "@/features/write/document/writeStorage";
import { PageRenderer } from "@/features/write/editor/PageRenderer";
import { WriterInteractionLayer } from "@/features/write/editor/WriterInteractionLayer";
import { paginateDocument } from "@/features/write/pagination/paginationEngine";

type WritePageProps = {
  isDrawerOpen?: boolean;
};

const MIN_ZOOM = 70;
const MAX_ZOOM = 140;
const ZOOM_STEP = 10;
const SAVE_DEBOUNCE_MS = 140;

export function WritePage({ isDrawerOpen = true }: WritePageProps) {
  const [writerDocument, setWriterDocument] = useState<WriterDocument>(() =>
    createEmptyWriterDocument(),
  );
  const [rangeSelection, setRangeSelection] =
    useState<WriterRangeSelection | null>(null);
  const [selection, setSelection] = useState<WriterSelection | null>(null);
  const [focusedReferenceId, setFocusedReferenceId] = useState<string | null>(
    null,
  );
  const [hoveredReference, setHoveredReference] =
    useState<HoveredReference | null>(null);
  const [isReferencesOpen, setIsReferencesOpen] = useState(false);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [showParagraphMarks, setShowParagraphMarks] = useState(true);
  const [zoom, setZoom] = useState(100);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [isWriterEditableFocused, setIsWriterEditableFocused] = useState(false);
  const referenceElementsRef = useRef<Record<string, HTMLElement | null>>({});
  const rangeSelectionRef = useRef<WriterRangeSelection | null>(rangeSelection);
  const writerDocumentRef = useRef(writerDocument);
  const selectionRef = useRef<WriterSelection | null>(selection);

  useEffect(() => {
    setWriterDocument(loadWriterDocument());
    setHasLoaded(true);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    setSaveState("saving");
    saveWriterDocument(writerDocument);
    const timeout = window.setTimeout(
      () => setSaveState("saved"),
      SAVE_DEBOUNCE_MS,
    );

    return () => window.clearTimeout(timeout);
  }, [hasLoaded, writerDocument]);

  useEffect(() => {
    writerDocumentRef.current = writerDocument;
  }, [writerDocument]);

  useEffect(() => {
    rangeSelectionRef.current = rangeSelection;
  }, [rangeSelection]);

  useEffect(() => {
    selectionRef.current = selection;
  }, [selection]);

  useEffect(() => {
    if (!selection) {
      return;
    }

    const normalizedSelection = normalizeWriterSelection(
      writerDocument,
      selection,
    );

    if (!areSelectionsEqual(selection, normalizedSelection)) {
      selectionRef.current = normalizedSelection;
      setSelection(normalizedSelection);
    }
  }, [selection, writerDocument.blocks]);

  useEffect(() => {
    if (!rangeSelection) {
      return;
    }

    const normalizedRangeSelection = normalizeWriterRangeSelection(
      writerDocument,
      rangeSelection,
    );

    if (
      !areWriterRangeSelectionsEqual(rangeSelection, normalizedRangeSelection)
    ) {
      rangeSelectionRef.current = normalizedRangeSelection;
      setRangeSelection(normalizedRangeSelection);
    }
  }, [rangeSelection, writerDocument.blocks]);

  useEffect(() => {
    if (!focusedReferenceId) {
      return;
    }

    referenceElementsRef.current[focusedReferenceId]?.scrollIntoView({
      behavior: "smooth",
      block: "nearest",
    });
  }, [focusedReferenceId]);

  const paginatedDocument = useMemo(
    () => paginateDocument(writerDocument),
    [writerDocument],
  );
  const orderedReferences = useMemo(
    () => getOrderedReferences(paginatedDocument.references),
    [paginatedDocument.references],
  );
  const wordCount = useMemo(
    () => countWords(writerDocument.blocks),
    [writerDocument.blocks],
  );
  const activeBlock = useMemo(
    () =>
      selection
        ? (writerDocument.blocks.find(
            (block) => block.id === selection.blockId,
          ) ?? null)
        : null,
    [selection, writerDocument.blocks],
  );
  const activeBlockType =
    activeBlock?.type === "paragraph" ||
    activeBlock?.type === "heading" ||
    activeBlock?.type === "list" ||
    activeBlock?.type === "quote" ||
    activeBlock?.type === "code"
      ? activeBlock.type
      : null;
  const activeHeadingLevel =
    activeBlock?.type === "heading" ? activeBlock.level : null;
  const canFormat =
    isWriterEditableFocused &&
    Boolean(activeBlock && isRichTextBlock(activeBlock)) &&
    isWriterRangeSelectionCollapsed(rangeSelection);

  const commitDocument = useCallback((nextDocument: WriterDocument) => {
    const ensuredDocument = ensureWriterDocument(nextDocument);

    return {
      ...ensuredDocument,
      metadata: {
        ...ensuredDocument.metadata,
        updatedAt: new Date().toISOString(),
      },
      references: syncWriterReferences(
        ensuredDocument.blocks,
        ensuredDocument.references,
      ),
    };
  }, []);

  const hydrateDocument = useCallback((nextDocument: WriterDocument) => {
    return hydrateWriterDocument(nextDocument);
  }, []);

  useEffect(() => {
    if (!hasLoaded) {
      return;
    }

    setWriterDocument((currentDocument) => hydrateDocument(currentDocument));
  }, [hasLoaded, hydrateDocument]);

  const commitSelection = useCallback(
    (
      nextSelection: WriterSelection | null,
      options: { flush?: boolean } = {},
    ) => {
      const normalizedSelection = nextSelection
        ? normalizeWriterSelection(writerDocumentRef.current, nextSelection)
        : null;
      const apply = () => {
        selectionRef.current = normalizedSelection;
        setSelection((currentSelection) =>
          areSelectionsEqual(currentSelection, normalizedSelection)
            ? currentSelection
            : normalizedSelection,
        );
      };

      if (options.flush) {
        flushSync(apply);
        return;
      }

      apply();
    },
    [],
  );

  const commitRangeSelection = useCallback(
    (nextRangeSelection: WriterRangeSelection | null) => {
      const normalizedRangeSelection = normalizeWriterRangeSelection(
        writerDocumentRef.current,
        nextRangeSelection,
      );

      rangeSelectionRef.current = normalizedRangeSelection;
      setRangeSelection((currentRangeSelection) =>
        areWriterRangeSelectionsEqual(
          currentRangeSelection,
          normalizedRangeSelection,
        )
          ? currentRangeSelection
          : normalizedRangeSelection,
      );
    },
    [],
  );

  const commitDocumentAndSelection = useCallback(
    (
      nextDocument: WriterDocument,
      nextSelection: WriterSelection | null,
      options: { flush?: boolean } = {},
    ) => {
      const committedDocument = commitDocument(nextDocument);
      const normalizedSelection = nextSelection
        ? {
            ...normalizeWriterSelection(committedDocument, nextSelection),
            version:
              nextSelection.version ??
              getNextWriterSelectionVersion(selectionRef.current),
          }
        : null;
      const apply = () => {
        writerDocumentRef.current = committedDocument;
        selectionRef.current = normalizedSelection;
        setWriterDocument(committedDocument);
        setSelection((currentSelection) =>
          areSelectionsEqual(currentSelection, normalizedSelection)
            ? currentSelection
            : normalizedSelection,
        );
      };

      if (options.flush) {
        flushSync(apply);
        return;
      }

      apply();
    },
    [commitDocument],
  );

  const commitWriterEditResult = useCallback(
    (result: WriterEditResult, options: { flush?: boolean } = {}) => {
      commitDocumentAndSelection(result.document, result.selection, options);
    },
    [commitDocumentAndSelection],
  );

  const createVersionedSelection = useCallback(
    (
      blockId: string,
      offset: number,
      affinity: WriterSelection["affinity"] = "offset",
    ): WriterSelection => ({
      blockId,
      offset,
      affinity,
      version: getNextWriterSelectionVersion(selectionRef.current),
    }),
    [],
  );

  const handleSelectionChange = useCallback(
    (
      nextSelection: WriterSelection | null,
      options: { flush?: boolean } = {},
    ) => {
      if (!nextSelection) {
        return;
      }

      const currentSelection = selectionRef.current;
      const currentVersion = selectionRef.current?.version ?? 0;
      const isSelectionPointUnchanged = areSelectionsEqualIgnoringVersion(
        currentSelection,
        nextSelection,
      );

      if (nextSelection.version == null) {
        if (isSelectionPointUnchanged) {
          return;
        }

        commitSelection(
          {
            ...nextSelection,
            version: getNextWriterSelectionVersion(selectionRef.current),
          },
          options,
        );
        return;
      }

      if (nextSelection.version < currentVersion) {
        return;
      }

      if (
        nextSelection.version === currentVersion &&
        isSelectionPointUnchanged
      ) {
        return;
      }

      commitSelection(nextSelection, options);
    },
    [commitSelection],
  );

  const handleApplyEnter = useCallback(() => {
    commitWriterEditResult(
      applyEnter(writerDocumentRef.current, selectionRef.current),
      { flush: true },
    );
  }, [commitWriterEditResult]);

  const handleApplyBackspace = useCallback(() => {
    commitWriterEditResult(
      applyBackspace(writerDocumentRef.current, selectionRef.current),
      { flush: true },
    );
    return true;
  }, [commitWriterEditResult]);

  const handleApplyDelete = useCallback(() => {
    commitWriterEditResult(
      applyDelete(writerDocumentRef.current, selectionRef.current),
      { flush: true },
    );
    return true;
  }, [commitWriterEditResult]);

  const handleAddParagraphAfter = useCallback(
    (blockId: string) => {
      const result = addParagraphAfter(writerDocumentRef.current, blockId);

      commitDocumentAndSelection(
        result.document,
        createVersionedSelection(result.newBlockId, 0, "start"),
        { flush: true },
      );
    },
    [commitDocumentAndSelection, createVersionedSelection],
  );

  const updateActiveBlockType = useCallback(
    (
      nextType: "paragraph" | "heading" | "list" | "quote" | "code",
      options?: { level?: 1 | 2 },
    ) => {
      if (!selection?.blockId || !canFormat) {
        return;
      }

      setWriterDocument((currentDocument) => {
        const currentBlock =
          currentDocument.blocks.find(
            (block) => block.id === selection.blockId,
          ) ?? null;
        const shouldToggleBackToParagraph =
          currentBlock &&
          currentBlock.type === nextType &&
          (nextType !== "heading" ||
            ("level" in currentBlock &&
              currentBlock.level === (options?.level ?? 1)));
        const resolvedType = shouldToggleBackToParagraph
          ? "paragraph"
          : nextType;

        return commitDocument(
          setWriterBlockType(
            currentDocument,
            selection.blockId,
            resolvedType,
            options,
          ),
        );
      });
    },
    [canFormat, commitDocument, selection],
  );

  const handleReferenceClick = useCallback((bibliographyId: string) => {
    setFocusedReferenceId(bibliographyId);
    setIsReferencesOpen(true);
  }, []);

  const handleReferenceHover = useCallback(
    (payload: {
      bibliographyId: string;
      citation: string;
      noteId: string;
      sourceId?: string;
      x: number;
      y: number;
    }) => {
      const reference = getReferenceByBibliographyId(
        paginatedDocument.references,
        payload.bibliographyId,
      );

      setHoveredReference({
        bibliographyId: payload.bibliographyId,
        citation: payload.citation,
        sourceLabel: reference?.sourceLabel,
        sourceUrl: reference?.sourceUrl,
        x: payload.x,
        y: payload.y,
      });
    },
    [paginatedDocument.references],
  );

  const handleReferenceLeave = useCallback(() => {
    setHoveredReference(null);
  }, []);

  const registerReference = useCallback(
    (id: string, element: HTMLElement | null) => {
      referenceElementsRef.current[id] = element;
    },
    [],
  );

  const handleMoveSelectionToPreviousBlock = useCallback(
    (blockId: string) => {
      const previousBlock = getPreviousEditableBlock(
        writerDocumentRef.current,
        blockId,
      );

      if (!previousBlock) {
        return false;
      }

      commitSelection(
        createVersionedSelection(
          previousBlock.id,
          getBlockTextLength(previousBlock),
          "end",
        ),
        { flush: true },
      );
      return true;
    },
    [commitSelection, createVersionedSelection],
  );

  const handleMoveSelectionToNextBlock = useCallback(
    (blockId: string) => {
      const nextBlock = getNextEditableBlock(
        writerDocumentRef.current,
        blockId,
      );

      if (!nextBlock) {
        return false;
      }

      commitSelection(createVersionedSelection(nextBlock.id, 0, "start"), {
        flush: true,
      });
      return true;
    },
    [commitSelection, createVersionedSelection],
  );

  const handlePageTrailingClick = useCallback(
    (pageIndex: number) => {
      commitRangeSelection(null);
      const page = paginatedDocument.pages[pageIndex];

      if (!page) {
        return;
      }

      const lastRichTextItem = [...page.items].reverse().find((item) => {
        const block = paginatedDocument.blocksById[item.blockId];
        return block ? isRichTextBlock(block) : false;
      });
      const lastPageIndex = paginatedDocument.pages.length - 1;
      const isFinalPage = pageIndex === lastPageIndex;
      const lastWriterBlock =
        writerDocument.blocks[writerDocument.blocks.length - 1] ?? null;

      if (
        isFinalPage &&
        lastWriterBlock &&
        isRichTextBlock(lastWriterBlock) &&
        lastWriterBlock.type === "paragraph" &&
        isRichTextContentEmpty(lastWriterBlock.content)
      ) {
        commitSelection(
          createVersionedSelection(lastWriterBlock.id, 0, "start"),
          { flush: true },
        );
        return;
      }

      if (isFinalPage && lastWriterBlock) {
        const currentLastBlock =
          writerDocumentRef.current.blocks[
            writerDocumentRef.current.blocks.length - 1
          ] ?? null;

        if (
          currentLastBlock &&
          isRichTextBlock(currentLastBlock) &&
          currentLastBlock.type === "paragraph" &&
          isRichTextContentEmpty(currentLastBlock.content)
        ) {
          commitSelection(
            createVersionedSelection(currentLastBlock.id, 0, "start"),
            { flush: true },
          );
          return;
        }

        if (!currentLastBlock) {
          return;
        }

        const result = addParagraphAfter(
          writerDocumentRef.current,
          currentLastBlock.id,
        );

        commitDocumentAndSelection(
          result.document,
          createVersionedSelection(result.newBlockId, 0, "start"),
          { flush: true },
        );

        return;
      }

      if (!lastRichTextItem) {
        return;
      }

      const block = paginatedDocument.blocksById[lastRichTextItem.blockId];

      if (!block || !isRichTextBlock(block)) {
        return;
      }

      commitSelection(
        createVersionedSelection(
          lastRichTextItem.blockId,
          lastRichTextItem.type === "fragment"
            ? lastRichTextItem.to
            : getBlockTextLength(block),
          "end",
        ),
        { flush: true },
      );
    },
    [
      commitDocumentAndSelection,
      commitRangeSelection,
      commitSelection,
      createVersionedSelection,
      paginatedDocument,
    ],
  );

  return (
    <motion.section
      className="flex w-full flex-1 flex-col bg-surface-stage pt-0"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28 }}
    >
      <div className="mx-auto flex w-full max-w-[72rem] flex-col">
        <div className="relative flex min-h-[calc(100vh-10rem)] flex-col rounded-[1.6rem] border border-slate-200/80 bg-surface-write-shell shadow-panel-wide backdrop-blur-sm">
          <WriteToolbar
            activeBlockType={activeBlockType}
            activeHeadingLevel={activeHeadingLevel}
            canFormat={canFormat}
            isReferencesOpen={isReferencesOpen}
            onToggleParagraphMarks={() =>
              setShowParagraphMarks((current) => !current)
            }
            onResetZoom={() => setZoom(100)}
            onSetCode={() => updateActiveBlockType("code")}
            onSetHeading1={() => updateActiveBlockType("heading", { level: 1 })}
            onSetHeading2={() => updateActiveBlockType("heading", { level: 2 })}
            onSetList={() => updateActiveBlockType("list")}
            onSetQuote={() => updateActiveBlockType("quote")}
            onToggleReferences={() =>
              setIsReferencesOpen((current) => !current)
            }
            onZoomIn={() =>
              setZoom((current) => Math.min(MAX_ZOOM, current + ZOOM_STEP))
            }
            onZoomOut={() =>
              setZoom((current) => Math.max(MIN_ZOOM, current - ZOOM_STEP))
            }
            pageCount={paginatedDocument.pages.length}
            referenceCount={orderedReferences.length}
            saveState={saveState}
            showParagraphMarks={showParagraphMarks}
            zoom={zoom}
            zoomCanDecrease={zoom > MIN_ZOOM}
            zoomCanIncrease={zoom < MAX_ZOOM}
          />

          <div className="relative flex-1 overflow-hidden">
            <WriterInteractionLayer
              writerDocument={writerDocument}
              paginatedDocument={paginatedDocument}
              selection={selection}
              rangeSelection={rangeSelection}
              onChangeDocument={commitDocumentAndSelection}
              onEditableFocusChange={setIsWriterEditableFocused}
              onChangeSelection={handleSelectionChange}
              onChangeRangeSelection={commitRangeSelection}
            >
              <PageRenderer
                document={paginatedDocument}
                onMoveSelectionToNextBlock={handleMoveSelectionToNextBlock}
                onMoveSelectionToPreviousBlock={
                  handleMoveSelectionToPreviousBlock
                }
                onAddParagraphAfter={handleAddParagraphAfter}
                onApplyBackspace={handleApplyBackspace}
                onApplyDelete={handleApplyDelete}
                onApplyEnter={handleApplyEnter}
                onPageTrailingClick={handlePageTrailingClick}
                onReferenceClick={handleReferenceClick}
                onReferenceHover={handleReferenceHover}
                onReferenceLeave={handleReferenceLeave}
                showParagraphMarks={showParagraphMarks}
                zoom={zoom}
              />
            </WriterInteractionLayer>

            <AnimatePresence initial={false}>
              {isReferencesOpen ? (
                <ReferencesPanel
                  focusedReferenceId={focusedReferenceId}
                  onClose={() => setIsReferencesOpen(false)}
                  references={orderedReferences}
                  registerReference={registerReference}
                />
              ) : null}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {hoveredReference ? (
          <ReferenceTooltip reference={hoveredReference} />
        ) : null}
      </AnimatePresence>

      <WriteStatusBar
        isDrawerOpen={isDrawerOpen}
        pageCount={paginatedDocument.pages.length}
        referenceCount={orderedReferences.length}
        wordCount={wordCount}
      />
    </motion.section>
  );
}

function countWords(blocks: WriterBlock[]) {
  return blocks.reduce((total, block) => {
    if (!isRichTextBlock(block)) {
      return total;
    }

    const plainText = getPlainText(block.content).trim();

    if (!plainText) {
      return total;
    }

    return total + plainText.split(/\s+/).length;
  }, 0);
}

function areSelectionsEqual(
  left: WriterSelection | null,
  right: WriterSelection | null,
) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.blockId === right.blockId &&
    left.offset === right.offset &&
    left.version === right.version &&
    left.affinity === right.affinity
  );
}

function areSelectionsEqualIgnoringVersion(
  left: WriterSelection | null,
  right: WriterSelection | null,
) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    left.blockId === right.blockId &&
    left.offset === right.offset &&
    left.affinity === right.affinity
  );
}
