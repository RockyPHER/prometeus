import type { HTMLAttributes } from "react";
import { badgeToneClasses, type BadgeTone } from "@/theme/semantic";

export type BadgeProps = HTMLAttributes<HTMLSpanElement> & {
  tone?: BadgeTone;
};

export function Badge({ className, tone = "neutral", ...props }: BadgeProps) {
  return (
    <span
      className={[
        "inline-flex h-8 items-center rounded-full border px-3 text-xs font-medium",
        badgeToneClasses[tone],
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    />
  );
}
