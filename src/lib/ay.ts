const AY_KALIBI = /^(\d{4})-(0[1-9]|1[0-2])$/;

const AY_ADLARI = [
  "Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran",
  "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık",
];

export function buAy(bugun: string): string {
  return bugun.slice(0, 7);
}

export function ayCozumle(deger: unknown, varsayilan: string): string {
  if (typeof deger !== "string" || !AY_KALIBI.test(deger)) return varsayilan;
  const yil = Number(deger.slice(0, 4));
  if (yil < 2000 || yil > 2100) return varsayilan;
  return deger;
}

export function ayKaydir(ay: string, fark: number): string {
  const [yil, ayNo] = ay.split("-").map(Number);
  const toplam = yil * 12 + (ayNo - 1) + fark;
  const yeniYil = Math.floor(toplam / 12);
  const yeniAy = (toplam % 12) + 1;
  return `${yeniYil}-${String(yeniAy).padStart(2, "0")}`;
}

export function ayinIlkGunu(ay: string): string {
  return `${ay}-01`;
}

export function ayAdi(ay: string): string {
  const [yil, ayNo] = ay.split("-").map(Number);
  return `${AY_ADLARI[ayNo - 1]} ${yil}`;
}