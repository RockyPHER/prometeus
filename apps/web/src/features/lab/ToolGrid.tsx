import { motion } from "framer-motion";
import type { Tool } from "@prometeus/core";
import { ToolBubble } from "@/features/lab/ToolBubble";

type ToolGridProps = {
  tools: Tool[];
  selectedToolId?: string;
  onSelectTool: (tool: Tool) => void;
};

export function ToolGrid({
  tools,
  selectedToolId,
  onSelectTool,
}: ToolGridProps) {
  if (tools.length === 0) {
    return (
      <div className="flex min-h-64 items-center justify-center text-sm text-slate-500">
        No tools found
      </div>
    );
  }

  return (
    <motion.div
      className="flex w-full max-w-4xl flex-wrap items-start justify-start gap-6 pt-14"
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delayChildren: 0.12,
            staggerChildren: 0.08,
          },
        },
      }}
    >
      {tools.map((tool, index) => (
        <ToolBubble
          key={tool.id}
          index={index}
          tool={tool}
          isSelected={selectedToolId === tool.id}
          onClick={() => onSelectTool(tool)}
        />
      ))}
    </motion.div>
  );
}
