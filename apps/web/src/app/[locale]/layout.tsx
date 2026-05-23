import type { Metadata } from "next";
import type { ReactNode } from "react";
import { notFound } from "next/navigation";
import { AppProviders } from "@/components/providers/AppProviders";
import { getMessages } from "@/i18n/request";
import { isLocale, locales, type Locale } from "@/i18n/locale";

type LocaleLayoutProps = {
  children: ReactNode;
  params: {
    locale: string;
  };
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const locale = isLocale(params.locale) ? params.locale : "pt";
  const messages = await getMessages(locale);

  return {
    title: messages.metadata.title,
    description: messages.metadata.description,
  };
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  if (!isLocale(params.locale)) {
    notFound();
  }

  const locale = params.locale as Locale;
  const messages = await getMessages(locale);

  return (
    <AppProviders locale={locale} messages={messages}>
      {children}
    </AppProviders>
  );
}
