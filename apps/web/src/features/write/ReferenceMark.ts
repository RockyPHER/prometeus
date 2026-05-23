import { Mark, mergeAttributes } from "@tiptap/core";
import type { ReferenceMarkAttributes } from "@/features/write/noteInsertion";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    referenceMark: {
      setReferenceMark: (attributes: ReferenceMarkAttributes) => ReturnType;
      unsetReferenceMark: () => ReturnType;
    };
  }
}

export const ReferenceMark = Mark.create({
  name: "referenceMark",
  inclusive: true,

  addAttributes() {
    return {
      noteId: {
        default: null,
      },
      sourceId: {
        default: null,
      },
      bibliographyId: {
        default: null,
      },
      citation: {
        default: null,
      },
      bibliographyEntry: {
        default: null,
      },
      sourceLabel: {
        default: null,
      },
      sourceUrl: {
        default: null,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: "span[data-reference-mark]",
      },
    ];
  },

  renderHTML({ HTMLAttributes }: { HTMLAttributes: Record<string, unknown> }) {
    return [
      "span",
      mergeAttributes(HTMLAttributes, {
        "data-reference-mark": "true",
        "data-note-id": HTMLAttributes.noteId,
        "data-bibliography-id": HTMLAttributes.bibliographyId,
        "data-citation": HTMLAttributes.citation,
        "data-source-label": HTMLAttributes.sourceLabel,
        "data-source-url": HTMLAttributes.sourceUrl,
        class:
          "prometeus-reference-mark cursor-pointer rounded-[0.35rem] px-0.5 py-[0.05rem] transition-colors",
      }),
      0,
    ];
  },

  addCommands() {
    return {
      setReferenceMark:
        (attributes) =>
        ({
          commands,
        }: {
          commands: {
            setMark: (name: string, attrs: ReferenceMarkAttributes) => boolean;
          };
        }) =>
          commands.setMark(this.name, attributes),
      unsetReferenceMark:
        () =>
        ({
          commands,
        }: {
          commands: { unsetMark: (name: string) => boolean };
        }) =>
          commands.unsetMark(this.name),
    };
  },
});
