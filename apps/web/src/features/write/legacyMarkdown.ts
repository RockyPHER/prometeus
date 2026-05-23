import type { JSONContent } from "@tiptap/core";

export function markdownToInitialContent(markdown: string): JSONContent {
  const normalized = markdown.replace(/\r\n/g, "\n").trim();

  if (!normalized) {
    return {
      type: "doc",
      content: [
        {
          type: "paragraph",
        },
      ],
    };
  }

  const lines = normalized
    .split("\n")
    .filter(
      (line) =>
        !line.trim().startsWith("- ") || !looksLikeBibliographyLine(line),
    );
  const blocks: JSONContent[] = [];

  let index = 0;

  while (index < lines.length) {
    const line = lines[index];

    if (!line.trim()) {
      index += 1;
      continue;
    }

    if (/^#{1,6}\s/.test(line)) {
      const [, hashes, text] = line.match(/^(#{1,6})\s+(.*)$/) ?? [];

      blocks.push({
        type: "heading",
        attrs: { level: Math.min(hashes?.length ?? 1, 3) },
        content: text ? [{ type: "text", text }] : undefined,
      });
      index += 1;
      continue;
    }

    if (/^>\s?/.test(line)) {
      const quoteLines: string[] = [];

      while (index < lines.length && /^>\s?/.test(lines[index])) {
        quoteLines.push(lines[index].replace(/^>\s?/, ""));
        index += 1;
      }

      blocks.push({
        type: "blockquote",
        content: [
          {
            type: "paragraph",
            content: quoteLines.join(" ").trim()
              ? [{ type: "text", text: quoteLines.join(" ").trim() }]
              : undefined,
          },
        ],
      });
      continue;
    }

    if (/^```/.test(line)) {
      const codeLines: string[] = [];
      index += 1;

      while (index < lines.length && !/^```/.test(lines[index])) {
        codeLines.push(lines[index]);
        index += 1;
      }

      if (index < lines.length) {
        index += 1;
      }

      blocks.push({
        type: "codeBlock",
        content: codeLines.length
          ? [{ type: "text", text: codeLines.join("\n") }]
          : undefined,
      });
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items: JSONContent[] = [];

      while (index < lines.length && /^[-*]\s+/.test(lines[index])) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: lines[index].replace(/^[-*]\s+/, "") },
              ],
            },
          ],
        });
        index += 1;
      }

      blocks.push({
        type: "bulletList",
        content: items,
      });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items: JSONContent[] = [];

      while (index < lines.length && /^\d+\.\s+/.test(lines[index])) {
        items.push({
          type: "listItem",
          content: [
            {
              type: "paragraph",
              content: [
                { type: "text", text: lines[index].replace(/^\d+\.\s+/, "") },
              ],
            },
          ],
        });
        index += 1;
      }

      blocks.push({
        type: "orderedList",
        content: items,
      });
      continue;
    }

    const paragraphLines: string[] = [];

    while (index < lines.length && lines[index].trim()) {
      paragraphLines.push(lines[index]);
      index += 1;
    }

    blocks.push({
      type: "paragraph",
      content: [{ type: "text", text: paragraphLines.join(" ").trim() }],
    });
  }

  return {
    type: "doc",
    content: blocks.length
      ? blocks
      : [
          {
            type: "paragraph",
          },
        ],
  };
}

function looksLikeBibliographyLine(line: string) {
  return line.trim().length > 40;
}
