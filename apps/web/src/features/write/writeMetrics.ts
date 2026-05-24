import type {
  CodeBlock,
  HeadingBlock,
  ListBlock,
  PageSettings,
  ParagraphBlock,
  QuoteBlock,
  RichTextContent,
  WriterBlock,
} from "@/features/write/document/writerDocument";

export type TextBlockMetrics = {
  fontSize: number;
  lineHeight: number;
  paddingTop: number;
  paddingRight: number;
  paddingBottom: number;
  paddingLeft: number;
  marginTop: number;
  marginBottom: number;
  minContentHeight: number;
  reservedWidth: number;
};

export const WRITER_PAGE_GAP = 32;
export const WRITER_PAGE_NUMBER_MARGIN_TOP = 12;
export const WRITER_PARAGRAPH_MARK_WIDTH = 16;
export const WRITER_PARAGRAPH_MARK_GAP = 8;

export const WRITER_PARAGRAPH_METRICS: TextBlockMetrics = {
  fontSize: 16,
  lineHeight: 24,
  paddingTop: 4,
  paddingRight: 4,
  paddingBottom: 4,
  paddingLeft: 4,
  marginTop: 0,
  marginBottom: 12,
  minContentHeight: 24,
  reservedWidth: 8,
};

export const WRITER_HEADING_1_METRICS: TextBlockMetrics = {
  fontSize: 32,
  lineHeight: 40,
  paddingTop: 4,
  paddingRight: 4,
  paddingBottom: 4,
  paddingLeft: 4,
  marginTop: 4,
  marginBottom: 16,
  minContentHeight: 40,
  reservedWidth: 8,
};

export const WRITER_HEADING_2_METRICS: TextBlockMetrics = {
  fontSize: 26,
  lineHeight: 34,
  paddingTop: 4,
  paddingRight: 4,
  paddingBottom: 4,
  paddingLeft: 4,
  marginTop: 4,
  marginBottom: 12,
  minContentHeight: 34,
  reservedWidth: 8,
};

export const WRITER_LIST_METRICS: TextBlockMetrics = {
  fontSize: 16,
  lineHeight: 24,
  paddingTop: 4,
  paddingRight: 4,
  paddingBottom: 4,
  paddingLeft: 24,
  marginTop: 0,
  marginBottom: 12,
  minContentHeight: 24,
  reservedWidth: 28,
};

export const WRITER_QUOTE_METRICS: TextBlockMetrics = {
  fontSize: 17,
  lineHeight: 28,
  paddingTop: 12,
  paddingRight: 16,
  paddingBottom: 12,
  paddingLeft: 16,
  marginTop: 0,
  marginBottom: 12,
  minContentHeight: 28,
  reservedWidth: 36,
};

export const WRITER_CODE_METRICS: TextBlockMetrics = {
  fontSize: 14,
  lineHeight: 24,
  paddingTop: 16,
  paddingRight: 16,
  paddingBottom: 16,
  paddingLeft: 16,
  marginTop: 0,
  marginBottom: 12,
  minContentHeight: 24,
  reservedWidth: 32,
};

export function getTextBlockMetrics(
  block:
    | ParagraphBlock
    | HeadingBlock
    | ListBlock
    | QuoteBlock
    | CodeBlock
    | Pick<ParagraphBlock, "type">
    | Pick<HeadingBlock, "type" | "level">
    | Pick<ListBlock, "type">
    | Pick<QuoteBlock, "type">
    | Pick<CodeBlock, "type">,
): TextBlockMetrics {
  switch (block.type) {
    case "heading":
      return block.level === 1
        ? WRITER_HEADING_1_METRICS
        : WRITER_HEADING_2_METRICS;
    case "list":
      return WRITER_LIST_METRICS;
    case "quote":
      return WRITER_QUOTE_METRICS;
    case "code":
      return WRITER_CODE_METRICS;
    case "paragraph":
    default:
      return WRITER_PARAGRAPH_METRICS;
  }
}

export function getBlockAvailableWidth(
  block:
    | ParagraphBlock
    | HeadingBlock
    | ListBlock
    | QuoteBlock
    | CodeBlock
    | Pick<ParagraphBlock, "type">
    | Pick<HeadingBlock, "type" | "level">
    | Pick<ListBlock, "type">
    | Pick<QuoteBlock, "type">
    | Pick<CodeBlock, "type">,
  settings: PageSettings,
) {
  const metrics = getTextBlockMetrics(block);

  return Math.max(120, settings.contentWidth - metrics.reservedWidth);
}

export function estimateTextBlockHeight(
  content: RichTextContent,
  block:
    | ParagraphBlock
    | HeadingBlock
    | ListBlock
    | QuoteBlock
    | CodeBlock
    | Pick<ParagraphBlock, "type">
    | Pick<HeadingBlock, "type" | "level">
    | Pick<ListBlock, "type">
    | Pick<QuoteBlock, "type">
    | Pick<CodeBlock, "type">,
  settings: PageSettings,
) {
  const metrics = getTextBlockMetrics(block);
  const text = content.runs.map((run) => run.text).join("");
  const paragraphs = text.length > 0 ? text.split("\n") : [""];
  const charsPerLine = Math.max(
    6,
    Math.floor(
      getBlockAvailableWidth(block, settings) /
        Math.max(1, metrics.fontSize * 0.52),
    ),
  );
  const lineCount = paragraphs.reduce((count, paragraph) => {
    const value = paragraph.length === 0 ? " " : paragraph;
    return count + Math.max(1, Math.ceil(value.length / charsPerLine));
  }, 0);
  const contentHeight = Math.max(
    metrics.minContentHeight,
    lineCount * metrics.lineHeight,
  );

  return (
    metrics.marginTop +
    metrics.paddingTop +
    contentHeight +
    metrics.paddingBottom +
    metrics.marginBottom
  );
}

export function isParagraphLikeBlock(
  block: WriterBlock,
): block is ParagraphBlock {
  return block.type === "paragraph";
}
