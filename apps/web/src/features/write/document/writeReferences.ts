import {
  DERIVED_BIBLIOGRAPHY_BLOCK_ID,
  getPlainText,
  isRichTextBlock,
  type BibliographyBlock,
  type WriterBlock,
  type WriterReference,
  type WriterReferences,
} from "@/features/write/document/writerDocument";

export function syncWriterReferences(
  blocks: WriterBlock[],
  currentReferences: WriterReferences,
): WriterReferences {
  const order: string[] = [];
  const itemsByBibliographyId: Record<string, WriterReference> = {};

  for (const block of blocks) {
    if (!isRichTextBlock(block)) {
      continue;
    }

    for (const run of block.content.runs) {
      for (const mark of run.marks ?? []) {
        if (
          mark.type !== "reference" ||
          itemsByBibliographyId[mark.bibliographyId]
        ) {
          continue;
        }

        const existingReference =
          currentReferences.itemsByBibliographyId[mark.bibliographyId];

        itemsByBibliographyId[mark.bibliographyId] = {
          bibliographyId: mark.bibliographyId,
          referenceId: mark.referenceId,
          noteId: mark.noteId,
          citation: mark.citation,
          bibliographyEntry:
            existingReference?.bibliographyEntry ??
            existingReference?.citation ??
            mark.citation,
          sourceId: mark.sourceId ?? existingReference?.sourceId,
          sourceLabel: existingReference?.sourceLabel,
          sourceUrl: existingReference?.sourceUrl,
        };
        order.push(mark.bibliographyId);
      }
    }
  }

  return {
    order,
    itemsByBibliographyId,
  };
}

export function getOrderedReferences(references: WriterReferences) {
  return references.order
    .map((bibliographyId) => references.itemsByBibliographyId[bibliographyId])
    .filter((reference): reference is WriterReference => Boolean(reference));
}

export function getReferenceByBibliographyId(
  references: WriterReferences,
  bibliographyId: string,
) {
  return references.itemsByBibliographyId[bibliographyId] ?? null;
}

export function buildBibliographyBlock(
  references: WriterReferences,
): BibliographyBlock | null {
  const entries = getOrderedReferences(references);

  if (entries.length === 0) {
    return null;
  }

  return {
    id: DERIVED_BIBLIOGRAPHY_BLOCK_ID,
    type: "bibliography",
    content: {
      entries: entries.map((entry) => ({ ...entry })),
    },
    layout: {
      canSplit: false,
      avoidBreakInside: true,
    },
  };
}

export function countReferenceMarks(blocks: WriterBlock[]) {
  let count = 0;

  for (const block of blocks) {
    if (!isRichTextBlock(block)) {
      continue;
    }

    for (const run of block.content.runs) {
      count +=
        run.marks?.filter((mark) => mark.type === "reference").length ?? 0;
    }
  }

  return count;
}

export function getReferenceSummary(reference: WriterReference) {
  return reference.bibliographyEntry || reference.citation;
}

export function getBibliographySearchText(reference: WriterReference) {
  return [
    reference.citation,
    reference.bibliographyEntry,
    reference.sourceLabel,
  ]
    .filter(Boolean)
    .join(" ");
}

export function blockUsesReferences(block: WriterBlock) {
  if (!isRichTextBlock(block)) {
    return false;
  }

  return block.content.runs.some((run) =>
    (run.marks ?? []).some((mark) => mark.type === "reference"),
  );
}

export function getBlockReferencePreview(block: WriterBlock) {
  return isRichTextBlock(block)
    ? getPlainText(block.content).slice(0, 140)
    : "";
}
