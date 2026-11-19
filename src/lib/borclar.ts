// "Kim kime ne kadar ödesin?" algoritması.
// Veritabanından gelen net bakiyeleri (kuruş) alır, ödeme listesi döndürür.
// Saf fonksiyon: veritabanı yok, ekran yok → kolayca test edilir.

export type Bakiye = {
  id: string;
  net: number; // kuruş. + alacaklı, − borçlu
};

export type Odeme = {
  kimden: string; // borçlu
  kime: string; // alacaklı
  tutar: number; // kuruş, her zaman > 0
};

export function odemeleriHesapla(bakiyeler: Bakiye[]): Odeme[] {
  // Güvenlik kontrolleri: kuruşlar tam sayı olmalı, toplam 0 olmalı
  for (const b of bakiyeler) {
    if (!Number.isInteger(b.net)) {
      throw new Error(`Bakiye tam sayı (kuruş) olmalı: ${b.net}`);
    }
  }
  const toplam = bakiyeler.reduce((t, b) => t + b.net, 0);
  if (toplam !== 0) {
    throw new Error(`Bakiyelerin toplamı 0 olmalı, ${toplam} geldi`);
  }

  // Kopyalarını alıyoruz → gelen diziyi asla değiştirmiyoruz
  const buyuktenKucuge = (a: { id: string; kalan: number }, b: { id: string; kalan: number }) =>
    b.kalan - a.kalan || a.id.localeCompare(b.id);

  const borclular = bakiyeler
    .filter((b) => b.net < 0)
    .map((b) => ({ id: b.id, kalan: -b.net }))
    .sort(buyuktenKucuge);

  const alacaklilar = bakiyeler
    .filter((b) => b.net > 0)
    .map((b) => ({ id: b.id, kalan: b.net }))
    .sort(buyuktenKucuge);

  // En büyük borçluyu en büyük alacaklıyla eşleştir.
  // Biri sıfırlanınca listede sıradakine geç.
  const odemeler: Odeme[] = [];
  let i = 0; // borçlu sırası
  let j = 0; // alacaklı sırası

  while (i < borclular.length && j < alacaklilar.length) {
    const borclu = borclular[i];
    const alacakli = alacaklilar[j];
    const tutar = Math.min(borclu.kalan, alacakli.kalan);

    odemeler.push({ kimden: borclu.id, kime: alacakli.id, tutar });

    borclu.kalan -= tutar;
    alacakli.kalan -= tutar;
    if (borclu.kalan === 0) i++;
    if (alacakli.kalan === 0) j++;
  }

  return odemeler;
}
