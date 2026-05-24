import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/cn";

export type HoveredReference = {
  bibliographyId: string;
  citation: string;
  sourceLabel?: string;
  sourceUrl?: string;
  x: number;
  y: number;
};

type ReferenceTooltipProps = {
  reference: HoveredReference | null;
};

export function ReferenceTooltip({ reference }: ReferenceTooltipProps) {
  if (!reference) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      transition={{ duration: 0.16, ease: "easeOut" }}
      className="pointer-events-none fixed z-50 w-72 max-w-[calc(100vw-3rem)]"
      style={{
        left: reference.x,
        top: reference.y,
        transform: "translate(-50%, calc(-100% - 12px))",
      }}
    >
      <div className="bg-white/96 rounded-[0.95rem] border border-slate-200/90 px-3.5 py-3 shadow-panel-soft backdrop-blur-sm">
        <p className="text-[11px] font-semibold uppercase tracking-[0.08em] text-workspace-write-700">
          Referencia
        </p>
        <p className="mt-1 text-sm font-medium leading-5 text-slate-900">
          {reference.citation}
        </p>
        <p className="mt-1.5 text-xs leading-5 text-slate-500">
          {reference.sourceLabel || "Fonte vinculada ao trecho"}
        </p>
        {reference.sourceUrl ? (
          <p className="mt-1 inline-flex max-w-full items-center gap-1 text-xs font-medium text-workspace-write-700">
            <span className="truncate">{reference.sourceUrl}</span>
            <ExternalLink className="h-3 w-3 shrink-0" strokeWidth={1.9} />
          </p>
        ) : null}
        <p className={cn("mt-2 text-[11px] font-medium text-slate-400")}>
          Clique para abrir a referencia
        </p>
      </div>
    </motion.div>
  );
}
