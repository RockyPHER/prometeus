import type { HTMLAttributes } from "react";

export type GlassPanelProps = HTMLAttributes<HTMLDivElement>;

export function GlassPanel({ className, ...props }: GlassPanelProps) {
  return (
    <div
      className={[
        "border border-white/60 bg-white/55 shadow-lg shadow-slate-200/60 backdrop-blur-xl",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
