import type { Config } from "tailwindcss";
import { webColors, withAlpha } from "./src/theme/colors";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    colors: webColors,
    extend: {
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      backgroundImage: {
        "surface-reference-panel": `linear-gradient(180deg, ${withAlpha(webColors.white, 0.97)} 0%, ${withAlpha(webColors.slate[50], 0.94)} 100%)`,
        "surface-stage": `radial-gradient(circle at top, ${withAlpha(webColors.slate[200], 0.45)}, transparent 42%), linear-gradient(180deg, ${webColors.slate[50]} 0%, ${webColors.ash[100]} 100%)`,
        "surface-toolbar": `linear-gradient(180deg, ${withAlpha(webColors.white, 0.78)} 0%, ${withAlpha(webColors.slate[50], 0.92)} 100%)`,
        "surface-write-preview": `linear-gradient(180deg, ${withAlpha(webColors.slate[50], 0.82)} 0%, ${withAlpha(webColors.slate[100], 0.66)} 100%)`,
        "surface-write-shell": `linear-gradient(180deg, ${withAlpha(webColors.white, 0.98)} 0%, ${withAlpha(webColors.slate[50], 0.96)} 100%)`,
      },
      boxShadow: {
        accent: `0 6px 18px ${withAlpha(webColors.teal[600], 0.08)}`,
        "accent-hover": `0 10px 24px ${withAlpha(webColors.teal[600], 0.08)}`,
        "accent-strong": `0 12px 34px ${withAlpha(webColors.teal[600], 0.12)}`,
        "accent-wide": `0 24px 65px ${withAlpha(webColors.teal[600], 0.12)}`,
        "dot-ring": `0 0 0 10px ${withAlpha(webColors.slate[200], 0.18)}`,
        "inset-soft": `inset 0 1px 0 ${withAlpha(webColors.white, 0.9)}`,
        panel: `0 8px 30px ${withAlpha(webColors.slate[900], 0.05)}`,
        "panel-float": `0 10px 30px ${withAlpha(webColors.slate[900], 0.06)}`,
        "panel-hover": `0 12px 34px ${withAlpha(webColors.slate[900], 0.08)}`,
        "panel-preview": `0 10px 24px ${withAlpha(webColors.slate[900], 0.08)}`,
        "panel-side": `-18px 0 40px ${withAlpha(webColors.slate[900], 0.08)}`,
        "panel-soft": `0 8px 20px ${withAlpha(webColors.slate[900], 0.05)}`,
        "panel-wide": `0 18px 60px ${withAlpha(webColors.slate[900], 0.05)}`,
      },
    },
  },
  plugins: [],
} satisfies Config;
