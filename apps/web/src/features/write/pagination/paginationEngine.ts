import {
  getPlainText,
  getTextLength,
  sliceRichTextContent,
  type Page,
  type PageItem,
  type PageSettings,
  type PaginatedDocument,
  type RichTextContent,
  type WriterBlock,
  type WriterDocument,
} from "@/features/write/document/writerDocument";
import { buildBibliographyBlock } from "@/features/write/document/writeReferences";
import { estimateTextBlockHeight } from "@/features/write/writeMetrics";

export function paginateDocument(document: WriterDocument): PaginatedDocument {
  const blocks = getBlocksForPagination(document);
  const blocksById = Object.fromEntries(
    blocks.map((block) => [
      block.id,
      {
        ...block,
        layout: { ...block.layout, oversized: false },
      },
    ]),
  ) as Record<string, WriterBlock>;
  const pages: Page[] = [createPage(0)];
  let currentPage = pages[0];
  let currentPageHeight = 0;

  const startNewPage = () => {
    currentPage = createPage(pages.length);
    pages.push(currentPage);
    currentPageHeight = 0;
  };

  const getRemainingHeight = () =>
    Math.max(0, document.settings.contentHeight - currentPageHeight);

  const pushItem = (item: PageItem, itemHeight: number) => {
    currentPage.items.push(item);
    currentPageHeight += itemHeight;
  };

  for (const sourceBlock of blocks) {
    const block = blocksById[sourceBlock.id];
    const measuredHeight = estimateBlockHeight(block, document.settings);

    block.layout.measuredHeight = measuredHeight;
    block.layout.oversized = false;

    if (block.type === "paragraph" && block.layout.canSplit) {
      let from = 0;
      const totalLength = getTextLength(block.content);

      if (totalLength === 0) {
        if (
          measuredHeight > getRemainingHeight() &&
          currentPage.items.length > 0
        ) {
          startNewPage();
        }

        pushItem({ type: "block", blockId: block.id }, measuredHeight);
        continue;
      }

      while (from < totalLength) {
        const remainingHeight = getRemainingHeight();
        const fragmentHeight = estimateFragmentHeight(
          block.content,
          from,
          totalLength,
          document.settings,
        );

        if (fragmentHeight <= remainingHeight) {
          pushItem(
            from === 0 && totalLength === getTextLength(block.content)
              ? { type: "block", blockId: block.id }
              : { type: "fragment", blockId: block.id, from, to: totalLength },
            fragmentHeight,
          );
          from = totalLength;
          continue;
        }

        const maxOffset = findMaxOffsetThatFits(
          block.content,
          from,
          totalLength,
          remainingHeight,
          document.settings,
        );

        if (maxOffset <= from) {
          if (currentPage.items.length === 0) {
            const forcedTo = Math.min(totalLength, from + 1);
            const forcedHeight = estimateFragmentHeight(
              block.content,
              from,
              forcedTo,
              document.settings,
            );

            pushItem(
              { type: "fragment", blockId: block.id, from, to: forcedTo },
              forcedHeight,
            );
            from = forcedTo;
          }

          if (from < totalLength) {
            startNewPage();
          }

          continue;
        }

        const fittedHeight = estimateFragmentHeight(
          block.content,
          from,
          maxOffset,
          document.settings,
        );

        pushItem(
          { type: "fragment", blockId: block.id, from, to: maxOffset },
          fittedHeight,
        );
        from = maxOffset;

        if (from < totalLength) {
          startNewPage();
        }
      }

      continue;
    }

    if (measuredHeight <= getRemainingHeight()) {
      pushItem({ type: "block", blockId: block.id }, measuredHeight);
      continue;
    }

    if (measuredHeight > document.settings.contentHeight) {
      block.layout.oversized = true;

      if (currentPage.items.length > 0) {
        startNewPage();
      }

      pushItem({ type: "block", blockId: block.id }, measuredHeight);
      continue;
    }

    if (currentPage.items.length > 0) {
      startNewPage();
    }

    pushItem({ type: "block", blockId: block.id }, measuredHeight);
  }

  if (pages.length === 0) {
    pages.push(createPage(0));
  }

  return {
    metadata: document.metadata,
    settings: document.settings,
    pages,
    blocksById,
    references: document.references,
  };
}

export function estimateTextHeight(
  content: RichTextContent,
  settings: PageSettings,
  options: {
    type?: "paragraph" | "heading" | "list" | "quote" | "code";
    level?: 1 | 2;
  } = {},
) {
  if (options.type === "heading") {
    return estimateTextBlockHeight(
      content,
      {
        type: "heading",
        level: options.level === 2 ? 2 : 1,
      },
      settings,
    );
  }

  return estimateTextBlockHeight(
    content,
    {
      type: options.type ?? "paragraph",
    } as
      | { type: "paragraph" }
      | { type: "list" }
      | { type: "quote" }
      | { type: "code" },
    settings,
  );
}

export function estimateFragmentHeight(
  content: RichTextContent,
  from: number,
  to: number,
  settings: PageSettings,
) {
  const fragment = sliceRichTextContent(content, from, to);

  return estimateTextBlockHeight(fragment, { type: "paragraph" }, settings);
}

export function findMaxOffsetThatFits(
  content: RichTextContent,
  from: number,
  to: number,
  availableHeight: number,
  settings: PageSettings,
) {
  if (availableHeight <= 0) {
    return from;
  }

  let low = from;
  let high = to;
  let best = from;

  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const height = estimateFragmentHeight(content, from, mid, settings);

    if (height <= availableHeight) {
      best = mid;
      low = mid + 1;
    } else {
      high = mid - 1;
    }
  }

  if (best <= from) {
    return from;
  }

  const plainText = getPlainText(content);

  for (let index = best; index > from + 1; index -= 1) {
    if (/\s/.test(plainText[index - 1] ?? "")) {
      return index;
    }
  }

  return best;
}

function getBlocksForPagination(document: WriterDocument) {
  const blocks = document.blocks.map((block) => ({
    ...block,
    layout: { ...block.layout, oversized: false },
  }));
  const bibliographyBlock = buildBibliographyBlock(document.references);

  return bibliographyBlock ? [...blocks, bibliographyBlock] : blocks;
}

function createPage(index: number): Page {
  return {
    id: `page-${index + 1}`,
    index,
    number: index + 1,
    items: [],
  };
}

function estimateBlockHeight(block: WriterBlock, settings: PageSettings) {
  switch (block.type) {
    case "paragraph":
      return estimateTextBlockHeight(block.content, block, settings);
    case "heading":
      return estimateTextBlockHeight(block.content, block, settings);
    case "list":
      return estimateTextBlockHeight(block.content, block, settings);
    case "quote":
      return estimateTextBlockHeight(block.content, block, settings);
    case "code":
      return estimateTextBlockHeight(block.content, block, settings);
    case "formula":
      return Math.max(88, (block.content.height ?? 96) + 12);
    case "image":
      return Math.max(
        180,
        (block.content.height ?? 220) + getCaptionHeight(block.content.caption),
      );
    case "chart":
      return Math.max(
        220,
        (block.content.height ?? 240) +
          getCaptionHeight(block.content.description),
      );
    case "bibliography":
      return block.content.entries.reduce((totalHeight, entry) => {
        return (
          totalHeight +
          estimateTextBlockHeight(
            {
              runs: [
                { text: `${entry.citation} ${entry.bibliographyEntry}`.trim() },
              ],
            },
            {
              type: "paragraph",
            },
            settings,
          )
        );
      }, 32);
    default:
      return 32;
  }
}

function getCaptionHeight(text?: string) {
  if (!text) {
    return 0;
  }

  return Math.max(28, Math.ceil(text.length / 64) * 20 + 12);
}
