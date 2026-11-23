const TUTAR_KALIBI = /^\d{1,7}([.,]\d{1,2})?$/;

export function kurusaCevir(metin: string): number | null {
  const temiz = metin.trim().replace(/\s/g, "");
  if (!TUTAR_KALIBI.test(temiz)) return null;

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

export function kurusuMetneCevir(kurus: number): string {
  const lira = Math.floor(kurus / 100);
  const kalan = String(kurus % 100).padStart(2, "0");
  return `${lira},${kalan}`;
}