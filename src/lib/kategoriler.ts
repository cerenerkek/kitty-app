export const KATEGORILER = [
  { kod: "market", ad: "Market" },
  { kod: "fatura", ad: "Fatura" },
  { kod: "kira", ad: "Kira" },
  { kod: "ulasim", ad: "Ulaşım" },
  { kod: "yemek", ad: "Yemek" },
  { kod: "eglence", ad: "Eğlence" },
  { kod: "diger", ad: "Diğer" },
] as const;

export type KategoriKodu = (typeof KATEGORILER)[number]["kod"];

export const KATEGORI_KODLARI = KATEGORILER.map((k) => k.kod) as [
  KategoriKodu,
  ...KategoriKodu[],
];

export function kategoriBilgisi(kod: string) {
  return KATEGORILER.find((k) => k.kod === kod) ?? KATEGORILER[6];
}