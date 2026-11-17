import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// latin-ext: ş, ğ, ı, İ gibi Türkçe karakterler için gerekli
const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  title: "Kitty – Ortak Harcama",
  description:
    "Ev arkadaşları, aileler ve arkadaş grupları için ortak harcama ve bütçe uygulaması.",
};

// Telefonda sayfanın doğru ölçeklenmesi için
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0f766e",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr">
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
