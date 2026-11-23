export type Bakiye = {
  id: string;
  net: number;
};

export type Odeme = {
  kimden: string;
  kime: string;
  tutar: number;
};

export function odemeleriHesapla(bakiyeler: Bakiye[]): Odeme[] {
  for (const b of bakiyeler) {
    if (!Number.isInteger(b.net)) {
      throw new Error(`Bakiye tam sayı (kuruş) olmalı: ${b.net}`);
    }
  }
  const toplam = bakiyeler.reduce((t, b) => t + b.net, 0);
  if (toplam !== 0) {
    throw new Error(`Bakiyelerin toplamı 0 olmalı, ${toplam} geldi`);
  }

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

  const odemeler: Odeme[] = [];
  let i = 0;
  let j = 0;

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
