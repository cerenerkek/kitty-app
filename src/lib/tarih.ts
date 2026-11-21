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

// Şu anın İstanbul'daki tarihi: "2026-11-21"
// Sunucu UTC'de çalışır; gece 00:00–03:00 arası UTC'ye göre hâlâ "dün"dür.
// simdi parametresi testler için: belirli bir anı verip sonucu kontrol edebiliyoruz.
export function bugunIstanbul(simdi: Date = new Date()): string {
  return simdi.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}
