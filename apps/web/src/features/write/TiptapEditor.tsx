import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import StarterKit from "@tiptap/starter-kit";
import { EditorContent, useEditor, type Editor } from "@tiptap/react";
import { AnimatePresence } from "framer-motion";
import type { JSONContent } from "@tiptap/core";
import { useEffect, useRef, useState } from "react";
import { ReferenceMark } from "@/features/write/ReferenceMark";
import {
  ReferenceTooltip,
  type HoveredReference,
} from "@/features/write/ReferenceTooltip";
import type { ReferenceItem } from "@/features/write/types";
import { cn } from "@/lib/cn";

type TiptapEditorProps = {
  content: JSONContent;
  onChange: (payload: { contentJson: JSONContent; editor: Editor }) => void;
  onReady: (editor: Editor | null) => void;
  onReferenceClick: (bibliographyId: string) => void;
  references: ReferenceItem[];
  title: string;
  onTitleChange: (title: string) => void;
};

export function TiptapEditor({
  content,
  onChange,
  onReady,
  onReferenceClick,
  references,
  title,
  onTitleChange,
}: TiptapEditorProps) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const [hoveredReference, setHoveredReference] =
    useState<HoveredReference | null>(null);
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        codeBlock: {
          HTMLAttributes: {
            class: "prometeus-code-block",
          },
        },
        heading: {
          levels: [1, 2, 3],
        },
      }),
      Placeholder.configure({
        placeholder: "Comece a escrever...",
      }),
      Link.configure({
        autolink: true,
        defaultProtocol: "https",
        openOnClick: false,
      }),
      ReferenceMark,
    ],
    content,
    editorProps: {
      attributes: {
        class:
          "min-h-[48vh] px-9 pb-12 pt-4 text-[16px] leading-[1.95] text-slate-700 focus:outline-none",
      },
      handleClick: (_view, _pos, event) => {
        const target = event.target;

        if (!(target instanceof HTMLElement)) {
          return false;
        }

        const referenceElement = target.closest<HTMLElement>(
          "[data-reference-mark='true']",
        );
        const bibliographyId = referenceElement?.dataset.bibliographyId;

        if (!bibliographyId) {
          return false;
        }

        onReferenceClick(bibliographyId);
        return true;
      },
    },
    onCreate: ({ editor: currentEditor }) => {
      onReady(currentEditor);
    },
    onUpdate: ({ editor: currentEditor }) => {
      onChange({
        contentJson: currentEditor.getJSON(),
        editor: currentEditor,
      });
    },
  });

  useEffect(() => {
    onReady(editor);

    return () => {
      onReady(null);
    };
  }, [editor, onReady]);

  useEffect(() => {
    if (!editor) {
      return;
    }

    const currentJson = editor.getJSON();

    if (JSON.stringify(currentJson) === JSON.stringify(content)) {
      return;
    }

    editor.commands.setContent(content, { emitUpdate: false });
  }, [content, editor]);

  useEffect(() => {
    const wrapper = wrapperRef.current;

    if (!wrapper) {
      return;
    }

    const currentWrapper = wrapper;

    function handleMouseMove(event: MouseEvent) {
      const target = event.target;

      if (!(target instanceof HTMLElement)) {
        setHoveredReference(null);
        return;
      }

      const referenceElement = target.closest<HTMLElement>(
        "[data-reference-mark='true']",
      );

      if (!referenceElement || !currentWrapper.contains(referenceElement)) {
        setHoveredReference(null);
        return;
      }

      const bibliographyId = referenceElement.dataset.bibliographyId;
      const citation = referenceElement.dataset.citation;

      if (!bibliographyId || !citation) {
        setHoveredReference(null);
        return;
      }

      const rect = referenceElement.getBoundingClientRect();
      const wrapperRect = currentWrapper.getBoundingClientRect();
      const reference = references.find(
        (item) => item.bibliographyId === bibliographyId,
      );

      setHoveredReference({
        bibliographyId,
        citation,
        sourceLabel:
          referenceElement.dataset.sourceLabel || reference?.sourceLabel,
        sourceUrl: referenceElement.dataset.sourceUrl || reference?.sourceUrl,
        x: rect.left - wrapperRect.left + rect.width / 2,
        y: rect.top - wrapperRect.top,
      });
    }

    function handleMouseLeave(event: MouseEvent) {
      const relatedTarget = event.relatedTarget;

      if (
        relatedTarget instanceof Node &&
        currentWrapper.contains(relatedTarget)
      ) {
        return;
      }

      setHoveredReference(null);
    }

    currentWrapper.addEventListener("mousemove", handleMouseMove);
    currentWrapper.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      currentWrapper.removeEventListener("mousemove", handleMouseMove);
      currentWrapper.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [references]);

  return (
    <div
      ref={wrapperRef}
      className="relative flex h-full min-h-0 flex-col overflow-y-auto bg-transparent"
    >
      <div
        className={cn(
          "mx-auto w-full max-w-5xl",
          "rounded-[1.2rem] bg-transparent",
        )}
      >
        <div className="px-9 pb-2 pt-28 sm:pt-32">
          <input
            aria-label="Título do documento"
            className="w-full bg-transparent text-[2rem] font-semibold leading-[1.02] text-slate-950 outline-none placeholder:text-slate-300/95 sm:text-[2.6rem]"
            onChange={(event) => onTitleChange(event.target.value)}
            placeholder="Título do documento"
            value={title}
          />
        </div>

        <EditorContent editor={editor} />

        <BibliographySection references={references} />
      </div>

      <AnimatePresence>
        <ReferenceTooltip reference={hoveredReference} />
      </AnimatePresence>
    </div>
  );
}

function BibliographySection({ references }: { references: ReferenceItem[] }) {
  return (
    <section className="border-t border-slate-200/70 px-9 pb-12 pt-8">
      <div className="mx-auto max-w-4xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">
          Bibliografia derivada
        </p>
        <h2 className="mt-2 text-xl font-semibold text-slate-900">
          Referências
        </h2>

        {references.length === 0 ? (
          <p className="mt-4 text-sm leading-6 text-slate-400">
            As referências aparecem aqui conforme trechos vinculados forem
            usados no texto.
          </p>
        ) : (
          <div className="mt-5 space-y-4">
            {references.map((reference, index) => (
              <article
                key={reference.bibliographyId}
                className="rounded-[1rem] border border-slate-200/80 bg-white/75 px-4 py-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-xs font-semibold text-workspace-write-700">
                    {reference.citation}
                  </p>
                  <span className="text-xs text-slate-400">{index + 1}</span>
                </div>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {reference.bibliographyEntry}
                </p>
                {reference.sourceLabel || reference.sourceUrl ? (
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    {[reference.sourceLabel, reference.sourceUrl]
                      .filter(Boolean)
                      .join(" · ")}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
