const gunBicimi = new Intl.DateTimeFormat("tr-TR", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

export function formatGun(tarih: string): string {
  return gunBicimi.format(new Date(`${tarih}T00:00:00Z`));
}

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

export function bugunIstanbul(simdi: Date = new Date()): string {
  return simdi.toLocaleDateString("en-CA", { timeZone: "Europe/Istanbul" });
}
