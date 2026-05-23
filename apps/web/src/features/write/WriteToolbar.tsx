import type { Editor } from "@tiptap/react";
import type { ReactNode } from "react";
import {
  Bold,
  Check,
  CircleDashed,
  Code2,
  Heading1,
  Heading2,
  Italic,
  Library,
  Link2,
  List,
  ListOrdered,
  Quote,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { SaveState } from "@/features/write/types";

type WriteToolbarProps = {
  editor: Editor | null;
  isReferencesOpen: boolean;
  onToggleReferences: () => void;
  referenceCount: number;
  saveState: SaveState;
};

export function WriteToolbar({
  editor,
  isReferencesOpen,
  onToggleReferences,
  referenceCount,
  saveState,
}: WriteToolbarProps) {
  return (
    <div className="pointer-events-none fixed left-1/2 top-[5.6rem] z-40 w-[min(calc(100vw-2rem),56rem)] -translate-x-1/2 px-2">
      <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-3 rounded-[1.15rem] border border-slate-200/85 bg-surface-toolbar px-3 py-3 shadow-panel-float backdrop-blur-md sm:px-4">
        <div
          aria-label="Ferramentas de escrita"
          className="inline-flex flex-wrap rounded-[0.95rem] border border-slate-200/80 bg-slate-100/80 p-1 shadow-inset-soft"
          role="toolbar"
        >
          <ToolbarButton
            icon={<Bold className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("bold") ?? false}
            label="Negrito"
            onClick={() => editor?.chain().focus().toggleBold().run()}
          />
          <ToolbarButton
            icon={<Italic className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("italic") ?? false}
            label="Itálico"
            onClick={() => editor?.chain().focus().toggleItalic().run()}
          />
          <ToolbarButton
            icon={<Heading1 className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("heading", { level: 1 }) ?? false}
            label="Título 1"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 1 }).run()
            }
          />
          <ToolbarButton
            icon={<Heading2 className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("heading", { level: 2 }) ?? false}
            label="Título 2"
            onClick={() =>
              editor?.chain().focus().toggleHeading({ level: 2 }).run()
            }
          />
          <ToolbarButton
            icon={<List className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("bulletList") ?? false}
            label="Lista"
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
          />
          <ToolbarButton
            icon={<ListOrdered className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("orderedList") ?? false}
            label="Lista ordenada"
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          />
          <ToolbarButton
            icon={<Quote className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("blockquote") ?? false}
            label="Citação"
            onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          />
          <ToolbarButton
            icon={<Code2 className="h-4 w-4" strokeWidth={1.9} />}
            isActive={
              editor?.isActive("code") || editor?.isActive("codeBlock") || false
            }
            label="Código"
            onClick={() => toggleCode(editor)}
          />
          <ToolbarButton
            icon={<Link2 className="h-4 w-4" strokeWidth={1.9} />}
            isActive={editor?.isActive("link") ?? false}
            label="Link"
            onClick={() => setLink(editor)}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Referências"
            title="Referências"
            onClick={onToggleReferences}
            className={cn(
              "relative inline-flex h-9 items-center gap-2 rounded-full border px-3.5 text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300/60",
              isReferencesOpen
                ? "border-workspace-write-200/90 bg-workspace-write-50/90 text-workspace-write-700 shadow-accent"
                : "border-slate-200/80 bg-white/75 text-slate-600 hover:border-slate-300 hover:bg-white hover:text-slate-800",
            )}
          >
            <Library className="h-4 w-4" strokeWidth={1.9} />
            <span>Referências</span>
            {referenceCount ? (
              <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1.5 text-[11px] font-semibold leading-none text-workspace-write-700 ring-1 ring-workspace-write-100/90">
                {referenceCount}
              </span>
            ) : null}
          </button>

          <span className="inline-flex h-9 items-center gap-2 rounded-full border border-slate-200/80 bg-white/70 px-3 text-xs font-medium text-slate-600">
            {saveState === "saved" ? (
              <Check
                className="h-3.5 w-3.5 text-workspace-write-600"
                strokeWidth={2.1}
              />
            ) : (
              <CircleDashed
                className="h-3.5 w-3.5 text-slate-400"
                strokeWidth={1.9}
              />
            )}
            <span>
              {saveState === "saved" ? "Salvo localmente" : "Rascunho"}
            </span>
          </span>
        </div>
      </div>
    </div>
  );
}

type ToolbarButtonProps = {
  icon: ReactNode;
  isActive: boolean;
  label: string;
  onClick: () => void;
};

function ToolbarButton({ icon, isActive, label, onClick }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      onClick={onClick}
      className={cn(
        "inline-flex h-9 w-9 items-center justify-center rounded-[0.7rem] text-sm font-medium transition duration-200 focus:outline-none focus:ring-2 focus:ring-slate-300/60",
        isActive
          ? "bg-white text-workspace-write-700 shadow-panel-soft ring-1 ring-workspace-write-100/90"
          : "text-slate-500 hover:bg-white/75 hover:text-slate-800",
      )}
    >
      {icon}
    </button>
  );
}

function toggleCode(editor: Editor | null) {
  if (!editor) {
    return;
  }

  if (editor.state.selection.empty) {
    editor.chain().focus().toggleCodeBlock().run();
    return;
  }

  editor.chain().focus().toggleCode().run();
}

function setLink(editor: Editor | null) {
  if (!editor) {
    return;
  }

  const previousUrl = editor.getAttributes("link").href as string | undefined;
  const url = window.prompt("Cole a URL do link", previousUrl ?? "https://");

  if (url === null) {
    return;
  }

  if (!url.trim()) {
    editor.chain().focus().unsetLink().run();
    return;
  }

  editor
    .chain()
    .focus()
    .extendMarkRange("link")
    .setLink({ href: url.trim() })
    .run();
}
