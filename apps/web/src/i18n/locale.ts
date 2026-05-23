export const locales = ["pt", "en"] as const;
export const defaultLocale = "pt";

export type Locale = (typeof locales)[number];

export type Messages = {
  metadata: {
    title: string;
    description: string;
  };
  workspace: {
    lab: string;
    write: string;
  };
};

export function isLocale(value: string): value is Locale {
  return locales.includes(value as Locale);
}
