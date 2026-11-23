export const KATEGORILER = [
  { kod: "market", ad: "Market", emoji: "🛒" },
  { kod: "fatura", ad: "Fatura", emoji: "💡" },
  { kod: "kira", ad: "Kira", emoji: "🏠" },
  { kod: "ulasim", ad: "Ulaşım", emoji: "🚌" },
  { kod: "yemek", ad: "Yemek", emoji: "🍽️" },
  { kod: "eglence", ad: "Eğlence", emoji: "🎉" },
  { kod: "diger", ad: "Diğer", emoji: "📦" },
] as const;

export type KategoriKodu = (typeof KATEGORILER)[number]["kod"];

export const KATEGORI_KODLARI = KATEGORILER.map((k) => k.kod) as [
  KategoriKodu,
  ...KategoriKodu[],
];

export function kategoriBilgisi(kod: string) {
  return KATEGORILER.find((k) => k.kod === kod) ?? KATEGORILER[6];
}