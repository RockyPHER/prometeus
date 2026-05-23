import { redirect } from "next/navigation";
import { defaultLocale } from "@/i18n/locale";

export default function RootPage() {
  redirect(`/${defaultLocale}`);
}
