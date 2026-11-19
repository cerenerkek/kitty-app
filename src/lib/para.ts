// Para her yerde KURUŞ (tam sayı) olarak tutulur.
// Kullanıcı "450,50" yazar → biz 45050 saklarız → ekranda "₺450,50" gösteririz.

// 1–7 haneli lira, isteğe bağlı virgül/nokta ve 1–2 haneli kuruş
// Geçerli: "450", "450,5", "450,50", "450.50"   Geçersiz: "1.250,00", "abc", "-5"
const TUTAR_KALIBI = /^\d{1,7}([.,]\d{1,2})?$/;

export function kurusaCevir(metin: string): number | null {
  const temiz = metin.trim().replace(/\s/g, "");
  if (!TUTAR_KALIBI.test(temiz)) return null;

  // Ondalıklı sayıya HİÇ çevirmeden, metni ikiye bölerek hesaplıyoruz
  const [lira, kurus = ""] = temiz.split(/[.,]/);
  return Number(lira) * 100 + Number(kurus.padEnd(2, "0"));
}

const tlBicimi = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
});

export function formatTL(kurus: number): string {
  return tlBicimi.format(kurus / 100);
}