export const FIS_EN_BUYUK_KENAR = 1600;
export const FIS_EN_BUYUK_BOYUT = 1024 * 1024;
export const FIS_TURLERI = ["image/jpeg", "image/png", "image/webp"] as const;

export function hedefBoyut(
  genislik: number,
  yukseklik: number,
  enBuyuk: number = FIS_EN_BUYUK_KENAR,
): { genislik: number; yukseklik: number } {
  if (genislik <= 0 || yukseklik <= 0) throw new Error("Geçersiz görsel boyutu");
  const oran = Math.min(1, enBuyuk / Math.max(genislik, yukseklik));
  return {
    genislik: Math.max(1, Math.round(genislik * oran)),
    yukseklik: Math.max(1, Math.round(yukseklik * oran)),
  };
}

export function fisTuruGecerli(tur: string): boolean {
  return (FIS_TURLERI as readonly string[]).includes(tur);
}

export function fisYolu(
  grupId: string,
  harcamaId: string,
  dosyaId: string,
  tur: string,
): string {
  const uzanti = tur === "image/png" ? "png" : tur === "image/webp" ? "webp" : "jpg";
  return `${grupId}/${harcamaId}/${dosyaId}.${uzanti}`;
}
