import type { ReactNode } from "react";
import "@/styles/index.css";

type RootLayoutProps = {
  children: ReactNode;
};

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="pt">
      <body>{children}</body>
    </html>
  );
}
