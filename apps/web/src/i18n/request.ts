import type { Locale, Messages } from "./locale";
import { en } from "./messages/en";
import { pt } from "./messages/pt";

const messagesByLocale: Record<Locale, Messages> = {
  en,
  pt,
};

export async function getMessages(locale: Locale) {
  return messagesByLocale[locale];
}
