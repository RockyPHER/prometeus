"use client";

import type {
  CompositionEvent,
  CSSProperties,
  FormEvent,
  KeyboardEvent,
} from "react";
import { useCallback, useLayoutEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import {
  getPlainText,
  getTextLength,
  itemContainsOffset,
  normalizeOffset,
  replaceRichTextRange,
  sliceRichTextContent,
  type CodeBlock,
  type HeadingBlock,
  type ListBlock,
  type PageItem,
  type ParagraphBlock,
  type QuoteBlock,
  type WriterRangeSelection,
  type WriterSelection,
} from "@/features/write/document/writerDocument";
import {
  getDomOffsetFromLogicalOffset,
  getLogicalRangeLength,
  getLogicalTextLength,
  readEditableText,
  toEditableDomText,
  writeEditableText,
} from "@/features/write/editor/writerEditableDom";
import type {
  WriterSurfaceEditEvent,
  WriterSurfaceEventCause,
  WriterSurfaceSelectionEvent,
} from "@/features/write/editor/writerSurfaceEvents";

type RichTextWriterBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock;

type TextSurfaceTag = "blockquote" | "div" | "h1" | "h2" | "pre";

type PendingLocalSelection = {
  affinity: WriterSelection["affinity"];
  anchorOffset: number;
  baseVersion: number;
  focusOffset: number;
};

type TextBlockSurfaceProps = {
  block: RichTextWriterBlock;
  className: string;
  item: PageItem;
  localSelectionSlice: {
    from: number;
    to: number;
    includesEmptyBlock?: boolean;
  } | null;
  onApplyBackspace: () => boolean;
  onApplyDelete: () => boolean;
  onApplyEnter: () => void;
  onMoveSelectionToNextBlock: (blockId: string) => boolean;
  onMoveSelectionToPreviousBlock: (blockId: string) => boolean;
  onSurfaceEdit: (event: WriterSurfaceEditEvent) => void;
  onSurfaceSelection: (event: WriterSurfaceSelectionEvent) => void;
  rangeSelection: WriterRangeSelection | null;
  selection: WriterSelection | null;
  style?: CSSProperties;
  tagName: TextSurfaceTag;
};

export function TextBlockSurface({
  block,
  className,
  item,
  localSelectionSlice,
  onApplyBackspace,
  onApplyDelete,
  onApplyEnter,
  onMoveSelectionToNextBlock,
  onMoveSelectionToPreviousBlock,
  onSurfaceEdit,
  onSurfaceSelection,
  rangeSelection,
  selection,
  style,
  tagName,
}: TextBlockSurfaceProps) {
  const editableRef = useRef<HTMLElement | null>(null);
  const isComposingRef = useRef(false);
  const pendingLocalSelectionRef = useRef<PendingLocalSelection | null>(null);
  const skipNextKeyUpRef = useRef<string | null>(null);
  const displayedContent =
    item.type === "fragment"
      ? sliceRichTextContent(block.content, item.from, item.to)
      : block.content;
  const displayedText = getPlainText(displayedContent);
  const blockLength = getTextLength(block.content);
  const documentRange =
    item.type === "fragment"
      ? { from: item.from, to: item.to }
      : { from: 0, to: blockLength };
  const localTextLength = displayedText.length;
  const Tag = tagName;
  const isEmptyRangeSelected =
    localTextLength === 0 && Boolean(localSelectionSlice?.includesEmptyBlock);

  useLayoutEffect(() => {
    if (!editableRef.current || isComposingRef.current) {
      return;
    }

    if (
      (editableRef.current.textContent ?? "") ===
      toEditableDomText(displayedText)
    ) {
      return;
    }

    writeEditableText(editableRef.current, displayedText);
  }, [displayedText]);

  useLayoutEffect(() => {
    if (
      !editableRef.current ||
      isComposingRef.current ||
      rangeSelection ||
      !selection ||
      selection.blockId !== block.id
    ) {
      return;
    }

    if (
      !itemContainsOffset(
        item,
        selection.offset,
        blockLength,
        selection.affinity,
      )
    ) {
      return;
    }

    const pendingLocalSelection = pendingLocalSelectionRef.current;

    if (pendingLocalSelection) {
      const acknowledgesPendingSelection =
        selection.offset === pendingLocalSelection.focusOffset &&
        (selection.affinity ?? "offset") === pendingLocalSelection.affinity;

      if (acknowledgesPendingSelection) {
        pendingLocalSelectionRef.current = null;
      } else if (
        (selection.version ?? 0) <= pendingLocalSelection.baseVersion
      ) {
        return;
      } else {
        pendingLocalSelectionRef.current = null;
      }
    }

    const localOffset = normalizeOffset(
      selection.offset - documentRange.from,
      localTextLength,
    );
    const currentSelection = getCurrentSelectionState(editableRef.current);

    if (
      document.activeElement === editableRef.current &&
      currentSelection?.collapsed &&
      currentSelection.focus === localOffset
    ) {
      return;
    }

    editableRef.current.focus();
    setCaretOffset(editableRef.current, localOffset);
  }, [
    block.id,
    blockLength,
    documentRange.from,
    item,
    localTextLength,
    rangeSelection,
    selection,
  ]);

  const recordPendingLocalSelection = useCallback(
    (
      anchorOffset: number,
      focusOffset: number,
      affinity: WriterSelection["affinity"] = "offset",
    ) => {
      pendingLocalSelectionRef.current = {
        affinity,
        anchorOffset,
        baseVersion: selection?.version ?? 0,
        focusOffset,
      };
    },
    [selection],
  );

  const emitCollapsedSurfaceSelection = useCallback(
    (
      absoluteOffset: number,
      affinity: WriterSelection["affinity"],
      cause: WriterSurfaceEventCause,
    ) => {
      recordPendingLocalSelection(absoluteOffset, absoluteOffset, affinity);
      onSurfaceSelection({
        anchorOffset: absoluteOffset,
        affinity,
        blockId: block.id,
        cause,
        focusOffset: absoluteOffset,
      });
    },
    [block.id, onSurfaceSelection, recordPendingLocalSelection],
  );

  const emitSurfaceSelectionFromState = useCallback(
    (
      currentSelection: ReturnType<typeof getCurrentSelectionState>,
      cause: WriterSurfaceEventCause,
      textLength: number,
    ) => {
      if (!currentSelection) {
        return;
      }

      const currentBlockLength = Math.max(
        blockLength,
        documentRange.from + textLength,
      );
      const localAnchorOffset = normalizeOffset(
        currentSelection.anchor,
        textLength,
      );
      const localFocusOffset = normalizeOffset(
        currentSelection.focus,
        textLength,
      );
      const absoluteAnchorOffset = normalizeOffset(
        documentRange.from + localAnchorOffset,
        currentBlockLength,
      );
      const absoluteFocusOffset = normalizeOffset(
        documentRange.from + localFocusOffset,
        currentBlockLength,
      );
      const affinity = getSelectionAffinity(
        item,
        localFocusOffset,
        textLength,
        currentBlockLength,
      );

      recordPendingLocalSelection(
        absoluteAnchorOffset,
        absoluteFocusOffset,
        affinity,
      );
      onSurfaceSelection({
        anchorOffset: absoluteAnchorOffset,
        affinity,
        blockId: block.id,
        cause,
        focusOffset: absoluteFocusOffset,
      });
    },
    [
      block.id,
      blockLength,
      documentRange.from,
      item,
      onSurfaceSelection,
      recordPendingLocalSelection,
    ],
  );

  const reportSelectionFromDom = useCallback(
    (element: HTMLElement, cause: WriterSurfaceEventCause) => {
      emitSurfaceSelectionFromState(
        getCurrentSelectionState(element),
        cause,
        readEditableText(element).length,
      );
    },
    [emitSurfaceSelectionFromState],
  );

  const syncInput = useCallback(
    (element: HTMLElement, cause: WriterSurfaceEventCause) => {
      const nextText = readEditableText(element);
      const currentSelection = getCurrentSelectionState(element);

      if (nextText === displayedText) {
        emitSurfaceSelectionFromState(currentSelection, cause, nextText.length);
        return;
      }

      const currentBlockLength = Math.max(
        blockLength,
        documentRange.from + nextText.length,
      );
      const localAnchorOffset = normalizeOffset(
        currentSelection?.anchor ?? nextText.length,
        nextText.length,
      );
      const localFocusOffset = normalizeOffset(
        currentSelection?.focus ?? nextText.length,
        nextText.length,
      );
      const absoluteAnchorOffset = normalizeOffset(
        documentRange.from + localAnchorOffset,
        currentBlockLength,
      );
      const absoluteFocusOffset = normalizeOffset(
        documentRange.from + localFocusOffset,
        currentBlockLength,
      );
      const affinity = getSelectionAffinity(
        item,
        localFocusOffset,
        nextText.length,
        currentBlockLength,
      );

      recordPendingLocalSelection(
        absoluteAnchorOffset,
        absoluteFocusOffset,
        affinity,
      );
      onSurfaceEdit({
        anchorOffset: absoluteAnchorOffset,
        affinity,
        blockId: block.id,
        cause,
        content: replaceRichTextRange(
          block.content,
          documentRange.from,
          documentRange.to,
          nextText,
        ),
        focusOffset: absoluteFocusOffset,
      });
    },
    [
      block.content,
      block.id,
      blockLength,
      displayedText,
      documentRange.from,
      documentRange.to,
      emitSurfaceSelectionFromState,
      item,
      onSurfaceEdit,
      recordPendingLocalSelection,
    ],
  );

  const handleInput = useCallback(
    (event: FormEvent<HTMLElement>) => {
      if (isComposingRef.current) {
        reportSelectionFromDom(event.currentTarget, "input");
        return;
      }

      syncInput(event.currentTarget, "input");
    },
    [reportSelectionFromDom, syncInput],
  );

  const handleCompositionStart = useCallback(() => {
    isComposingRef.current = true;
  }, []);

  const handleCompositionEnd = useCallback(
    (event: CompositionEvent<HTMLElement>) => {
      isComposingRef.current = false;
      syncInput(event.currentTarget, "input");
    },
    [syncInput],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (isComposingRef.current) {
        return;
      }

      const currentSelection = getCurrentSelectionState(event.currentTarget);
      const localEnd = normalizeOffset(
        currentSelection?.end ?? localTextLength,
        localTextLength,
      );
      const localOffset = normalizeOffset(
        currentSelection?.focus ?? localEnd,
        localTextLength,
      );
      const isCollapsed = currentSelection?.collapsed ?? true;

      if (event.key === "Enter" && !event.shiftKey && block.type !== "code") {
        event.preventDefault();
        skipNextKeyUpRef.current = event.key;
        onApplyEnter();
        return;
      }

      if (event.key === "ArrowLeft" && isCollapsed && localOffset === 0) {
        event.preventDefault();
        skipNextKeyUpRef.current = event.key;

        if (item.type === "fragment" && item.from > 0) {
          emitCollapsedSurfaceSelection(item.from, "end", "keyboard");
          return;
        }

        onMoveSelectionToPreviousBlock(block.id);
        return;
      }

      if (
        event.key === "ArrowRight" &&
        isCollapsed &&
        localOffset === localTextLength
      ) {
        event.preventDefault();
        skipNextKeyUpRef.current = event.key;

        if (item.type === "fragment" && item.to < blockLength) {
          emitCollapsedSurfaceSelection(item.to, "start", "keyboard");
          return;
        }

        onMoveSelectionToNextBlock(block.id);
        return;
      }

      if (event.key === "ArrowUp" && isCollapsed && localOffset === 0) {
        event.preventDefault();
        skipNextKeyUpRef.current = event.key;

        if (item.type === "fragment" && item.from > 0) {
          emitCollapsedSurfaceSelection(item.from, "end", "keyboard");
          return;
        }

        onMoveSelectionToPreviousBlock(block.id);
        return;
      }

      if (
        event.key === "ArrowDown" &&
        isCollapsed &&
        localOffset === localTextLength
      ) {
        event.preventDefault();
        skipNextKeyUpRef.current = event.key;

        if (item.type === "fragment" && item.to < blockLength) {
          emitCollapsedSurfaceSelection(item.to, "start", "keyboard");
          return;
        }

        onMoveSelectionToNextBlock(block.id);
        return;
      }

      if (event.key === "Delete") {
        if (!isCollapsed) {
          return;
        }

        event.preventDefault();
        skipNextKeyUpRef.current = event.key;
        onApplyDelete();
        return;
      }

      if (event.key !== "Backspace") {
        return;
      }

      if (!isCollapsed) {
        return;
      }

      event.preventDefault();
      skipNextKeyUpRef.current = event.key;
      onApplyBackspace();
    },
    [
      block.id,
      block.type,
      blockLength,
      emitCollapsedSurfaceSelection,
      item,
      localTextLength,
      onApplyBackspace,
      onApplyDelete,
      onApplyEnter,
      onMoveSelectionToNextBlock,
      onMoveSelectionToPreviousBlock,
    ],
  );

  const handleKeyUp = useCallback(
    (event: KeyboardEvent<HTMLElement>) => {
      if (isComposingRef.current) {
        return;
      }

      if (skipNextKeyUpRef.current === event.key) {
        skipNextKeyUpRef.current = null;
        return;
      }

      reportSelectionFromDom(event.currentTarget, "keyboard");
    },
    [reportSelectionFromDom],
  );

  const handleFocus = useCallback(() => {
    if (!editableRef.current) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (editableRef.current) {
        reportSelectionFromDom(editableRef.current, "focus");
      }
    });
  }, [reportSelectionFromDom]);

  return (
    <Tag
      ref={(element: HTMLElement | null) => {
        editableRef.current = element;
      }}
      contentEditable
      suppressContentEditableWarning
      spellCheck
      data-writer-editable="true"
      data-block-id={block.id}
      data-block-type={block.type}
      data-item-type={item.type}
      data-fragment-from={documentRange.from}
      data-fragment-to={documentRange.to}
      data-range-selected={localSelectionSlice ? "true" : undefined}
      data-selection-from={localSelectionSlice?.from}
      data-selection-to={localSelectionSlice?.to}
      onCompositionEnd={handleCompositionEnd}
      onCompositionStart={handleCompositionStart}
      onFocus={handleFocus}
      onInput={handleInput}
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
      className={cn(
        className,
        isEmptyRangeSelected
          ? "before:bg-sky-200/80 before:pointer-events-none before:inline-block before:h-[1.05em] before:w-[0.55ch] before:rounded-[2px] before:align-middle before:content-['']"
          : "",
      )}
      style={style}
    />
  );
}

function getSelectionAffinity(
  item: PageItem,
  localOffset: number,
  localTextLength: number,
  blockLength: number,
): WriterSelection["affinity"] {
  if (item.type === "fragment") {
    if (localOffset === 0 && item.from > 0) {
      return "start";
    }

    if (localOffset === localTextLength && item.to < blockLength) {
      return "end";
    }
  }

  if (localOffset === 0) {
    return "start";
  }

  if (localOffset === localTextLength) {
    return "end";
  }

  return "offset";
}

function getCurrentSelectionState(root: HTMLElement) {
  const selection = window.getSelection();

  if (
    !selection ||
    selection.rangeCount === 0 ||
    !selection.anchorNode ||
    !selection.focusNode ||
    !root.contains(selection.anchorNode) ||
    !root.contains(selection.focusNode)
  ) {
    return null;
  }

  const range = selection.getRangeAt(0);

  return {
    anchor: getLogicalOffsetWithinRoot(
      root,
      selection.anchorNode,
      selection.anchorOffset,
    ),
    collapsed: selection.isCollapsed,
    end: getLogicalOffsetWithinRoot(root, range.endContainer, range.endOffset),
    focus: getLogicalOffsetWithinRoot(
      root,
      selection.focusNode,
      selection.focusOffset,
    ),
    start: getLogicalOffsetWithinRoot(
      root,
      range.startContainer,
      range.startOffset,
    ),
  };
}

function getLogicalOffsetWithinRoot(
  root: HTMLElement,
  boundaryNode: Node,
  boundaryOffset: number,
) {
  const range = document.createRange();

  range.selectNodeContents(root);
  range.setEnd(boundaryNode, boundaryOffset);

  return getLogicalRangeLength(range);
}

function setCaretOffset(root: HTMLElement, offset: number) {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  const targetOffset = Math.max(0, offset);
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  let currentOffset = targetOffset;

  while (currentNode) {
    const text = currentNode.textContent ?? "";
    const textLength = getLogicalTextLength(text);

    if (currentOffset <= textLength) {
      const range = document.createRange();
      range.setStart(
        currentNode,
        getDomOffsetFromLogicalOffset(text, currentOffset),
      );
      range.collapse(true);
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }

    currentOffset -= textLength;
    currentNode = walker.nextNode();
  }

  if (!root.firstChild) {
    const placeholderNode = document.createTextNode(toEditableDomText(""));
    root.appendChild(placeholderNode);

    const range = document.createRange();
    range.setStart(
      placeholderNode,
      getDomOffsetFromLogicalOffset(
        placeholderNode.textContent ?? "",
        targetOffset,
      ),
    );
    range.collapse(true);
    selection.removeAllRanges();
    selection.addRange(range);
    return;
  }

  const range = document.createRange();
  range.selectNodeContents(root);
  range.collapse(false);
  selection.removeAllRanges();
  selection.addRange(range);
}
