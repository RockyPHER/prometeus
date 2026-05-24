import {
  Check,
  CircleDashed,
  Code2,
  Heading1,
  Heading2,
  Library,
  List,
  Minus,
  Pilcrow,
  Plus,
  Quote,
  RotateCcw,
} from "lucide-react";
import { cn } from "@/lib/cn";

export type SaveState = "saving" | "saved";

type WriteToolbarProps = {
  activeBlockType: "paragraph" | "heading" | "list" | "quote" | "code" | null;
  activeHeadingLevel: 1 | 2 | null;
  canFormat: boolean;
  isReferencesOpen: boolean;
  onToggleParagraphMarks: () => void;
  onResetZoom: () => void;
  onSetCode: () => void;
  onSetHeading1: () => void;
  onSetHeading2: () => void;
  onSetList: () => void;
  onSetQuote: () => void;
  onToggleReferences: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  pageCount: number;
  referenceCount: number;
  saveState: SaveState;
  showParagraphMarks: boolean;
  zoom: number;
  zoomCanDecrease: boolean;
  zoomCanIncrease: boolean;
};

export function WriteToolbar({
  activeBlockType,
  activeHeadingLevel,
  canFormat,
  isReferencesOpen,
  onToggleParagraphMarks,
  onResetZoom,
  onSetCode,
  onSetHeading1,
  onSetHeading2,
  onSetList,
  onSetQuote,
  onToggleReferences,
  onZoomIn,
  onZoomOut,
  pageCount,
  referenceCount,
  saveState,
  showParagraphMarks,
  zoom,
  zoomCanDecrease,
  zoomCanIncrease,
}: WriteToolbarProps) {
  return (
    <div className="pointer-events-none sticky top-4 z-30 flex justify-center px-4 pt-3 sm:px-6 sm:pt-3">
      <div
        aria-label="Ferramentas de escrita"
        className="bg-surface-toolbar/95 pointer-events-auto inline-flex flex-wrap items-center justify-center gap-1 rounded-[1.15rem] border border-slate-200/85 p-1.5 shadow-panel-float backdrop-blur-md"
        role="toolbar"
      >
        <ToolbarButton
          icon={<Pilcrow className="h-4 w-4" strokeWidth={1.9} />}
          isActive={showParagraphMarks}
          label="Marcas de paragrafo"
          onClick={onToggleParagraphMarks}
        />
        <ToolbarButton
          disabled={!canFormat}
          icon={<Heading1 className="h-4 w-4" strokeWidth={1.9} />}
          isActive={activeBlockType === "heading" && activeHeadingLevel === 1}
          label="Titulo 1"
          onClick={onSetHeading1}
        />
        <ToolbarButton
          disabled={!canFormat}
          icon={<Heading2 className="h-4 w-4" strokeWidth={1.9} />}
          isActive={activeBlockType === "heading" && activeHeadingLevel === 2}
          label="Titulo 2"
          onClick={onSetHeading2}
        />
        <ToolbarButton
          disabled={!canFormat}
          icon={<List className="h-4 w-4" strokeWidth={1.9} />}
          isActive={activeBlockType === "list"}
          label="Lista"
          onClick={onSetList}
        />
        <ToolbarButton
          disabled={!canFormat}
          icon={<Quote className="h-4 w-4" strokeWidth={1.9} />}
          isActive={activeBlockType === "quote"}
          label="Citacao"
          onClick={onSetQuote}
        />
        <ToolbarButton
          disabled={!canFormat}
          icon={<Code2 className="h-4 w-4" strokeWidth={1.9} />}
          isActive={activeBlockType === "code"}
          label="Codigo"
          onClick={onSetCode}
        />

        <span className="mx-1 hidden h-7 w-px rounded-full bg-slate-200 sm:inline-flex" />

        <ToolbarButton
          disabled={!zoomCanDecrease}
          icon={<Minus className="h-4 w-4" strokeWidth={2} />}
          isActive={false}
          label="Diminuir zoom"
          onClick={onZoomOut}
        />
        <ToolbarValueButton
          label={`Zoom atual ${zoom}%`}
          onClick={onResetZoom}
          value={`${zoom}%`}
        />
        <ToolbarButton
          disabled={!zoomCanIncrease}
          icon={<Plus className="h-4 w-4" strokeWidth={2} />}
          isActive={false}
          label="Aumentar zoom"
          onClick={onZoomIn}
        />
        <ToolbarButton
          icon={<RotateCcw className="h-4 w-4" strokeWidth={1.9} />}
          isActive={zoom === 100}
          label="Redefinir zoom"
          onClick={onResetZoom}
        />

        <span className="mx-1 hidden h-7 w-px rounded-full bg-slate-200 sm:inline-flex" />

        <ToolbarValueButton
          label={`Total de paginas ${pageCount}`}
          onClick={onResetZoom}
          value={`${pageCount} pg.`}
        />
        <ToolbarButton
          badge={referenceCount > 0 ? String(referenceCount) : undefined}
          icon={<Library className="h-4 w-4" strokeWidth={1.9} />}
          isActive={isReferencesOpen}
          label={
            referenceCount > 0
              ? `Referencias (${referenceCount})`
              : "Referencias"
          }
          onClick={onToggleReferences}
        />
        <ToolbarButton
          icon={
            saveState === "saved" ? (
              <Check className="h-4 w-4" strokeWidth={2.1} />
            ) : (
              <CircleDashed className="h-4 w-4" strokeWidth={1.9} />
            )
          }
          isActive={saveState === "saved"}
          isStatus
          label={saveState === "saved" ? "Salvo localmente" : "Salvando"}
          onClick={() => undefined}
        />
      </div>
    </div>
  );
}

type ToolbarButtonProps = {
  badge?: string;
  disabled?: boolean;
  icon: React.ReactNode;
  isActive: boolean;
  isStatus?: boolean;
  label: string;
  onClick: () => void;
};

function ToolbarButton({
  badge,
  disabled = false,
  icon,
  isActive,
  isStatus = false,
  label,
  onClick,
}: ToolbarButtonProps) {
  const isVisuallyActive = !disabled && !isStatus && isActive;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={!isStatus ? isActive : undefined}
      disabled={isStatus || disabled}
      onMouseDown={(event) => {
        if (isStatus || disabled) {
          return;
        }

        event.preventDefault();
      }}
      onClick={onClick}
      title={label}
      className={cn(
        "relative inline-flex h-9 w-9 items-center justify-center rounded-[0.8rem] text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300/60",
        isVisuallyActive
          ? "bg-white text-workspace-write-700 shadow-panel-soft ring-1 ring-workspace-write-100/90"
          : "text-slate-500 hover:bg-white/75 hover:text-slate-800",
        isStatus ? "cursor-default disabled:opacity-100" : "",
        disabled && !isStatus
          ? "cursor-not-allowed bg-transparent text-slate-300 shadow-none ring-0 hover:bg-transparent hover:text-slate-300 disabled:opacity-100"
          : "",
      )}
    >
      {icon}
      {badge ? (
        <span className="absolute -right-1 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-workspace-write-600 px-1 text-[9px] font-semibold leading-none text-white">
          {badge}
        </span>
      ) : null}
    </button>
  );
}

function ToolbarValueButton({
  label,
  onClick,
  value,
}: {
  label: string;
  onClick: () => void;
  value: string;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onMouseDown={(event) => event.preventDefault()}
      onClick={onClick}
      title={label}
      className="inline-flex h-9 min-w-[4.1rem] items-center justify-center rounded-[0.8rem] px-2.5 text-[12px] font-semibold text-slate-600 transition duration-200 hover:bg-white/75 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-300/60"
    >
      {value}
    </button>
  );
}
