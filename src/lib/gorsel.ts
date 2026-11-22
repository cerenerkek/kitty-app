// Fiş görselleri için saf yardımcılar (tarayıcıya da sunucuya da bağımlı değil → test edilebilir)

export const FIS_EN_BUYUK_KENAR = 1600; // px: fiş yazıları okunur kalsın, dosya küçülsün
export const FIS_EN_BUYUK_BOYUT = 1024 * 1024; // 1 MB (Storage klasörünün sınırıyla aynı)
export const FIS_TURLERI = ["image/jpeg", "image/png", "image/webp"] as const;

// Oranı koruyarak küçült; zaten küçükse büyütme.
// 4000×3000 → 1600×1200   |   3000×4000 → 1200×1600   |   800×600 → 800×600
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

// Dosya türü kabul ediliyor mu?
export function fisTuruGecerli(tur: string): boolean {
  return (FIS_TURLERI as readonly string[]).includes(tur);
}

// Storage'daki yol: "<grup>/<harcama>/<rastgele>.<uzantı>"
// İlk klasör grup id'si: Storage güvenlik kuralları buna bakıyor.
export function fisYolu(
  grupId: string,
  harcamaId: string,
  dosyaId: string,
  tur: string,
): string {
  const uzanti = tur === "image/png" ? "png" : tur === "image/webp" ? "webp" : "jpg";
  return `${grupId}/${harcamaId}/${dosyaId}.${uzanti}`;
}
