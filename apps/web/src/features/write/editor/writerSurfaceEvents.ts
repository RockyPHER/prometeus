import type {
  RichTextContent,
  WriterSelection,
} from "@/features/write/document/writerDocument";

export type WriterSurfaceEventCause =
  | "input"
  | "focus"
  | "pointer"
  | "keyboard"
  | "paste"
  | "deleteBackward"
  | "deleteForward"
  | "enter";

export type WriterSurfaceSelectionEvent = {
  anchorOffset: number;
  affinity?: WriterSelection["affinity"];
  blockId: string;
  cause: WriterSurfaceEventCause;
  focusOffset: number;
};

export type WriterSurfaceEditEvent = {
  anchorOffset: number;
  affinity?: WriterSelection["affinity"];
  blockId: string;
  cause: WriterSurfaceEventCause;
  content: RichTextContent;
  focusOffset: number;
};
