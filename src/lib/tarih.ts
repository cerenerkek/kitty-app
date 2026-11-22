// Tarih yardımcıları. Saatsiz günler "YYYY-MM-DD" metni olarak tutulur.

// "2026-11-19" → "19 Kas"
// Gün saatsiz: UTC'de okuyup UTC'de yazıyoruz → saat dilimi kayması yok
const gunBicimi = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatGun(tarih: string): string {
  return gunBicimi.format(new Date(`${tarih}T00:00:00Z`));
}

// Zaman damgası (timestamptz) → İstanbul saatiyle "22 Kas 14:05"
const anBicimi = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: "Europe/Istanbul",
});

export function formatAn(zaman: string): string {
  return anBicimi.format(new Date(zaman));
}

// Şu anın İstanbul'daki tarihi: "2026-11-21"
// Sunucu UTC'de çalışır; gece 00:00–03:00 arası UTC'ye göre hâlâ "dün"dür.
// simdi parametresi testler için: belirli bir anı verip sonucu kontrol edebiliyoruz.
export function bugunIstanbul(simdi: Date = new Date()): string {
  return simdi.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}
