import {
  getBlockTextLength,
  isRichTextBlock,
  normalizeOffset,
  type PaginatedDocument,
  type WriterDocument,
  type WriterPosition,
  type WriterRangeSelection,
  type WriterSelection,
} from "@/features/write/document/writerDocument";
import {
  isWriterRangeSelectionCollapsed,
  normalizeWriterRangeSelection,
  orderWriterPositions,
} from "@/features/write/document/writerSelection";
import {
  getDomOffsetFromLogicalOffset,
  getLogicalRangeLength,
  getLogicalTextLength,
  readEditableText,
} from "@/features/write/editor/writerEditableDom";

type SelectionBoundary = {
  node: Node;
  offset: number;
};

export type WriterSelectionTarget = {
  affinity: WriterSelection["affinity"];
  position: WriterPosition;
};

export function findClosestWriterEditable(target: EventTarget | null) {
  if (!(target instanceof Node)) {
    return null;
  }

  const container =
    target.nodeType === Node.ELEMENT_NODE
      ? (target as Element)
      : target.parentElement;

  return container?.closest(
    "[data-writer-editable='true']",
  ) as HTMLElement | null;
}

export function resolveWriterSelectionTargetFromPoint(
  rootElement: HTMLElement,
  document: PaginatedDocument,
  x: number,
  y: number,
): WriterSelectionTarget | null {
  const directBoundary = resolveBoundaryFromCaretPoint(rootElement, x, y);

  if (directBoundary) {
    return resolveWriterSelectionTargetFromBoundary(
      rootElement,
      directBoundary.node,
      directBoundary.offset,
      document,
    );
  }

  const editables = getWriterEditableElements(rootElement);

  if (editables.length === 0) {
    return null;
  }

  for (const editable of editables) {
    const rect = editable.getBoundingClientRect();

    if (y < rect.top) {
      return resolveWriterSelectionTargetFromEditableEdge(
        editable,
        document,
        "start",
      );
    }

    if (y <= rect.bottom) {
      return resolveWriterSelectionTargetFromEditableEdge(
        editable,
        document,
        x > rect.left + rect.width / 2 ? "end" : "start",
      );
    }
  }

  return resolveWriterSelectionTargetFromEditableEdge(
    editables[editables.length - 1],
    document,
    "end",
  );
}

export function syncNativeSelectionForWriterRange(
  rootElement: HTMLElement,
  paginatedDocument: PaginatedDocument,
  sourceDocument: WriterDocument,
  rangeSelection: WriterRangeSelection | null,
) {
  const normalizedRangeSelection = normalizeWriterRangeSelection(
    sourceDocument,
    rangeSelection,
  );

  if (
    !normalizedRangeSelection ||
    isWriterRangeSelectionCollapsed(normalizedRangeSelection)
  ) {
    return;
  }

  const [orderedStart, orderedEnd] = orderWriterPositions(
    sourceDocument,
    normalizedRangeSelection.anchor,
    normalizedRangeSelection.focus,
  );
  const startBoundary = resolveBoundaryForWriterPosition(
    rootElement,
    paginatedDocument,
    orderedStart,
    "start",
  );
  const endBoundary = resolveBoundaryForWriterPosition(
    rootElement,
    paginatedDocument,
    orderedEnd,
    "end",
  );

  if (!startBoundary || !endBoundary) {
    return;
  }

  applyNativeSelection(startBoundary, endBoundary);
}

function resolveWriterSelectionTargetFromBoundary(
  rootElement: HTMLElement,
  boundaryNode: Node,
  boundaryOffset: number,
  document: PaginatedDocument,
): WriterSelectionTarget | null {
  const container =
    boundaryNode.nodeType === Node.ELEMENT_NODE
      ? (boundaryNode as Element)
      : boundaryNode.parentElement;
  const editable = container?.closest(
    "[data-writer-editable='true']",
  ) as HTMLElement | null;

  if (!editable || !rootElement.contains(editable)) {
    return null;
  }

  return resolveWriterSelectionTargetFromEditableBoundary(
    editable,
    document,
    getOffsetWithinElement(editable, boundaryNode, boundaryOffset),
  );
}

function resolveWriterSelectionTargetFromEditableEdge(
  editable: HTMLElement,
  document: PaginatedDocument,
  edge: "start" | "end",
): WriterSelectionTarget | null {
  const localTextLength = readEditableText(editable).length;

  return resolveWriterSelectionTargetFromEditableBoundary(
    editable,
    document,
    edge === "start" ? 0 : localTextLength,
  );
}

function resolveWriterSelectionTargetFromEditableBoundary(
  editable: HTMLElement,
  document: PaginatedDocument,
  localOffsetValue: number,
): WriterSelectionTarget | null {
  const blockId = editable.dataset.blockId;

  if (!blockId) {
    return null;
  }

  const block = document.blocksById[blockId];

  if (!block || !isRichTextBlock(block)) {
    return null;
  }

  const fragmentFrom = Number(editable.dataset.fragmentFrom ?? "0");
  const fragmentTo = Number(
    editable.dataset.fragmentTo ?? String(getBlockTextLength(block)),
  );
  const blockLength = getBlockTextLength(block);
  const localTextLength = readEditableText(editable).length;
  const localOffset = normalizeOffset(localOffsetValue, localTextLength);
  const absoluteOffset = normalizeOffset(
    fragmentFrom + localOffset,
    blockLength,
  );

  return {
    position: {
      blockId,
      offset: absoluteOffset,
    },
    affinity: getSelectionAffinity(
      fragmentFrom,
      fragmentTo,
      localOffset,
      localTextLength,
      blockLength,
    ),
  };
}

function resolveBoundaryForWriterPosition(
  rootElement: HTMLElement,
  document: PaginatedDocument,
  position: WriterPosition,
  edge: "start" | "end",
): SelectionBoundary | null {
  const editables = getWriterEditableElements(rootElement).filter(
    (editable) => {
      if (editable.dataset.blockId !== position.blockId) {
        return false;
      }

      const from = Number(editable.dataset.fragmentFrom ?? "0");
      const to = Number(
        editable.dataset.fragmentTo ??
          String(from + readEditableText(editable).length),
      );

      return position.offset >= from && position.offset <= to;
    },
  );

  if (editables.length === 0) {
    return null;
  }

  const editable =
    edge === "start" ? editables[0] : editables[editables.length - 1];
  const block = document.blocksById[position.blockId];

  if (!block || !isRichTextBlock(block)) {
    return null;
  }

  const fragmentFrom = Number(editable.dataset.fragmentFrom ?? "0");
  const localTextLength = readEditableText(editable).length;
  const localOffset = normalizeOffset(
    position.offset - fragmentFrom,
    localTextLength,
  );

  return resolveTextBoundaryAtOffset(editable, localOffset);
}

function resolveTextBoundaryAtOffset(
  rootElement: HTMLElement,
  targetOffset: number,
): SelectionBoundary {
  const walker = document.createTreeWalker(rootElement, NodeFilter.SHOW_TEXT);
  let currentNode = walker.nextNode();
  let currentOffset = Math.max(0, targetOffset);

  while (currentNode) {
    const text = currentNode.textContent ?? "";
    const textLength = getLogicalTextLength(text);

    if (currentOffset <= textLength) {
      return {
        node: currentNode,
        offset: getDomOffsetFromLogicalOffset(text, currentOffset),
      };
    }

    currentOffset -= textLength;
    currentNode = walker.nextNode();
  }

  return {
    node: rootElement,
    offset: rootElement.childNodes.length,
  };
}

function getWriterEditableElements(rootElement: HTMLElement) {
  return [
    ...rootElement.querySelectorAll<HTMLElement>(
      "[data-writer-editable='true']",
    ),
  ];
}

function getOffsetWithinElement(
  element: HTMLElement,
  boundaryNode: Node,
  boundaryOffset: number,
) {
  const range = document.createRange();

  range.selectNodeContents(element);
  range.setEnd(boundaryNode, boundaryOffset);

  return getLogicalRangeLength(range);
}

function applyNativeSelection(
  anchorBoundary: SelectionBoundary,
  focusBoundary: SelectionBoundary,
) {
  const selection = window.getSelection();

  if (!selection) {
    return;
  }

  if (typeof selection.setBaseAndExtent === "function") {
    selection.setBaseAndExtent(
      anchorBoundary.node,
      anchorBoundary.offset,
      focusBoundary.node,
      focusBoundary.offset,
    );
    return;
  }

  const range = document.createRange();
  const [startBoundary, endBoundary] = isBoundaryBefore(
    anchorBoundary,
    focusBoundary,
  )
    ? [anchorBoundary, focusBoundary]
    : [focusBoundary, anchorBoundary];

  range.setStart(startBoundary.node, startBoundary.offset);
  range.setEnd(endBoundary.node, endBoundary.offset);
  selection.removeAllRanges();
  selection.addRange(range);
}

function isBoundaryBefore(left: SelectionBoundary, right: SelectionBoundary) {
  if (left.node === right.node) {
    return left.offset <= right.offset;
  }

  return Boolean(
    left.node.compareDocumentPosition(right.node) &
    Node.DOCUMENT_POSITION_FOLLOWING,
  );
}

function resolveBoundaryFromCaretPoint(
  rootElement: HTMLElement,
  x: number,
  y: number,
) {
  const caret = getCaretPointFromViewport(x, y);

  if (!caret) {
    return null;
  }

  const container =
    caret.node.nodeType === Node.ELEMENT_NODE
      ? (caret.node as Element)
      : caret.node.parentElement;
  const editable = container?.closest(
    "[data-writer-editable='true']",
  ) as HTMLElement | null;

  if (!editable || !rootElement.contains(editable)) {
    return null;
  }

  return {
    node: caret.node,
    offset: caret.offset,
  } satisfies SelectionBoundary;
}

function getCaretPointFromViewport(x: number, y: number) {
  if (typeof document.caretPositionFromPoint === "function") {
    const position = document.caretPositionFromPoint(x, y);

    if (position?.offsetNode) {
      return {
        node: position.offsetNode,
        offset: position.offset,
      };
    }
  }

  const legacyDocument = document as Document & {
    caretRangeFromPoint?: (x: number, y: number) => Range | null;
  };
  const range = legacyDocument.caretRangeFromPoint?.(x, y) ?? null;

  if (!range) {
    return null;
  }

  return {
    node: range.startContainer,
    offset: range.startOffset,
  };
}

function getSelectionAffinity(
  fragmentFrom: number,
  fragmentTo: number,
  localOffset: number,
  localTextLength: number,
  blockLength: number,
): WriterSelection["affinity"] {
  if (localOffset === 0 && fragmentFrom > 0) {
    return "start";
  }

  if (localOffset === localTextLength && fragmentTo < blockLength) {
    return "end";
  }

  if (localOffset === 0) {
    return "start";
  }

  if (localOffset === localTextLength) {
    return "end";
  }

  return "offset";
}
