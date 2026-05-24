"use client";

import type { CSSProperties } from "react";
import { useCallback, useMemo } from "react";
import { cn } from "@/lib/cn";
import {
  isRichTextBlock,
  type BibliographyBlock,
  type ChartBlock,
  type CodeBlock,
  type FormulaBlock,
  type HeadingBlock,
  type ImageBlock,
  type ListBlock,
  type PageItem,
  type ParagraphBlock,
  type QuoteBlock,
  type WriterBlock,
} from "@/features/write/document/writerDocument";
import {
  getSelectionSliceForBlock,
  getSelectionSliceForPageItem,
  isBlockFullySelectedByRange,
} from "@/features/write/document/writerSelection";
import { TextBlockSurface } from "@/features/write/editor/TextBlockSurface";
import { useWriterInteraction } from "@/features/write/editor/WriterInteractionLayer";
import {
  getTextBlockMetrics,
  WRITER_PARAGRAPH_MARK_GAP,
  WRITER_PARAGRAPH_MARK_WIDTH,
} from "@/features/write/writeMetrics";

type RichTextWriterBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock;

type NonTextWriterBlock =
  | FormulaBlock
  | ImageBlock
  | ChartBlock
  | BibliographyBlock;

type BlockEditorProps = {
  block: WriterBlock;
  item: PageItem;
  onAddParagraphAfter: (blockId: string) => void;
  onApplyBackspace: () => boolean;
  onApplyDelete: () => boolean;
  onApplyEnter: () => void;
  onMoveSelectionToNextBlock: (blockId: string) => boolean;
  onMoveSelectionToPreviousBlock: (blockId: string) => boolean;
  onReferenceClick: (bibliographyId: string) => void;
  onReferenceHover: (payload: {
    bibliographyId: string;
    citation: string;
    noteId: string;
    sourceId?: string;
    x: number;
    y: number;
  }) => void;
  onReferenceLeave: () => void;
  showParagraphMarks: boolean;
};

export function BlockEditor({
  block,
  item,
  onAddParagraphAfter,
  onApplyBackspace,
  onApplyDelete,
  onApplyEnter,
  onMoveSelectionToNextBlock,
  onMoveSelectionToPreviousBlock,
  onReferenceClick,
  onReferenceHover,
  onReferenceLeave,
  showParagraphMarks,
}: BlockEditorProps) {
  const {
    onSurfaceEdit,
    onSurfaceSelection,
    rangeSelection,
    selection,
    writerDocument,
  } = useWriterInteraction();
  const absoluteSelectionSlice = useMemo(
    () =>
      isRichTextBlock(block)
        ? getSelectionSliceForBlock({
            document: writerDocument,
            blockId: block.id,
            rangeSelection,
          })
        : null,
    [block, rangeSelection, writerDocument],
  );
  const localSelectionSlice = useMemo(
    () => getSelectionSliceForPageItem(item, absoluteSelectionSlice),
    [absoluteSelectionSlice, item],
  );
  const isNonTextRangeSelected = useMemo(
    () =>
      !isRichTextBlock(block) &&
      isBlockFullySelectedByRange(writerDocument, block.id, rangeSelection),
    [block, rangeSelection, writerDocument],
  );
  const isSelectionInBlock = !rangeSelection && selection?.blockId === block.id;

  const handleDoubleClick = useCallback(() => {
    if (!isRichTextBlock(block)) {
      onAddParagraphAfter(block.id);
    }
  }, [block, onAddParagraphAfter]);

  if (!isRichTextBlock(block)) {
    const nonTextBlock = block as NonTextWriterBlock;

    return (
      <div
        className={cn(
          "group rounded-[0.9rem] border border-transparent transition",
          isNonTextRangeSelected
            ? "bg-sky-50/80 ring-sky-200/80 ring-2 ring-offset-2"
            : "",
          nonTextBlock.layout.oversized ? "ring-amber-200/80 ring-2" : "",
        )}
        onDoubleClick={handleDoubleClick}
      >
        {renderNonTextBlock(
          nonTextBlock,
          onReferenceClick,
          onReferenceHover,
          onReferenceLeave,
        )}
      </div>
    );
  }

  const metrics = getTextBlockMetrics(block);

  if (block.type === "paragraph") {
    return (
      <div
        className={cn(
          "relative rounded-[0.8rem] transition",
          showParagraphMarks && isSelectionInBlock
            ? "ring-2 ring-workspace-write-100/90 ring-offset-2"
            : "ring-1 ring-transparent",
          block.layout.oversized
            ? "ring-amber-200/80 ring-2 ring-offset-2"
            : "",
        )}
        style={{
          marginBottom: metrics.marginBottom,
          minHeight:
            metrics.paddingTop +
            metrics.minContentHeight +
            metrics.paddingBottom,
        }}
      >
        {showParagraphMarks ? (
          <span
            aria-hidden="true"
            className="pointer-events-none absolute select-none text-sm font-medium text-slate-300"
            style={{
              left: metrics.paddingLeft,
              top: metrics.paddingTop,
              transform: `translateX(calc(-100% - ${WRITER_PARAGRAPH_MARK_GAP}px))`,
              width: WRITER_PARAGRAPH_MARK_WIDTH,
              lineHeight: `${metrics.lineHeight}px`,
            }}
          >
            ¶
          </span>
        ) : null}

        <TextBlockSurface
          block={block}
          className="selection:bg-sky-200/80 block w-full min-w-0 whitespace-pre-wrap rounded-[0.8rem] text-slate-700 outline-none"
          item={item}
          localSelectionSlice={localSelectionSlice}
          onApplyBackspace={onApplyBackspace}
          onApplyDelete={onApplyDelete}
          onApplyEnter={onApplyEnter}
          onMoveSelectionToNextBlock={onMoveSelectionToNextBlock}
          onMoveSelectionToPreviousBlock={onMoveSelectionToPreviousBlock}
          onSurfaceEdit={onSurfaceEdit}
          onSurfaceSelection={onSurfaceSelection}
          rangeSelection={rangeSelection}
          selection={selection}
          style={{
            fontSize: metrics.fontSize,
            lineHeight: `${metrics.lineHeight}px`,
            paddingTop: metrics.paddingTop,
            paddingRight: metrics.paddingRight,
            paddingBottom: metrics.paddingBottom,
            paddingLeft: metrics.paddingLeft,
            minHeight:
              metrics.paddingTop +
              metrics.minContentHeight +
              metrics.paddingBottom,
          }}
          tagName="div"
        />
      </div>
    );
  }

  return (
    <TextBlockSurface
      block={block}
      className={cn(
        "group outline-none transition",
        getBlockClassName(block, showParagraphMarks && isSelectionInBlock),
        localSelectionSlice ? "selection:bg-sky-200/80" : "",
        block.layout.oversized ? "ring-amber-200/80 ring-2 ring-offset-2" : "",
      )}
      item={item}
      localSelectionSlice={localSelectionSlice}
      onApplyBackspace={onApplyBackspace}
      onApplyDelete={onApplyDelete}
      onApplyEnter={onApplyEnter}
      onMoveSelectionToNextBlock={onMoveSelectionToNextBlock}
      onMoveSelectionToPreviousBlock={onMoveSelectionToPreviousBlock}
      onSurfaceEdit={onSurfaceEdit}
      onSurfaceSelection={onSurfaceSelection}
      rangeSelection={rangeSelection}
      selection={selection}
      style={getBlockStyle(block)}
      tagName={getTextTag(block)}
    />
  );
}

function renderNonTextBlock(
  block: NonTextWriterBlock,
  onReferenceClick: (bibliographyId: string) => void,
  onReferenceHover: (payload: {
    bibliographyId: string;
    citation: string;
    noteId: string;
    sourceId?: string;
    x: number;
    y: number;
  }) => void,
  onReferenceLeave: () => void,
) {
  switch (block.type) {
    case "formula":
      return (
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-5 py-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-400">
            Formula
          </p>
          <pre className="mt-3 overflow-x-auto whitespace-pre-wrap font-mono text-sm text-slate-700">
            {block.content.latex || "\\text{Formula vazia}"}
          </pre>
        </div>
      );
    case "image":
      return (
        <figure className="overflow-hidden rounded-[1rem] border border-slate-200 bg-slate-50">
          <div
            className="flex items-center justify-center bg-slate-100 text-sm text-slate-400"
            style={{ height: Math.max(180, block.content.height ?? 220) }}
          >
            {block.content.src ? "Imagem" : "Imagem sem origem"}
          </div>
          {block.content.caption ? (
            <figcaption className="border-t border-slate-200 px-4 py-3 text-sm text-slate-500">
              {block.content.caption}
            </figcaption>
          ) : null}
        </figure>
      );
    case "chart":
      return (
        <div className="rounded-[1rem] border border-slate-200 bg-slate-50 px-5 py-5">
          <div
            className="flex items-center justify-center rounded-[0.9rem] border border-dashed border-slate-200 bg-white text-sm text-slate-400"
            style={{ height: Math.max(220, block.content.height ?? 240) }}
          >
            Grafico
          </div>
          {block.content.title ? (
            <p className="mt-3 text-sm font-medium text-slate-700">
              {block.content.title}
            </p>
          ) : null}
          {block.content.description ? (
            <p className="mt-1 text-sm text-slate-500">
              {block.content.description}
            </p>
          ) : null}
        </div>
      );
    case "bibliography":
      return (
        <section
          className="rounded-[1rem] border border-slate-200 bg-slate-50/70 px-5 py-5"
          onMouseLeave={onReferenceLeave}
        >
          <h3 className="text-lg font-semibold text-slate-900">Bibliografia</h3>
          <div className="mt-4 space-y-3">
            {block.content.entries.map((entry, index) => (
              <article
                key={entry.bibliographyId}
                className="cursor-pointer text-sm leading-6 text-slate-600"
                onClick={() => onReferenceClick(entry.bibliographyId)}
                onMouseEnter={(event) => {
                  onReferenceHover({
                    bibliographyId: entry.bibliographyId,
                    citation: entry.citation,
                    noteId: entry.noteId,
                    sourceId: entry.sourceId,
                    x: event.clientX,
                    y: event.clientY,
                  });
                }}
              >
                <span className="font-medium text-slate-900">
                  {index + 1}.{" "}
                </span>
                <span className="font-medium text-workspace-write-700">
                  {entry.citation}
                </span>{" "}
                {entry.bibliographyEntry}
              </article>
            ))}
          </div>
        </section>
      );
    default:
      return null;
  }
}

function getTextTag(block: RichTextWriterBlock) {
  switch (block.type) {
    case "heading":
      return block.level === 1 ? "h1" : "h2";
    case "quote":
      return "blockquote";
    case "code":
      return "pre";
    default:
      return "div";
  }
}

function getBlockClassName(
  block: RichTextWriterBlock,
  isSelectionInBlock: boolean,
) {
  const activeRing = isSelectionInBlock
    ? "ring-2 ring-workspace-write-100/90 ring-offset-2"
    : "ring-1 ring-transparent";

  switch (block.type) {
    case "heading":
      return cn(
        "whitespace-pre-wrap rounded-[0.8rem] font-semibold text-slate-950",
        activeRing,
      );
    case "quote":
      return cn(
        "whitespace-pre-wrap rounded-[0.9rem] border-l-4 border-workspace-write-200 bg-slate-50 italic text-slate-700",
        activeRing,
      );
    case "list":
      return cn(
        "whitespace-pre-wrap rounded-[0.8rem] text-slate-700",
        activeRing,
      );
    case "code":
      return cn(
        "overflow-x-auto whitespace-pre-wrap rounded-[1rem] bg-slate-950 font-mono text-slate-100",
        activeRing,
      );
    case "paragraph":
    default:
      return cn(
        "whitespace-pre-wrap rounded-[0.8rem] text-slate-700",
        activeRing,
      );
  }
}

function getBlockStyle(block: RichTextWriterBlock): CSSProperties {
  const metrics = getTextBlockMetrics(block);

  return {
    fontSize: metrics.fontSize,
    lineHeight: `${metrics.lineHeight}px`,
    paddingTop: metrics.paddingTop,
    paddingRight: metrics.paddingRight,
    paddingBottom: metrics.paddingBottom,
    paddingLeft: metrics.paddingLeft,
    marginTop: metrics.marginTop,
    marginBottom: metrics.marginBottom,
    minHeight:
      metrics.paddingTop + metrics.minContentHeight + metrics.paddingBottom,
  };
}
