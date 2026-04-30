import type { Metadata } from "next";
import "./globals.css";
import ConditionalHeader from "@/app/components/ConditionalHeader";

export const metadata: Metadata = {
  title: "PLUEPE",
  description: "TOPIK · EPS-TOPIK 한국어 학습 플랫폼",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        <ConditionalHeader />
        {children}
      </body>
    </html>
  );
}
