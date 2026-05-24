import { motion } from "framer-motion";
import { Library, X } from "lucide-react";
import { cn } from "@/lib/cn";
import type { WriterReference } from "@/features/write/document/writerDocument";

type ReferencesPanelProps = {
  focusedReferenceId: string | null;
  onClose: () => void;
  references: WriterReference[];
  registerReference: (id: string, element: HTMLElement | null) => void;
};

export function ReferencesPanel({
  focusedReferenceId,
  onClose,
  references,
  registerReference,
}: ReferencesPanelProps) {
  return (
    <motion.aside
      initial={{ opacity: 0, x: 28, scale: 0.985 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 22, scale: 0.99 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className="absolute inset-y-3 right-3 z-30 flex w-[min(23rem,calc(100%-1.5rem))] flex-col overflow-hidden rounded-[1.2rem] border border-slate-200/80 bg-surface-reference-panel shadow-panel-side backdrop-blur"
    >
      <div className="flex h-14 items-center justify-between border-b border-slate-200/70 px-4">
        <div className="flex items-center gap-2">
          <Library
            className="h-4 w-4 text-workspace-write-700"
            strokeWidth={1.9}
          />
          <span className="text-sm font-semibold text-slate-900">
            Referencias
          </span>
        </div>
        <button
          type="button"
          aria-label="Fechar referencias"
          title="Fechar referencias"
          onClick={onClose}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full text-slate-400 transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-300/70"
        >
          <X className="h-4 w-4" strokeWidth={1.9} />
        </button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4">
        {references.length === 0 ? (
          <div className="flex h-full min-h-52 flex-col items-center justify-center gap-3 rounded-[1rem] border border-dashed border-slate-200/80 bg-slate-50/80 px-6 text-center">
            <Library className="h-6 w-6 text-slate-300" strokeWidth={1.8} />
            <p className="text-sm text-slate-400">
              As referencias citadas no texto aparecem aqui.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {references.map((reference, index) => (
              <article
                key={reference.bibliographyId}
                ref={(element) =>
                  registerReference(reference.bibliographyId, element)
                }
                className={cn(
                  "rounded-[1rem] border px-4 py-4 transition duration-300",
                  focusedReferenceId === reference.bibliographyId
                    ? "border-workspace-write-300 bg-workspace-write-50/90 shadow-accent-hover"
                    : "bg-white/76 border-slate-200/80 hover:bg-white",
                )}
              >
                <div className="flex items-start justify-between gap-4">
                  <span className="text-xs font-semibold text-workspace-write-700">
                    {reference.citation}
                  </span>
                  <span className="shrink-0 text-xs text-slate-400">
                    {index + 1}
                  </span>
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
    </motion.aside>
  );
}
