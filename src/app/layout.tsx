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

// Telefonda sayfanın doğru ölçeklenmesi + tarayıcı çubuğunun rengi (açık/koyu)
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#0f766e" },
    { media: "(prefers-color-scheme: dark)", color: "#0f0f0f" },
  ],
};

// Sayfa çizilmeden ÖNCE çalışır: kayıtlı temayı (ya da sistem tercihini) uygular.
// Böylece koyu modda açılışta beyaz bir an "parlamaz".
const temaBetigi = `(function(){try{var t=localStorage.getItem("kitty-tema");var k=t==="koyu"||(t!=="acik"&&window.matchMedia("(prefers-color-scheme: dark)").matches);document.documentElement.classList.toggle("dark",k)}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: "dark" sınıfını betik ekliyor, React'ın uyarmasına gerek yok
    <html lang="tr" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: temaBetigi }} />
      </head>
      <body className={`${inter.className} antialiased`}>{children}</body>
    </html>
  );
}
