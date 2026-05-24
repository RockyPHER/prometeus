import { cn } from "@/lib/cn";
import type { PaginatedDocument } from "@/features/write/document/writerDocument";
import { BlockEditor } from "@/features/write/editor/BlockEditor";

type PageRendererProps = {
  document: PaginatedDocument;
  onAddParagraphAfter: (blockId: string) => void;
  onApplyBackspace: () => boolean;
  onApplyDelete: () => boolean;
  onApplyEnter: () => void;
  onMoveSelectionToNextBlock: (blockId: string) => boolean;
  onMoveSelectionToPreviousBlock: (blockId: string) => boolean;
  onPageTrailingClick: (pageIndex: number) => void;
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
  zoom: number;
};

export function PageRenderer({
  document,
  onAddParagraphAfter,
  onApplyBackspace,
  onApplyDelete,
  onApplyEnter,
  onMoveSelectionToNextBlock,
  onMoveSelectionToPreviousBlock,
  onPageTrailingClick,
  onReferenceClick,
  onReferenceHover,
  onReferenceLeave,
  showParagraphMarks,
  zoom,
}: PageRendererProps) {
  const scale = zoom / 100;

  return (
    <div className="mx-auto flex w-full flex-col items-center gap-8 px-4 py-10 sm:px-8">
      {document.pages.map((page) => (
        <div key={page.id} className="flex flex-col items-center gap-3">
          <div
            className="relative"
            style={{
              width: document.settings.pageWidth * scale,
              height: document.settings.pageHeight * scale,
            }}
          >
            <div
              className="absolute left-0 top-0 overflow-hidden rounded-[1.35rem] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.12)] ring-1 ring-slate-200/80"
              style={{
                width: document.settings.pageWidth,
                height: document.settings.pageHeight,
                transform: `scale(${scale})`,
                transformOrigin: "top left",
              }}
            >
              <div
                className="flex h-full flex-col"
                style={{
                  paddingTop: document.settings.paddingTop,
                  paddingRight: document.settings.paddingRight,
                  paddingBottom: document.settings.paddingBottom,
                  paddingLeft: document.settings.paddingLeft,
                }}
              >
                <div className="flex min-h-0 flex-1 flex-col">
                  {page.items.map((item) => {
                    const block = document.blocksById[item.blockId];

                    if (!block) {
                      return null;
                    }

                    const itemKey =
                      item.type === "fragment"
                        ? `${item.blockId}:${item.from}-${item.to}`
                        : `${item.blockId}:block`;

                    return (
                      <BlockEditor
                        key={`${page.id}-${itemKey}`}
                        block={block}
                        item={item}
                        onAddParagraphAfter={onAddParagraphAfter}
                        onApplyBackspace={onApplyBackspace}
                        onApplyDelete={onApplyDelete}
                        onApplyEnter={onApplyEnter}
                        onMoveSelectionToNextBlock={onMoveSelectionToNextBlock}
                        onMoveSelectionToPreviousBlock={
                          onMoveSelectionToPreviousBlock
                        }
                        onReferenceClick={onReferenceClick}
                        onReferenceHover={onReferenceHover}
                        onReferenceLeave={onReferenceLeave}
                        showParagraphMarks={showParagraphMarks}
                      />
                    );
                  })}
                  <div
                    aria-hidden="true"
                    className="flex-1 cursor-text"
                    onMouseDown={(event) => {
                      event.preventDefault();
                      onPageTrailingClick(page.index);
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <span
              className={cn(
                "rounded-full bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-400 ring-1 ring-slate-200/80",
              )}
            >
              Pagina {page.number}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
