import type { ReactNode } from "react";
import type {
  InlineMark,
  RichTextContent,
  TextRun,
} from "@/features/write/document/writerDocument";

type ReferenceHoverPayload = {
  bibliographyId: string;
  citation: string;
  noteId: string;
  sourceId?: string;
  x: number;
  y: number;
};

type TextRunRendererProps = {
  content: RichTextContent;
  onReferenceClick?: (bibliographyId: string) => void;
  onReferenceHover?: (payload: ReferenceHoverPayload) => void;
  onReferenceLeave?: () => void;
};

const MARK_ORDER: Record<InlineMark["type"], number> = {
  bold: 1,
  italic: 1,
  code: 1,
  link: 2,
  reference: 3,
  comment: 4,
};

export function TextRunRenderer({
  content,
  onReferenceClick,
  onReferenceHover,
  onReferenceLeave,
}: TextRunRendererProps) {
  return (
    <>
      {content.runs.map((run, index) => (
        <span key={`run-${index}`}>
          {renderRun(
            run,
            index,
            onReferenceClick,
            onReferenceHover,
            onReferenceLeave,
          )}
        </span>
      ))}
    </>
  );
}

function renderRun(
  run: TextRun,
  index: number,
  onReferenceClick?: (bibliographyId: string) => void,
  onReferenceHover?: (payload: ReferenceHoverPayload) => void,
  onReferenceLeave?: () => void,
) {
  const sortedMarks = [...(run.marks ?? [])].sort(
    (left, right) => MARK_ORDER[left.type] - MARK_ORDER[right.type],
  );

  return sortedMarks.reduce<ReactNode>((node, mark, markIndex) => {
    const key = `mark-${index}-${markIndex}`;

    switch (mark.type) {
      case "bold":
        return (
          <strong key={key} className="font-semibold text-slate-950">
            {node}
          </strong>
        );
      case "italic":
        return (
          <em key={key} className="italic">
            {node}
          </em>
        );
      case "code":
        return (
          <code
            key={key}
            className="rounded bg-slate-100 px-1 py-0.5 font-mono text-[0.92em] text-slate-800"
          >
            {node}
          </code>
        );
      case "link":
        return (
          <span
            key={key}
            data-link-mark="true"
            data-href={mark.href}
            className="cursor-pointer text-workspace-write-700 underline decoration-workspace-write-300 underline-offset-2"
          >
            {node}
          </span>
        );
      case "reference":
        return (
          <span
            key={key}
            data-reference-mark="true"
            data-reference-id={mark.referenceId}
            data-bibliography-id={mark.bibliographyId}
            data-note-id={mark.noteId}
            data-source-id={mark.sourceId}
            data-citation={mark.citation}
            className="bg-amber-100/75 text-amber-950 ring-amber-200/70 cursor-pointer rounded-sm px-0.5 ring-1"
            onClick={(event) => {
              event.preventDefault();
              event.stopPropagation();
              onReferenceClick?.(mark.bibliographyId);
            }}
            onMouseEnter={(event) => {
              const rect = event.currentTarget.getBoundingClientRect();
              onReferenceHover?.({
                bibliographyId: mark.bibliographyId,
                citation: mark.citation,
                noteId: mark.noteId,
                sourceId: mark.sourceId,
                x: rect.left + rect.width / 2,
                y: rect.top,
              });
            }}
            onMouseLeave={onReferenceLeave}
          >
            {node}
          </span>
        );
      case "comment":
        return (
          <span
            key={key}
            data-comment-id={mark.commentId}
            className="border-sky-300 rounded-sm border-b border-dashed"
          >
            {node}
          </span>
        );
      default:
        return node;
    }
  }, run.text);
}
