// Ay her yerde "YYYY-MM" metniyle temsil edilir: "2026-11"
// Date nesnesi kullanmıyoruz → saat dilimi kayması yok.

const AY_KALIBI = /^(\d{4})-(0[1-9]|1[0-2])$/;

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

// "2026-11-21" → "2026-11"
export function buAy(bugun: string): string {
  return bugun.slice(0, 7);
}

// Adresten gelen değeri doğrular. Geçersizse varsayılan ay döner.
// unknown: searchParams'tan string, string[] ya da undefined gelebilir.
export function ayCozumle(deger: unknown, varsayilan: string): string {
  if (typeof deger !== "string" || !AY_KALIBI.test(deger)) return varsayilan;
  const yil = Number(deger.slice(0, 4));
  if (yil < 2000 || yil > 2100) return varsayilan;
  return deger;
}

// "2026-12", +1 → "2027-01"   |   "2026-01", -1 → "2025-12"
export function ayKaydir(ay: string, fark: number): string {
  const [yil, ayNo] = ay.split("-").map(Number);
  const toplam = yil * 12 + (ayNo - 1) + fark; // aylara çevir, ekle
  const yeniYil = Math.floor(toplam / 12);
  const yeniAy = (toplam % 12) + 1;
  return `${yeniYil}-${String(yeniAy).padStart(2, "0")}`;
}

// "2026-11" → "2026-11-01" (veritabanı fonksiyonuna gönderilecek gün)
export function ayinIlkGunu(ay: string): string {
  return `${ay}-01`;
}

// "2026-11" → "Kasım 2026"
export function ayAdi(ay: string): string {
  const [yil, ayNo] = ay.split("-").map(Number);
  return `${AY_ADLARI[ayNo - 1]} ${yil}`;
}