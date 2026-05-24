export const DERIVED_BIBLIOGRAPHY_BLOCK_ID = "write-bibliography";

export type InlineMark =
  | { type: "bold" }
  | { type: "italic" }
  | { type: "code" }
  | { type: "link"; href: string; linkId?: string }
  | {
      type: "reference";
      referenceId: string;
      noteId: string;
      sourceId?: string;
      bibliographyId: string;
      citation: string;
    }
  | { type: "comment"; commentId: string };

export type TextRun = {
  text: string;
  marks?: InlineMark[];
};

export type RichTextContent = {
  runs: TextRun[];
};

export type WriterMetadata = {
  title: string;
  language: string;
  createdAt: string;
  updatedAt: string;
};

export type PageSettings = {
  pageWidth: number;
  pageHeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  contentWidth: number;
  contentHeight: number;
};

export type BlockLayout = {
  measuredHeight?: number;
  canSplit: boolean;
  avoidBreakInside: boolean;
  oversized?: boolean;
};

export type WriterReference = {
  bibliographyId: string;
  referenceId: string;
  noteId: string;
  citation: string;
  bibliographyEntry: string;
  sourceId?: string;
  sourceLabel?: string;
  sourceUrl?: string;
};

export type WriterReferences = {
  order: string[];
  itemsByBibliographyId: Record<string, WriterReference>;
};

type RichTextBlockBase<TType extends string> = {
  id: string;
  type: TType;
  content: RichTextContent;
  layout: BlockLayout;
};

export type ParagraphBlock = RichTextBlockBase<"paragraph">;

export type HeadingBlock = RichTextBlockBase<"heading"> & {
  level: 1 | 2;
};

export type ListBlock = RichTextBlockBase<"list"> & {
  ordered?: boolean;
};

export type QuoteBlock = RichTextBlockBase<"quote">;

export type CodeBlock = RichTextBlockBase<"code">;

export type FormulaBlock = {
  id: string;
  type: "formula";
  content: {
    latex: string;
    height?: number;
  };
  layout: BlockLayout;
};

export type ImageBlock = {
  id: string;
  type: "image";
  content: {
    src: string;
    alt?: string;
    caption?: string;
    width?: number;
    height?: number;
  };
  layout: BlockLayout;
};

export type ChartBlock = {
  id: string;
  type: "chart";
  content: {
    title?: string;
    description?: string;
    height?: number;
  };
  layout: BlockLayout;
};

export type BibliographyBlock = {
  id: string;
  type: "bibliography";
  content: {
    entries: WriterReference[];
  };
  layout: BlockLayout;
};

export type WriterBlock =
  | ParagraphBlock
  | HeadingBlock
  | ListBlock
  | QuoteBlock
  | CodeBlock
  | FormulaBlock
  | ImageBlock
  | ChartBlock
  | BibliographyBlock;

export type WriterDocument = {
  id: string;
  metadata: WriterMetadata;
  settings: PageSettings;
  blocks: WriterBlock[];
  references: WriterReferences;
};

export type WriterPosition = {
  blockId: string;
  offset: number;
};

export type WriterSelection = WriterPosition & {
  version?: number;
  affinity?: "start" | "end" | "offset";
};

export type WriterRangeSelection = {
  anchor: WriterPosition;
  focus: WriterPosition;
};

export type PageItem =
  | {
      type: "block";
      blockId: string;
    }
  | {
      type: "fragment";
      blockId: string;
      from: number;
      to: number;
    };

export type Page = {
  id: string;
  index: number;
  number: number;
  items: PageItem[];
};

export type PaginatedDocument = {
  metadata: WriterMetadata;
  settings: PageSettings;
  pages: Page[];
  blocksById: Record<string, WriterBlock>;
  references: WriterReferences;
};

export type SplitBlockResult = {
  document: WriterDocument;
  nextBlockId: string;
};

export type MergeBlockResult = {
  document: WriterDocument;
  merged: boolean;
  focusBlockId: string | null;
  focusPlacement: "start" | "end";
};

export type DeleteBlockResult = {
  document: WriterDocument;
  deleted: boolean;
  focusBlockId: string | null;
  focusPlacement: "start" | "end";
};

export type AddParagraphResult = {
  document: WriterDocument;
  newBlockId: string;
};

export type WriterEditResult = {
  document: WriterDocument;
  selection: WriterSelection;
};

const DEFAULT_PAGE_WIDTH = 794;
const DEFAULT_PAGE_HEIGHT = 1123;
const DEFAULT_PADDING_TOP = 72;
const DEFAULT_PADDING_RIGHT = 76;
const DEFAULT_PADDING_BOTTOM = 72;
const DEFAULT_PADDING_LEFT = 76;

export function createWriterId(prefix = "write") {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createPageSettings(
  overrides: Partial<Omit<PageSettings, "contentWidth" | "contentHeight">> = {},
): PageSettings {
  const pageWidth = overrides.pageWidth ?? DEFAULT_PAGE_WIDTH;
  const pageHeight = overrides.pageHeight ?? DEFAULT_PAGE_HEIGHT;
  const paddingTop = overrides.paddingTop ?? DEFAULT_PADDING_TOP;
  const paddingRight = overrides.paddingRight ?? DEFAULT_PADDING_RIGHT;
  const paddingBottom = overrides.paddingBottom ?? DEFAULT_PADDING_BOTTOM;
  const paddingLeft = overrides.paddingLeft ?? DEFAULT_PADDING_LEFT;

  return {
    pageWidth,
    pageHeight,
    paddingTop,
    paddingRight,
    paddingBottom,
    paddingLeft,
    contentWidth: Math.max(120, pageWidth - paddingLeft - paddingRight),
    contentHeight: Math.max(120, pageHeight - paddingTop - paddingBottom),
  };
}

export function createBlockLayout(type: WriterBlock["type"]): BlockLayout {
  switch (type) {
    case "paragraph":
      return {
        canSplit: true,
        avoidBreakInside: false,
      };
    case "quote":
    case "heading":
    case "formula":
    case "image":
    case "chart":
    case "bibliography":
    case "list":
    case "code":
      return {
        canSplit: false,
        avoidBreakInside: true,
      };
    default:
      return {
        canSplit: false,
        avoidBreakInside: true,
      };
  }
}

export function createRichTextContent(text = ""): RichTextContent {
  return { runs: [{ text }] };
}

export function createParagraphBlock(
  text = "",
  options: { id?: string } = {},
): ParagraphBlock {
  return {
    id: options.id ?? createWriterId("block"),
    type: "paragraph",
    content: createRichTextContent(text),
    layout: createBlockLayout("paragraph"),
  };
}

export function createEmptyWriterDocument(): WriterDocument {
  const now = new Date().toISOString();

  return {
    id: createWriterId("document"),
    metadata: {
      title: "Documento sem titulo",
      language: "pt-BR",
      createdAt: now,
      updatedAt: now,
    },
    settings: createPageSettings(),
    blocks: [createParagraphBlock()],
    references: {
      order: [],
      itemsByBibliographyId: {},
    },
  };
}

export function ensureWriterDocument(document: WriterDocument): WriterDocument {
  const blocks = document.blocks
    .filter((block) => block.type !== "bibliography")
    .map(cloneWriterBlock);

  return {
    ...document,
    settings: createPageSettings(document.settings),
    blocks: blocks.length > 0 ? blocks : [createParagraphBlock()],
    references: {
      order: [...document.references.order],
      itemsByBibliographyId: { ...document.references.itemsByBibliographyId },
    },
  };
}

export function normalizeWriterDocument(value: unknown): WriterDocument {
  if (!isRecord(value)) {
    return createEmptyWriterDocument();
  }

  if (!Array.isArray(value.blocks)) {
    return createEmptyWriterDocument();
  }

  const fallback = createEmptyWriterDocument();
  const normalizedBlocks = value.blocks
    .map((block) => normalizeWriterBlock(block))
    .filter((block): block is WriterBlock => block !== null)
    .filter((block) => block.type !== "bibliography");

  const metadata = normalizeMetadata(value.metadata, fallback.metadata);
  const settings = normalizePageSettings(value.settings);
  const references = normalizeWriterReferences(value.references);

  return {
    id:
      typeof value.id === "string" && value.id.length > 0
        ? value.id
        : fallback.id,
    metadata,
    settings,
    blocks: normalizedBlocks.length > 0 ? normalizedBlocks : fallback.blocks,
    references,
  };
}

export function isRichTextBlock(
  block: WriterBlock,
): block is ParagraphBlock | HeadingBlock | ListBlock | QuoteBlock | CodeBlock {
  return (
    block.type === "paragraph" ||
    block.type === "heading" ||
    block.type === "list" ||
    block.type === "quote" ||
    block.type === "code"
  );
}

export function getPlainText(content: RichTextContent) {
  return content.runs.map((run) => run.text).join("");
}

export function getTextLength(content: RichTextContent) {
  return getPlainText(content).length;
}

export function isRichTextContentEmpty(content: RichTextContent) {
  return getTextLength(content) === 0;
}

export function normalizeOffset(offset: number, textLength: number) {
  return clamp(offset, 0, textLength);
}

export function getNextWriterSelectionVersion(
  selection: WriterSelection | null,
) {
  return (selection?.version ?? 0) + 1;
}

export function getBlockTextLength(block: WriterBlock) {
  return isRichTextBlock(block) ? getTextLength(block.content) : 0;
}

export function normalizeWriterSelection(
  document: WriterDocument,
  selection: WriterSelection | null,
): WriterSelection {
  const currentVersion = selection?.version ?? 0;
  const selectedBlock = selection?.blockId
    ? (document.blocks.find(
        (
          block,
        ): block is
          | ParagraphBlock
          | HeadingBlock
          | ListBlock
          | QuoteBlock
          | CodeBlock =>
          block.id === selection.blockId && isRichTextBlock(block),
      ) ?? null)
    : null;
  const fallbackBlock =
    selectedBlock ??
    [...document.blocks].reverse().find(isRichTextBlock) ??
    document.blocks.find(isRichTextBlock) ??
    createParagraphBlock();
  const textLength = getBlockTextLength(fallbackBlock);

  return {
    blockId: fallbackBlock.id,
    offset: normalizeOffset(selection?.offset ?? 0, textLength),
    version: currentVersion,
    affinity: selection?.affinity ?? (textLength === 0 ? "start" : "offset"),
  };
}

export function itemContainsOffset(
  item: PageItem,
  offset: number,
  blockLength: number,
  affinity: WriterSelection["affinity"] = "offset",
) {
  if (item.type === "block") {
    return offset >= 0 && offset <= blockLength;
  }

  if (offset < item.from || offset > item.to) {
    return false;
  }

  if (offset === item.from && item.from > 0) {
    return affinity !== "end";
  }

  if (offset === item.to && item.to < blockLength) {
    return affinity === "end";
  }

  return true;
}

export function getPreviousEditableBlock(
  document: WriterDocument,
  blockId: string,
) {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);

  if (blockIndex <= 0) {
    return null;
  }

  for (let index = blockIndex - 1; index >= 0; index -= 1) {
    const block = document.blocks[index];

    if (block && isRichTextBlock(block)) {
      return block;
    }
  }

  return null;
}

export function getNextEditableBlock(
  document: WriterDocument,
  blockId: string,
) {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);

  if (blockIndex === -1) {
    return null;
  }

  for (let index = blockIndex + 1; index < document.blocks.length; index += 1) {
    const block = document.blocks[index];

    if (block && isRichTextBlock(block)) {
      return block;
    }
  }

  return null;
}

export function sliceRichTextContent(
  content: RichTextContent,
  from: number,
  to: number,
): RichTextContent {
  const start = clamp(from, 0, getTextLength(content));
  const end = clamp(to, start, getTextLength(content));
  const runs: TextRun[] = [];
  let cursor = 0;

  for (const run of content.runs) {
    const runStart = cursor;
    const runEnd = cursor + run.text.length;
    cursor = runEnd;

    if (runEnd <= start || runStart >= end) {
      continue;
    }

    const sliceStart = Math.max(0, start - runStart);
    const sliceEnd = Math.min(run.text.length, end - runStart);
    const text = run.text.slice(sliceStart, sliceEnd);

    if (!text) {
      continue;
    }

    runs.push({
      text,
      marks: cloneMarks(run.marks),
    });
  }

  return {
    runs: normalizeRuns(runs),
  };
}

export function replaceRichTextRange(
  content: RichTextContent,
  from: number,
  to: number,
  replacementText: string,
): RichTextContent {
  const start = clamp(from, 0, getTextLength(content));
  const end = clamp(to, start, getTextLength(content));
  const prefix = sliceRichTextContent(content, 0, start).runs;
  const suffix = sliceRichTextContent(
    content,
    end,
    getTextLength(content),
  ).runs;
  const replacementRuns =
    replacementText.length > 0
      ? [
          {
            text: replacementText,
          } satisfies TextRun,
        ]
      : [];

  return {
    runs: normalizeRuns([...prefix, ...replacementRuns, ...suffix]),
  };
}

export function splitRichTextContent(
  content: RichTextContent,
  offset: number,
): [RichTextContent, RichTextContent] {
  const safeOffset = clamp(offset, 0, getTextLength(content));

  return [
    sliceRichTextContent(content, 0, safeOffset),
    sliceRichTextContent(content, safeOffset, getTextLength(content)),
  ];
}

export function mergeRichTextContents(
  left: RichTextContent,
  right: RichTextContent,
): RichTextContent {
  return {
    runs: normalizeRuns([...cloneRuns(left.runs), ...cloneRuns(right.runs)]),
  };
}

export function updateWriterBlockContent(
  document: WriterDocument,
  blockId: string,
  content: RichTextContent,
): WriterDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) =>
      block.id === blockId && isRichTextBlock(block)
        ? {
            ...block,
            content: {
              runs: normalizeRuns(cloneRuns(content.runs)),
            },
          }
        : block,
    ),
  };
}

export function splitWriterBlock(
  document: WriterDocument,
  blockId: string,
  offset: number,
): SplitBlockResult | null {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);
  const block = document.blocks[blockIndex];

  if (blockIndex === -1 || !block || !isRichTextBlock(block)) {
    return null;
  }

  const [currentContent, nextContent] = splitRichTextContent(
    block.content,
    offset,
  );
  const currentBlock = {
    ...block,
    content: currentContent,
  };
  const nextBlock = createSplitSuccessor(block, nextContent);
  const blocks = [...document.blocks];

  blocks.splice(blockIndex, 1, currentBlock, nextBlock);

  return {
    document: {
      ...document,
      blocks,
    },
    nextBlockId: nextBlock.id,
  };
}

export function mergeWriterBlockWithPrevious(
  document: WriterDocument,
  blockId: string,
): MergeBlockResult {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);

  if (blockIndex <= 0) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  const currentBlock = document.blocks[blockIndex];
  const previousBlock = document.blocks[blockIndex - 1];

  if (!currentBlock || !previousBlock) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  if (!canMergeBlocks(previousBlock, currentBlock)) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  if (!isRichTextBlock(previousBlock) || !isRichTextBlock(currentBlock)) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  const mergedBlock = {
    ...previousBlock,
    content: mergeRichTextContents(previousBlock.content, currentBlock.content),
  } satisfies WriterBlock;
  const blocks = [...document.blocks];

  blocks.splice(blockIndex - 1, 2, mergedBlock);

  return {
    document: {
      ...document,
      blocks,
    },
    merged: true,
    focusBlockId: previousBlock.id,
    focusPlacement: "end",
  };
}

export function mergeWriterBlockWithNext(
  document: WriterDocument,
  blockId: string,
): MergeBlockResult {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);

  if (blockIndex === -1 || blockIndex >= document.blocks.length - 1) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  const currentBlock = document.blocks[blockIndex];
  const nextBlock = document.blocks[blockIndex + 1];

  if (!currentBlock || !nextBlock) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  if (!canMergeBlocks(currentBlock, nextBlock)) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  if (!isRichTextBlock(currentBlock) || !isRichTextBlock(nextBlock)) {
    return {
      document,
      merged: false,
      focusBlockId: null,
      focusPlacement: "end",
    };
  }

  const mergedBlock = {
    ...currentBlock,
    content: mergeRichTextContents(currentBlock.content, nextBlock.content),
  } satisfies WriterBlock;
  const blocks = [...document.blocks];

  blocks.splice(blockIndex, 2, mergedBlock);

  return {
    document: {
      ...document,
      blocks,
    },
    merged: true,
    focusBlockId: currentBlock.id,
    focusPlacement: "end",
  };
}

export function addParagraphAfter(
  document: WriterDocument,
  blockId: string,
): AddParagraphResult {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);
  const nextBlock = createParagraphBlock();
  const blocks = [...document.blocks];
  const insertIndex = blockIndex === -1 ? blocks.length : blockIndex + 1;

  blocks.splice(insertIndex, 0, nextBlock);

  return {
    document: {
      ...document,
      blocks,
    },
    newBlockId: nextBlock.id,
  };
}

export function deleteWriterBlock(
  document: WriterDocument,
  blockId: string,
): DeleteBlockResult {
  const blockIndex = document.blocks.findIndex((block) => block.id === blockId);

  if (blockIndex === -1) {
    return {
      document,
      deleted: false,
      focusBlockId: null,
      focusPlacement: "start",
    };
  }

  const remainingBlocks = document.blocks.filter(
    (block) => block.id !== blockId,
  );

  if (remainingBlocks.length === 0) {
    const emptyBlock = createParagraphBlock();

    return {
      document: {
        ...document,
        blocks: [emptyBlock],
      },
      deleted: true,
      focusBlockId: emptyBlock.id,
      focusPlacement: "start",
    };
  }

  const focusBlock =
    remainingBlocks[Math.max(0, blockIndex - 1)] ??
    remainingBlocks[Math.min(blockIndex, remainingBlocks.length - 1)] ??
    null;

  return {
    document: {
      ...document,
      blocks: remainingBlocks,
    },
    deleted: true,
    focusBlockId: focusBlock?.id ?? null,
    focusPlacement: "end",
  };
}

export function applyEnter(
  document: WriterDocument,
  selection: WriterSelection | null,
): WriterEditResult {
  const normalizedSelection = normalizeWriterSelection(document, selection);
  const block = document.blocks.find(
    (
      item,
    ): item is
      | ParagraphBlock
      | HeadingBlock
      | ListBlock
      | QuoteBlock
      | CodeBlock =>
      item.id === normalizedSelection.blockId && isRichTextBlock(item),
  );
  const nextVersion = getNextWriterSelectionVersion(normalizedSelection);

  if (!block) {
    return {
      document,
      selection: {
        ...normalizedSelection,
        version: nextVersion,
      },
    };
  }

  const blockLength = getBlockTextLength(block);

  if (normalizedSelection.offset >= blockLength && block.type === "paragraph") {
    const result = addParagraphAfter(document, block.id);

    return {
      document: result.document,
      selection: normalizeWriterSelection(result.document, {
        blockId: result.newBlockId,
        offset: 0,
        version: nextVersion,
        affinity: "start",
      }),
    };
  }

  const result = splitWriterBlock(
    document,
    block.id,
    normalizedSelection.offset,
  );

  if (!result) {
    return {
      document,
      selection: {
        ...normalizedSelection,
        version: nextVersion,
      },
    };
  }

  return {
    document: result.document,
    selection: normalizeWriterSelection(result.document, {
      blockId: result.nextBlockId,
      offset: 0,
      version: nextVersion,
      affinity: "start",
    }),
  };
}

export function applyBackspace(
  document: WriterDocument,
  selection: WriterSelection | null,
): WriterEditResult {
  const normalizedSelection = normalizeWriterSelection(document, selection);
  const block = document.blocks.find(
    (
      item,
    ): item is
      | ParagraphBlock
      | HeadingBlock
      | ListBlock
      | QuoteBlock
      | CodeBlock =>
      item.id === normalizedSelection.blockId && isRichTextBlock(item),
  );
  const nextVersion = getNextWriterSelectionVersion(normalizedSelection);

  if (!block) {
    return {
      document,
      selection: {
        ...normalizedSelection,
        version: nextVersion,
      },
    };
  }

  if (normalizedSelection.offset > 0) {
    const nextDocument = updateWriterBlockContent(
      document,
      block.id,
      replaceRichTextRange(
        block.content,
        normalizedSelection.offset - 1,
        normalizedSelection.offset,
        "",
      ),
    );

    return {
      document: nextDocument,
      selection: normalizeWriterSelection(nextDocument, {
        blockId: block.id,
        offset: normalizedSelection.offset - 1,
        version: nextVersion,
        affinity: normalizedSelection.offset - 1 === 0 ? "start" : "offset",
      }),
    };
  }

  const previousBlock = getPreviousEditableBlock(document, block.id);

  if (isRichTextContentEmpty(block.content)) {
    if (!previousBlock) {
      return {
        document,
        selection: normalizeWriterSelection(document, {
          blockId: block.id,
          offset: 0,
          version: nextVersion,
          affinity: "start",
        }),
      };
    }

    const previousLength = getBlockTextLength(previousBlock);
    const result = deleteWriterBlock(document, block.id);

    return {
      document: result.document,
      selection: normalizeWriterSelection(result.document, {
        blockId: previousBlock.id,
        offset: previousLength,
        version: nextVersion,
        affinity: "end",
      }),
    };
  }

  if (!previousBlock) {
    return {
      document,
      selection: normalizeWriterSelection(document, {
        blockId: block.id,
        offset: 0,
        version: nextVersion,
        affinity: "start",
      }),
    };
  }

  const previousLength = getBlockTextLength(previousBlock);
  const result = mergeWriterBlockWithPrevious(document, block.id);

  if (!result.merged) {
    return {
      document,
      selection: normalizeWriterSelection(document, {
        blockId: block.id,
        offset: 0,
        version: nextVersion,
        affinity: "start",
      }),
    };
  }

  return {
    document: result.document,
    selection: normalizeWriterSelection(result.document, {
      blockId: previousBlock.id,
      offset: previousLength,
      version: nextVersion,
      affinity: "end",
    }),
  };
}

export function applyDelete(
  document: WriterDocument,
  selection: WriterSelection | null,
): WriterEditResult {
  const normalizedSelection = normalizeWriterSelection(document, selection);
  const block = document.blocks.find(
    (
      item,
    ): item is
      | ParagraphBlock
      | HeadingBlock
      | ListBlock
      | QuoteBlock
      | CodeBlock =>
      item.id === normalizedSelection.blockId && isRichTextBlock(item),
  );
  const nextVersion = getNextWriterSelectionVersion(normalizedSelection);

  if (!block) {
    return {
      document,
      selection: {
        ...normalizedSelection,
        version: nextVersion,
      },
    };
  }

  const blockLength = getBlockTextLength(block);

  if (normalizedSelection.offset < blockLength) {
    const nextDocument = updateWriterBlockContent(
      document,
      block.id,
      replaceRichTextRange(
        block.content,
        normalizedSelection.offset,
        normalizedSelection.offset + 1,
        "",
      ),
    );

    return {
      document: nextDocument,
      selection: normalizeWriterSelection(nextDocument, {
        blockId: block.id,
        offset: normalizedSelection.offset,
        version: nextVersion,
        affinity: normalizedSelection.offset === 0 ? "start" : "offset",
      }),
    };
  }

  const nextBlock = getNextEditableBlock(document, block.id);

  if (isRichTextContentEmpty(block.content)) {
    if (!nextBlock) {
      return {
        document,
        selection: normalizeWriterSelection(document, {
          blockId: block.id,
          offset: 0,
          version: nextVersion,
          affinity: "start",
        }),
      };
    }

    const result = deleteWriterBlock(document, block.id);

    return {
      document: result.document,
      selection: normalizeWriterSelection(result.document, {
        blockId: nextBlock.id,
        offset: 0,
        version: nextVersion,
        affinity: "start",
      }),
    };
  }

  if (!nextBlock) {
    return {
      document,
      selection: normalizeWriterSelection(document, {
        blockId: block.id,
        offset: blockLength,
        version: nextVersion,
        affinity: "end",
      }),
    };
  }

  const result = mergeWriterBlockWithNext(document, block.id);

  if (!result.merged) {
    return {
      document,
      selection: normalizeWriterSelection(document, {
        blockId: block.id,
        offset: blockLength,
        version: nextVersion,
        affinity: "end",
      }),
    };
  }

  return {
    document: result.document,
    selection: normalizeWriterSelection(result.document, {
      blockId: block.id,
      offset: normalizedSelection.offset,
      version: nextVersion,
      affinity: normalizedSelection.offset === 0 ? "start" : "offset",
    }),
  };
}

export function applyDeleteSelectionRange(
  document: WriterDocument,
  startSelection: WriterSelection,
  endSelection: WriterSelection,
): WriterEditResult {
  const normalizedStart = normalizeWriterSelection(document, startSelection);
  const normalizedEnd = normalizeWriterSelection(document, endSelection);
  const [orderedStart, orderedEnd] = orderWriterSelections(
    document,
    normalizedStart,
    normalizedEnd,
  );
  const versionSource =
    (orderedStart.version ?? 0) >= (orderedEnd.version ?? 0)
      ? orderedStart
      : orderedEnd;
  const nextVersion = getNextWriterSelectionVersion(versionSource);
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
      selection: normalizeWriterSelection(document, {
        ...orderedStart,
        version: nextVersion,
      }),
    };
  }

  if (
    orderedStart.blockId === orderedEnd.blockId &&
    orderedStart.offset === orderedEnd.offset
  ) {
    return {
      document,
      selection: normalizeWriterSelection(document, {
        ...orderedStart,
        version: nextVersion,
      }),
    };
  }

  if (orderedStart.blockId === orderedEnd.blockId) {
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
      selection: normalizeWriterSelection(nextDocument, {
        blockId: startBlock.id,
        offset: orderedStart.offset,
        version: nextVersion,
        affinity: orderedStart.offset === 0 ? "start" : "offset",
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
  const mergedContent = mergeRichTextContents(prefix, suffix);
  const mergedStartBlock = {
    ...startBlock,
    content: mergedContent,
  } satisfies WriterBlock;
  const blocks = [
    ...document.blocks.slice(0, startIndex),
    mergedStartBlock,
    ...document.blocks.slice(endIndex + 1),
  ];
  const nextDocument = {
    ...document,
    blocks,
  };

  return {
    document: nextDocument,
    selection: normalizeWriterSelection(nextDocument, {
      blockId: startBlock.id,
      offset: orderedStart.offset,
      version: nextVersion,
      affinity: orderedStart.offset === 0 ? "start" : "offset",
    }),
  };
}

export function setWriterBlockType(
  document: WriterDocument,
  blockId: string,
  nextType: "paragraph" | "heading" | "list" | "quote" | "code",
  options: { level?: 1 | 2; ordered?: boolean } = {},
): WriterDocument {
  return {
    ...document,
    blocks: document.blocks.map((block) => {
      if (block.id !== blockId || !isRichTextBlock(block)) {
        return block;
      }

      const base = {
        id: block.id,
        content: {
          runs: cloneRuns(block.content.runs),
        },
      };

      switch (nextType) {
        case "heading":
          return {
            ...base,
            type: "heading" as const,
            level: options.level ?? 1,
            layout: createBlockLayout("heading"),
          };
        case "list":
          return {
            ...base,
            type: "list" as const,
            ordered: options.ordered,
            layout: createBlockLayout("list"),
          };
        case "quote":
          return {
            ...base,
            type: "quote" as const,
            layout: createBlockLayout("quote"),
          };
        case "code":
          return {
            ...base,
            type: "code" as const,
            layout: createBlockLayout("code"),
          };
        case "paragraph":
        default:
          return {
            ...base,
            type: "paragraph" as const,
            layout: createBlockLayout("paragraph"),
          };
      }
    }),
  };
}

function createSplitSuccessor(
  block: ParagraphBlock | HeadingBlock | ListBlock | QuoteBlock | CodeBlock,
  content: RichTextContent,
): ParagraphBlock | ListBlock | QuoteBlock | CodeBlock {
  switch (block.type) {
    case "list":
      return {
        id: createWriterId("block"),
        type: "list",
        ordered: block.ordered,
        content,
        layout: createBlockLayout("list"),
      };
    case "quote":
      return {
        id: createWriterId("block"),
        type: "quote",
        content,
        layout: createBlockLayout("quote"),
      };
    case "code":
      return {
        id: createWriterId("block"),
        type: "code",
        content,
        layout: createBlockLayout("code"),
      };
    case "heading":
    case "paragraph":
    default:
      return {
        id: createWriterId("block"),
        type: "paragraph",
        content,
        layout: createBlockLayout("paragraph"),
      };
  }
}

function canMergeBlocks(previousBlock: WriterBlock, currentBlock: WriterBlock) {
  if (!isRichTextBlock(previousBlock) || !isRichTextBlock(currentBlock)) {
    return false;
  }

  return (
    previousBlock.type === currentBlock.type ||
    previousBlock.type === "paragraph" ||
    currentBlock.type === "paragraph"
  );
}

function cloneWriterBlock(block: WriterBlock): WriterBlock {
  if (isRichTextBlock(block)) {
    if (block.type === "heading") {
      return {
        ...block,
        content: {
          runs: cloneRuns(block.content.runs),
        },
        layout: { ...block.layout },
      };
    }

    if (block.type === "list") {
      return {
        ...block,
        content: {
          runs: cloneRuns(block.content.runs),
        },
        layout: { ...block.layout },
      };
    }

    return {
      ...block,
      content: {
        runs: cloneRuns(block.content.runs),
      },
      layout: { ...block.layout },
    };
  }

  if (block.type === "bibliography") {
    return {
      ...block,
      content: {
        entries: block.content.entries.map((entry) => ({ ...entry })),
      },
      layout: { ...block.layout },
    };
  }

  switch (block.type) {
    case "formula":
      return {
        ...block,
        content: { ...block.content },
        layout: { ...block.layout },
      };
    case "image":
      return {
        ...block,
        content: { ...block.content },
        layout: { ...block.layout },
      };
    case "chart":
      return {
        ...block,
        content: { ...block.content },
        layout: { ...block.layout },
      };
    default:
      return block;
  }
}

function cloneRuns(runs: TextRun[]) {
  return runs.map((run) => ({
    text: run.text,
    marks: cloneMarks(run.marks),
  }));
}

function cloneMarks(marks?: InlineMark[]) {
  return marks?.map((mark) => ({ ...mark })) ?? undefined;
}

function normalizeMetadata(
  value: unknown,
  fallback: WriterMetadata,
): WriterMetadata {
  if (!isRecord(value)) {
    return fallback;
  }

  return {
    title:
      typeof value.title === "string" && value.title.length > 0
        ? value.title
        : fallback.title,
    language:
      typeof value.language === "string" && value.language.length > 0
        ? value.language
        : fallback.language,
    createdAt:
      typeof value.createdAt === "string" && value.createdAt.length > 0
        ? value.createdAt
        : fallback.createdAt,
    updatedAt:
      typeof value.updatedAt === "string" && value.updatedAt.length > 0
        ? value.updatedAt
        : fallback.updatedAt,
  };
}

function normalizePageSettings(value: unknown): PageSettings {
  if (!isRecord(value)) {
    return createPageSettings();
  }

  return createPageSettings({
    pageWidth: toFiniteNumber(value.pageWidth),
    pageHeight: toFiniteNumber(value.pageHeight),
    paddingTop: toFiniteNumber(value.paddingTop),
    paddingRight: toFiniteNumber(value.paddingRight),
    paddingBottom: toFiniteNumber(value.paddingBottom),
    paddingLeft: toFiniteNumber(value.paddingLeft),
  });
}

function normalizeWriterReferences(value: unknown): WriterReferences {
  if (
    !isRecord(value) ||
    !Array.isArray(value.order) ||
    !isRecord(value.itemsByBibliographyId)
  ) {
    return {
      order: [],
      itemsByBibliographyId: {},
    };
  }

  const itemsByBibliographyId: Record<string, WriterReference> = {};
  const order: string[] = [];

  for (const bibliographyId of value.order) {
    if (typeof bibliographyId !== "string" || bibliographyId.length === 0) {
      continue;
    }

    const rawReference = value.itemsByBibliographyId[bibliographyId];

    if (!isRecord(rawReference)) {
      continue;
    }

    itemsByBibliographyId[bibliographyId] = {
      bibliographyId,
      referenceId:
        typeof rawReference.referenceId === "string"
          ? rawReference.referenceId
          : bibliographyId,
      noteId:
        typeof rawReference.noteId === "string"
          ? rawReference.noteId
          : bibliographyId,
      citation:
        typeof rawReference.citation === "string"
          ? rawReference.citation
          : bibliographyId,
      bibliographyEntry:
        typeof rawReference.bibliographyEntry === "string"
          ? rawReference.bibliographyEntry
          : typeof rawReference.citation === "string"
            ? rawReference.citation
            : bibliographyId,
      sourceId:
        typeof rawReference.sourceId === "string"
          ? rawReference.sourceId
          : undefined,
      sourceLabel:
        typeof rawReference.sourceLabel === "string"
          ? rawReference.sourceLabel
          : undefined,
      sourceUrl:
        typeof rawReference.sourceUrl === "string"
          ? rawReference.sourceUrl
          : undefined,
    };
    order.push(bibliographyId);
  }

  return {
    order,
    itemsByBibliographyId,
  };
}

function normalizeWriterBlock(value: unknown): WriterBlock | null {
  if (
    !isRecord(value) ||
    typeof value.id !== "string" ||
    typeof value.type !== "string"
  ) {
    return null;
  }

  switch (value.type) {
    case "paragraph":
      return {
        id: value.id,
        type: "paragraph",
        content: normalizeRichTextContent(value.content),
        layout: normalizeBlockLayout(value.layout, "paragraph"),
      };
    case "heading":
      return {
        id: value.id,
        type: "heading",
        level: value.level === 2 ? 2 : 1,
        content: normalizeRichTextContent(value.content),
        layout: normalizeBlockLayout(value.layout, "heading"),
      };
    case "list":
      return {
        id: value.id,
        type: "list",
        ordered: value.ordered === true,
        content: normalizeRichTextContent(value.content),
        layout: normalizeBlockLayout(value.layout, "list"),
      };
    case "quote":
      return {
        id: value.id,
        type: "quote",
        content: normalizeRichTextContent(value.content),
        layout: normalizeBlockLayout(value.layout, "quote"),
      };
    case "code":
      return {
        id: value.id,
        type: "code",
        content: normalizeRichTextContent(value.content),
        layout: normalizeBlockLayout(value.layout, "code"),
      };
    case "formula":
      return {
        id: value.id,
        type: "formula",
        content: {
          latex:
            isRecord(value.content) && typeof value.content.latex === "string"
              ? value.content.latex
              : "",
          height:
            isRecord(value.content) && typeof value.content.height === "number"
              ? value.content.height
              : undefined,
        },
        layout: normalizeBlockLayout(value.layout, "formula"),
      };
    case "image":
      return {
        id: value.id,
        type: "image",
        content: {
          src:
            isRecord(value.content) && typeof value.content.src === "string"
              ? value.content.src
              : "",
          alt:
            isRecord(value.content) && typeof value.content.alt === "string"
              ? value.content.alt
              : undefined,
          caption:
            isRecord(value.content) && typeof value.content.caption === "string"
              ? value.content.caption
              : undefined,
          width:
            isRecord(value.content) && typeof value.content.width === "number"
              ? value.content.width
              : undefined,
          height:
            isRecord(value.content) && typeof value.content.height === "number"
              ? value.content.height
              : undefined,
        },
        layout: normalizeBlockLayout(value.layout, "image"),
      };
    case "chart":
      return {
        id: value.id,
        type: "chart",
        content: {
          title:
            isRecord(value.content) && typeof value.content.title === "string"
              ? value.content.title
              : undefined,
          description:
            isRecord(value.content) &&
            typeof value.content.description === "string"
              ? value.content.description
              : undefined,
          height:
            isRecord(value.content) && typeof value.content.height === "number"
              ? value.content.height
              : undefined,
        },
        layout: normalizeBlockLayout(value.layout, "chart"),
      };
    default:
      return null;
  }
}

function normalizeBlockLayout(
  value: unknown,
  type: WriterBlock["type"],
): BlockLayout {
  const fallback = createBlockLayout(type);

  if (!isRecord(value)) {
    return fallback;
  }

  return {
    measuredHeight:
      typeof value.measuredHeight === "number"
        ? value.measuredHeight
        : undefined,
    canSplit:
      typeof value.canSplit === "boolean" ? value.canSplit : fallback.canSplit,
    avoidBreakInside:
      typeof value.avoidBreakInside === "boolean"
        ? value.avoidBreakInside
        : fallback.avoidBreakInside,
    oversized:
      typeof value.oversized === "boolean" ? value.oversized : undefined,
  };
}

function normalizeRichTextContent(value: unknown): RichTextContent {
  if (!isRecord(value) || !Array.isArray(value.runs)) {
    return { runs: [{ text: "" }] };
  }

  const runs: TextRun[] = [];

  for (const rawRun of value.runs) {
    if (!isRecord(rawRun) || typeof rawRun.text !== "string") {
      continue;
    }

    runs.push({
      text: rawRun.text,
      marks: normalizeInlineMarks(rawRun.marks),
    });
  }

  return {
    runs: normalizeRuns(runs),
  };
}

function normalizeInlineMarks(value: unknown): InlineMark[] | undefined {
  if (!Array.isArray(value)) {
    return undefined;
  }

  const marks: InlineMark[] = [];

  for (const rawMark of value) {
    if (!isRecord(rawMark) || typeof rawMark.type !== "string") {
      continue;
    }

    switch (rawMark.type) {
      case "bold":
      case "italic":
      case "code":
        marks.push({ type: rawMark.type });
        break;
      case "link":
        if (typeof rawMark.href === "string" && rawMark.href.length > 0) {
          marks.push({
            type: "link",
            href: rawMark.href,
            linkId:
              typeof rawMark.linkId === "string" ? rawMark.linkId : undefined,
          });
        }
        break;
      case "reference":
        if (
          typeof rawMark.referenceId === "string" &&
          typeof rawMark.noteId === "string" &&
          typeof rawMark.bibliographyId === "string" &&
          typeof rawMark.citation === "string"
        ) {
          marks.push({
            type: "reference",
            referenceId: rawMark.referenceId,
            noteId: rawMark.noteId,
            sourceId:
              typeof rawMark.sourceId === "string"
                ? rawMark.sourceId
                : undefined,
            bibliographyId: rawMark.bibliographyId,
            citation: rawMark.citation,
          });
        }
        break;
      case "comment":
        if (
          typeof rawMark.commentId === "string" &&
          rawMark.commentId.length > 0
        ) {
          marks.push({
            type: "comment",
            commentId: rawMark.commentId,
          });
        }
        break;
      default:
        break;
    }
  }

  return marks.length > 0 ? marks : undefined;
}

function normalizeRuns(runs: TextRun[]) {
  const normalized: TextRun[] = [];

  for (const run of runs) {
    if (run.text.length === 0) {
      continue;
    }

    const previousRun = normalized[normalized.length - 1];

    if (previousRun && haveSameMarks(previousRun.marks, run.marks)) {
      previousRun.text += run.text;
      continue;
    }

    normalized.push({
      text: run.text,
      marks: cloneMarks(run.marks),
    });
  }

  return normalized.length > 0 ? normalized : [{ text: "" }];
}

function orderWriterSelections(
  document: WriterDocument,
  left: WriterSelection,
  right: WriterSelection,
): [WriterSelection, WriterSelection] {
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

function haveSameMarks(left?: InlineMark[], right?: InlineMark[]) {
  return JSON.stringify(left ?? []) === JSON.stringify(right ?? []);
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === "object" && value !== null;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function toFiniteNumber(value: unknown) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}
