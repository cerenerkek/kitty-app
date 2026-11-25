import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin", "latin-ext"] });

export const metadata: Metadata = {
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

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#313076" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

const temaBetigi = `(function(){try{var t=localStorage.getItem("kitty-tema");var k=t==="koyu"||(t!=="acik"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",k);if(localStorage.getItem("kitty-kenar")==="dar")document.documentElement.dataset.kenar="dar"}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaBetigi }} />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
