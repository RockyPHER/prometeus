import { motion } from "framer-motion";
import type { Tool } from "@prometeus/core";
import { getIcon } from "@/lib/icons";
import { cn } from "@/lib/cn";
import { getToolAccentTheme } from "@/theme/semantic";

type ToolBubbleProps = {
  index: number;
  tool: Tool;
  isSelected: boolean;
  onClick: () => void;
};

export function ToolBubble({
  index,
  tool,
  isSelected,
  onClick,
}: ToolBubbleProps) {
  const Icon = getIcon(tool.iconName);
  const accent = getToolAccentTheme(tool.accentColor);

  return (
    <motion.button
      type="button"
      onClick={onClick}
      className={cn(
        "group flex min-h-32 w-24 flex-col items-center rounded-[1.25rem] text-center focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-4 focus-visible:ring-offset-slate-50",
        accent.buttonFocus,
      )}
      custom={index}
      variants={{
        hidden: {
          opacity: 0,
          x: 18,
          y: 20,
          scale: 0.94,
        },
        visible: (itemIndex: number) => ({
          opacity: 1,
          x: 0,
          y: 0,
          scale: 1,
          transition: {
            delay: itemIndex * 0.025,
            type: "spring",
            stiffness: 240,
            damping: 24,
          },
        }),
      }}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 260, damping: 22 }}
    >
      <span
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-full border bg-white shadow-sm transition duration-200",
          accent.bubble,
          isSelected && "ring-4",
          isSelected && accent.selected,
        )}
      >
        <span>
          <Icon
            className={cn("h-[18px] w-[18px]", accent.icon)}
            strokeWidth={1.65}
          />
        </span>
      </span>

      <span
        className={cn(
          "mt-3 text-xs font-semibold transition duration-200",
          isSelected
            ? accent.label
            : "text-slate-800 group-hover:text-slate-900",
        )}
      >
        {tool.name}
      </span>

      <span
        className={cn(
          "mt-1 min-h-8 max-w-24 text-[10px] leading-4 opacity-0 transition duration-300 group-hover:opacity-100",
          isSelected ? accent.description : "text-slate-500",
        )}
      >
        {tool.description}
      </span>
    </motion.button>
  );
}
