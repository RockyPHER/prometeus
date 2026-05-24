import {
  createParagraphBlock,
  createRichTextContent,
  getBlockTextLength,
  getNextWriterSelectionVersion,
  getPlainText,
  getTextLength,
  isRichTextBlock,
  mergeRichTextContents,
  normalizeWriterSelection,
  replaceRichTextRange,
  sliceRichTextContent,
  updateWriterBlockContent,
  type PageItem,
  type RichTextContent,
  type WriterBlock,
  type WriterDocument,
  type WriterPosition,
  type WriterRangeSelection,
  type WriterSelection,
} from "@/features/write/document/writerDocument";

type WriterSelectionSlice = {
  from: number;
  to: number;
  includesEmptyBlock?: boolean;
};

type WriterDocumentMutationResult = {
  document: WriterDocument;
  selection: WriterSelection;
};

export function createWriterSelectionFromPosition(
  document: WriterDocument,
  position: WriterPosition,
  options: {
    affinity?: WriterSelection["affinity"];
    version?: number;
  } = {},
): WriterSelection {
  const normalizedPosition = normalizeWriterPosition(document, position);

  if (!normalizedPosition) {
    return normalizeWriterSelection(document, {
      blockId: "",
      offset: 0,
      affinity: "start",
      version: options.version ?? 0,
    });
  }

  const block =
    document.blocks.find((item) => item.id === normalizedPosition.blockId) ??
    null;
  const blockLength = block ? getBlockTextLength(block) : 0;

  return normalizeWriterSelection(document, {
    blockId: normalizedPosition.blockId,
    offset: normalizedPosition.offset,
    affinity:
      options.affinity ??
      (normalizedPosition.offset === 0
        ? "start"
        : normalizedPosition.offset === blockLength
          ? "end"
          : "offset"),
    version: options.version ?? 0,
  });
}

export function normalizeWriterPosition(
  document: WriterDocument,
  position: WriterPosition | null,
): WriterPosition | null {
  if (!position) {
    return null;
  }

  const normalizedSelection = normalizeWriterSelection(document, {
    blockId: position.blockId,
    offset: position.offset,
    version: 0,
  });

  return {
    blockId: normalizedSelection.blockId,
    offset: normalizedSelection.offset,
  };
}

export function normalizeWriterRangeSelection(
  document: WriterDocument,
  rangeSelection: WriterRangeSelection | null,
): WriterRangeSelection | null {
  if (!rangeSelection) {
    return null;
  }

  const anchor = normalizeWriterPosition(document, rangeSelection.anchor);
  const focus = normalizeWriterPosition(document, rangeSelection.focus);

  if (!anchor || !focus) {
    return null;
  }

  return {
    anchor,
    focus,
  };
}

export function areWriterPositionsEqual(
  left: WriterPosition | null,
  right: WriterPosition | null,
) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return left.blockId === right.blockId && left.offset === right.offset;
}

export function areWriterRangeSelectionsEqual(
  left: WriterRangeSelection | null,
  right: WriterRangeSelection | null,
) {
  if (!left && !right) {
    return true;
  }

  if (!left || !right) {
    return false;
  }

  return (
    areWriterPositionsEqual(left.anchor, right.anchor) &&
    areWriterPositionsEqual(left.focus, right.focus)
  );
}

export function isWriterRangeSelectionCollapsed(
  rangeSelection: WriterRangeSelection | null,
) {
  return (
    !rangeSelection ||
    areWriterPositionsEqual(rangeSelection.anchor, rangeSelection.focus)
  );
}

export function orderWriterPositions(
  document: WriterDocument,
  left: WriterPosition,
  right: WriterPosition,
): [WriterPosition, WriterPosition] {
  const leftIndex = document.blocks.findIndex(
    (block) => block.id === left.blockId,
  );
  const rightIndex = document.blocks.findIndex(
    (block) => block.id === right.blockId,
  );

  if (leftIndex === -1 || rightIndex === -1) {
    return [left, right];
  }

  if (leftIndex < rightIndex) {
    return [left, right];
  }

  if (leftIndex > rightIndex) {
    return [right, left];
  }

  return left.offset <= right.offset ? [left, right] : [right, left];
}

export function selectAllWriterDocument(
  document: WriterDocument,
): WriterRangeSelection | null {
  const firstEditableBlock = document.blocks.find(isRichTextBlock) ?? null;
  const lastEditableBlock =
    [...document.blocks].reverse().find(isRichTextBlock) ?? null;

  if (!firstEditableBlock || !lastEditableBlock) {
    return null;
  }

  return {
    anchor: {
      blockId: firstEditableBlock.id,
      offset: 0,
    },
    focus: {
      blockId: lastEditableBlock.id,
      offset: getBlockTextLength(lastEditableBlock),
    },
  };
}

export function getSelectionSliceForBlock({
  document,
  blockId,
  rangeSelection,
}: {
  document: WriterDocument;
  blockId: string;
  rangeSelection: WriterRangeSelection | null;
}): WriterSelectionSlice | null {
  const normalizedRangeSelection = normalizeWriterRangeSelection(
    document,
    rangeSelection,
  );

  if (
    !normalizedRangeSelection ||
    isWriterRangeSelectionCollapsed(normalizedRangeSelection)
  ) {
    return null;
  }

  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);
  const block = document.blocks[blockIndex];

  if (blockIndex === -1 || !block || !isRichTextBlock(block)) {
    return null;
  }

  const [orderedStart, orderedEnd] = orderWriterPositions(
    document,
    normalizedRangeSelection.anchor,
    normalizedRangeSelection.focus,
  );
  const startIndex = document.blocks.findIndex(
    (item) => item.id === orderedStart.blockId,
  );
  const endIndex = document.blocks.findIndex(
    (item) => item.id === orderedEnd.blockId,
  );

  if (
    startIndex === -1 ||
    endIndex === -1 ||
    blockIndex < startIndex ||
    blockIndex > endIndex
  ) {
    return null;
  }

  const blockLength = getBlockTextLength(block);

  if (blockLength === 0) {
    return {
      from: 0,
      to: 0,
      includesEmptyBlock: true,
    };
  }

  if (orderedStart.blockId === orderedEnd.blockId) {
    return orderedStart.blockId === blockId &&
      orderedStart.offset !== orderedEnd.offset
      ? {
          from: Math.min(orderedStart.offset, orderedEnd.offset),
          to: Math.max(orderedStart.offset, orderedEnd.offset),
        }
      : null;
  }

  if (blockId === orderedStart.blockId) {
    return orderedStart.offset < blockLength
      ? {
          from: orderedStart.offset,
          to: blockLength,
        }
      : null;
  }

  if (blockId === orderedEnd.blockId) {
    return orderedEnd.offset > 0
      ? {
          from: 0,
          to: orderedEnd.offset,
        }
      : null;
  }

  return blockLength > 0
    ? {
        from: 0,
        to: blockLength,
      }
    : null;
}

export function getSelectionSliceForPageItem(
  item: PageItem,
  selectionSlice: WriterSelectionSlice | null,
): WriterSelectionSlice | null {
  if (!selectionSlice) {
    return null;
  }

  if (item.type === "block") {
    return selectionSlice;
  }

  const from = Math.max(selectionSlice.from, item.from);
  const to = Math.min(selectionSlice.to, item.to);

  if (from >= to) {
    return null;
  }

  return {
    from: from - item.from,
    to: to - item.from,
    includesEmptyBlock: selectionSlice.includesEmptyBlock,
  };
}

export function isBlockFullySelectedByRange(
  document: WriterDocument,
  blockId: string,
  rangeSelection: WriterRangeSelection | null,
) {
  const normalizedRangeSelection = normalizeWriterRangeSelection(
    document,
    rangeSelection,
  );

  if (
    !normalizedRangeSelection ||
    isWriterRangeSelectionCollapsed(normalizedRangeSelection)
  ) {
    return false;
  }

  const [orderedStart, orderedEnd] = orderWriterPositions(
    document,
    normalizedRangeSelection.anchor,
    normalizedRangeSelection.focus,
  );
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);
  const startIndex = document.blocks.findIndex(
    (block) => block.id === orderedStart.blockId,
  );
  const endIndex = document.blocks.findIndex(
    (block) => block.id === orderedEnd.blockId,
  );

  return blockIndex > startIndex && blockIndex < endIndex;
}

export function getPlainTextFromWriterRange(
  document: WriterDocument,
  rangeSelection: WriterRangeSelection | null,
) {
  const normalizedRangeSelection = normalizeWriterRangeSelection(
    document,
    rangeSelection,
  );

  if (!normalizedRangeSelection) {
    return "";
  }

  const [orderedStart, orderedEnd] = orderWriterPositions(
    document,
    normalizedRangeSelection.anchor,
    normalizedRangeSelection.focus,
  );

  if (areWriterPositionsEqual(orderedStart, orderedEnd)) {
    return "";
  }

  const startIndex = document.blocks.findIndex(
    (block) => block.id === orderedStart.blockId,
  );
  const endIndex = document.blocks.findIndex(
    (block) => block.id === orderedEnd.blockId,
  );

  if (startIndex === -1 || endIndex === -1) {
    return "";
  }

  const chunks: string[] = [];

  for (let index = startIndex; index <= endIndex; index += 1) {
    const block = document.blocks[index];

    if (!block || !isRichTextBlock(block)) {
      continue;
    }

    const selectionSlice = getSelectionSliceForBlock({
      document,
      blockId: block.id,
      rangeSelection: normalizedRangeSelection,
    });

    if (!selectionSlice) {
      continue;
    }

    if (selectionSlice.includesEmptyBlock) {
      chunks.push("");
      continue;
    }

    chunks.push(
      getPlainText(
        sliceRichTextContent(
          block.content,
          selectionSlice.from,
          selectionSlice.to,
        ),
      ),
    );
  }

  return chunks.join("\n");
}

export function deleteWriterRange(
  document: WriterDocument,
  rangeSelection: WriterRangeSelection | null,
): WriterDocumentMutationResult {
  const normalizedRangeSelection = normalizeWriterRangeSelection(
    document,
    rangeSelection,
  );

  if (!normalizedRangeSelection) {
    return {
      document,
      selection: normalizeWriterSelection(document, null),
    };
  }

  const [orderedStart, orderedEnd] = orderWriterPositions(
    document,
    normalizedRangeSelection.anchor,
    normalizedRangeSelection.focus,
  );

  if (areWriterPositionsEqual(orderedStart, orderedEnd)) {
    return {
      document,
      selection: createWriterSelectionFromPosition(document, orderedStart),
    };
  }

  const startIndex = document.blocks.findIndex(
    (block) => block.id === orderedStart.blockId,
  );
  const endIndex = document.blocks.findIndex(
    (block) => block.id === orderedEnd.blockId,
  );
  const startBlock = document.blocks[startIndex];
  const endBlock = document.blocks[endIndex];

  if (
    startIndex === -1 ||
    endIndex === -1 ||
    !startBlock ||
    !endBlock ||
    !isRichTextBlock(startBlock) ||
    !isRichTextBlock(endBlock)
  ) {
    return {
      document,
      selection: normalizeWriterSelection(document, null),
    };
  }

  if (startBlock.id === endBlock.id) {
    const nextDocument = updateWriterBlockContent(
      document,
      startBlock.id,
      replaceRichTextRange(
        startBlock.content,
        orderedStart.offset,
        orderedEnd.offset,
        "",
      ),
    );

    return {
      document: nextDocument,
      selection: createWriterSelectionFromPosition(nextDocument, {
        blockId: startBlock.id,
        offset: orderedStart.offset,
      }),
    };
  }

  const prefix = sliceRichTextContent(
    startBlock.content,
    0,
    orderedStart.offset,
  );
  const suffix = sliceRichTextContent(
    endBlock.content,
    orderedEnd.offset,
    getTextLength(endBlock.content),
  );
  const prefixLength = getTextLength(prefix);
  const suffixLength = getTextLength(suffix);
  const blocksBefore = document.blocks.slice(0, startIndex);
  const blocksAfter = document.blocks.slice(endIndex + 1);
  const replacementBlocks: WriterBlock[] = [];
  let selectionPosition: WriterPosition | null = null;

  if (canMergeSelectedBlocks(startBlock, endBlock)) {
    replacementBlocks.push(
      cloneRichTextBlockWithContent(
        startBlock,
        mergeRichTextContents(prefix, suffix),
      ),
    );
    selectionPosition = {
      blockId: startBlock.id,
      offset: prefixLength,
    };
  } else {
    if (prefixLength > 0) {
      replacementBlocks.push(cloneRichTextBlockWithContent(startBlock, prefix));
      selectionPosition = {
        blockId: startBlock.id,
        offset: prefixLength,
      };
    }

    if (suffixLength > 0) {
      replacementBlocks.push(cloneRichTextBlockWithContent(endBlock, suffix));

      if (!selectionPosition) {
        selectionPosition = {
          blockId: endBlock.id,
          offset: 0,
        };
      }
    }
  }

  let nextDocument = {
    ...document,
    blocks: [...blocksBefore, ...replacementBlocks, ...blocksAfter],
  };

  const ensuredEditable = ensureDocumentHasEditableBlock(
    nextDocument,
    blocksBefore.length + replacementBlocks.length,
  );
  nextDocument = ensuredEditable.document;

  if (ensuredEditable.insertedBlock) {
    selectionPosition = {
      blockId: ensuredEditable.insertedBlock.id,
      offset: 0,
    };
  }

  if (!selectionPosition) {
    selectionPosition = findSelectionPositionAfterMutation(
      nextDocument,
      blocksBefore.length,
    );
  }

  return {
    document: nextDocument,
    selection: createWriterSelectionFromPosition(
      nextDocument,
      selectionPosition,
    ),
  };
}

export function replaceWriterRangeWithText(
  document: WriterDocument,
  rangeSelection: WriterRangeSelection | null,
  text: string,
): WriterDocumentMutationResult {
  const deleted = deleteWriterRange(document, rangeSelection);

  return insertPlainTextAtSelection(deleted.document, deleted.selection, text);
}

export function insertPlainTextAtSelection(
  document: WriterDocument,
  selection: WriterSelection | WriterPosition | null,
  text: string,
): WriterDocumentMutationResult {
  const normalizedSelection = normalizeWriterSelection(document, selection);
  const blockIndex = document.blocks.findIndex(
    (block) => block.id === normalizedSelection.blockId,
  );
  const block = document.blocks[blockIndex];
  const normalizedText = normalizeLineBreaks(text);

  if (!block || !isRichTextBlock(block) || normalizedText.length === 0) {
    return {
      document,
      selection: normalizedSelection,
    };
  }

  if (!normalizedText.includes("\n")) {
    const nextDocument = updateWriterBlockContent(
      document,
      block.id,
      replaceRichTextRange(
        block.content,
        normalizedSelection.offset,
        normalizedSelection.offset,
        normalizedText,
      ),
    );

    return {
      document: nextDocument,
      selection: createWriterSelectionFromPosition(nextDocument, {
        blockId: block.id,
        offset: normalizedSelection.offset + normalizedText.length,
      }),
    };
  }

  const lines = normalizedText.split("\n");
  const prefix = sliceRichTextContent(
    block.content,
    0,
    normalizedSelection.offset,
  );
  const suffix = sliceRichTextContent(
    block.content,
    normalizedSelection.offset,
    getTextLength(block.content),
  );
  const firstBlock = cloneRichTextBlockWithContent(
    block,
    mergeRichTextContents(prefix, createRichTextContent(lines[0] ?? "")),
  );
  const middleBlocks = lines
    .slice(1, -1)
    .map((line) => createParagraphBlock(line));
  const lastParagraph = createParagraphBlock();
  const lastBlock = {
    ...lastParagraph,
    content: mergeRichTextContents(
      createRichTextContent(lines[lines.length - 1] ?? ""),
      suffix,
    ),
  };
  const nextBlocks = [
    ...document.blocks.slice(0, blockIndex),
    firstBlock,
    ...middleBlocks,
    lastBlock,
    ...document.blocks.slice(blockIndex + 1),
  ];
  const nextDocument = {
    ...document,
    blocks: nextBlocks,
  };

  return {
    document: nextDocument,
    selection: createWriterSelectionFromPosition(nextDocument, {
      blockId: lastBlock.id,
      offset: (lines[lines.length - 1] ?? "").length,
    }),
  };
}

export function createVersionedWriterSelection(
  document: WriterDocument,
  position: WriterPosition,
  currentSelection: WriterSelection | null,
  affinity?: WriterSelection["affinity"],
) {
  return createWriterSelectionFromPosition(document, position, {
    affinity,
    version: getNextWriterSelectionVersion(currentSelection),
  });
}

function cloneRichTextBlockWithContent(
  block: WriterBlock,
  content: RichTextContent,
): WriterBlock {
  if (!isRichTextBlock(block)) {
    return block;
  }

  if (block.type === "heading") {
    return {
      ...block,
      content,
    };
  }

  if (block.type === "list") {
    return {
      ...block,
      content,
    };
  }

  return {
    ...block,
    content,
  };
}

function canMergeSelectedBlocks(left: WriterBlock, right: WriterBlock) {
  if (!isRichTextBlock(left) || !isRichTextBlock(right)) {
    return false;
  }

  return (
    left.type === right.type ||
    left.type === "paragraph" ||
    right.type === "paragraph"
  );
}

function ensureDocumentHasEditableBlock(
  document: WriterDocument,
  insertIndex: number,
) {
  if (document.blocks.some(isRichTextBlock)) {
    return {
      document,
      insertedBlock: null as WriterBlock | null,
    };
  }

  const paragraph = createParagraphBlock();
  const blocks = [...document.blocks];
  const safeInsertIndex = Math.max(0, Math.min(insertIndex, blocks.length));

  blocks.splice(safeInsertIndex, 0, paragraph);

  return {
    document: {
      ...document,
      blocks,
    },
    insertedBlock: paragraph,
  };
}

function findSelectionPositionAfterMutation(
  document: WriterDocument,
  preferredIndex: number,
): WriterPosition {
  for (let index = preferredIndex; index < document.blocks.length; index += 1) {
    const block = document.blocks[index];

    if (block && isRichTextBlock(block)) {
      return {
        blockId: block.id,
        offset: 0,
      };
    }
  }

  for (
    let index = Math.min(preferredIndex - 1, document.blocks.length - 1);
    index >= 0;
    index -= 1
  ) {
    const block = document.blocks[index];

    if (block && isRichTextBlock(block)) {
      return {
        blockId: block.id,
        offset: getBlockTextLength(block),
      };
    }
  }

  const fallbackParagraph = createParagraphBlock();

  return {
    blockId: fallbackParagraph.id,
    offset: 0,
  };
}

function normalizeLineBreaks(value: string) {
  return value.replace(/\r\n?/g, "\n");
}
