import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

// latin-ext: ş, ğ, ı, İ gibi Türkçe karakterler için gerekli
const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
  // Önizleme görseli gibi tam adres gereken yerler için sitenin adresi
  metadataBase: new URL("https://kitty-app-gamma.vercel.app"),
  title: "Kitty – Ortak Harcama",
  description:
    "Ev arkadaşları, aileler ve arkadaş grupları için ortak harcama ve bütçe uygulaması.",
  applicationName: "Kitty",
  openGraph: {
    title: "Kitty – Ortak Harcama",
    description: "Harcamaları gir, kim kime ne kadar borçlu Kitty hesaplasın.",
    siteName: "Kitty",
    locale: "tr_TR",
    type: "website",
  },
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
