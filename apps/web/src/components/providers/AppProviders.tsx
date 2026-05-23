"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Locale, Messages } from "@/i18n/locale";

type I18nContextValue = {
  locale: Locale;
  messages: Messages;
};

const I18nContext = createContext<I18nContextValue | null>(null);

type AppProvidersProps = I18nContextValue & {
  children: ReactNode;
};

export function AppProviders({
  children,
  locale,
  messages,
}: AppProvidersProps) {
  return (
    <I18nContext.Provider value={{ locale, messages }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);

  if (!context) {
    throw new Error("useI18n must be used within AppProviders.");
  }

  return context;
}
