import { describe, expect, it } from "vitest";
import { odemeleriHesapla, type Bakiye, type Odeme } from "./borclar";

function uygula(bakiyeler: Bakiye[], odemeler: Odeme[]) {
  const son = new Map(bakiyeler.map((b) => [b.id, b.net]));
  for (const o of odemeler) {
    son.set(o.kimden, son.get(o.kimden)! + o.tutar);
    son.set(o.kime, son.get(o.kime)! - o.tutar);
  }
  return son;
}

describe("odemeleriHesapla", () => {
  it("boş grup → ödeme yok", () => {
    expect(odemeleriHesapla([])).toEqual([]);
  });

  it("herkes ödeşmiş → ödeme yok", () => {
    expect(
      odemeleriHesapla([
        { id: "ceren", net: 0 },
        { id: "aleyna", net: 0 },
      ]),
    ).toEqual([]);
  });

  it("iki kişi → tek ödeme", () => {
    expect(
      odemeleriHesapla([
        { id: "ceren", net: 50000 },
        { id: "aleyna", net: -50000 },
      ]),
    ).toEqual([{ kimden: "aleyna", kime: "ceren", tutar: 50000 }]);
  });

  it("canlıdaki gerçek örnek: 1000 ₺ + 690 ₺, 3 kişi", () => {
    const sonuc = odemeleriHesapla([
      { id: "ceren", net: 112667 },
      { id: "aleyna", net: -56333 },
      { id: "hicran", net: -56334 },
    ]);
    expect(sonuc).toEqual([
      { kimden: "hicran", kime: "ceren", tutar: 56334 },
      { kimden: "aleyna", kime: "ceren", tutar: 56333 },
    ]);
  });

  it("4 kişi → en fazla 3 ödeme ve herkes sıfırlanır", () => {
    const bakiyeler = [
      { id: "ceren", net: 600 },
      { id: "ali", net: 100 },
      { id: "ayse", net: -400 },
      { id: "mehmet", net: -300 },
    ];
    const sonuc = odemeleriHesapla(bakiyeler);
    expect(sonuc).toEqual([
      { kimden: "ayse", kime: "ceren", tutar: 400 },
      { kimden: "mehmet", kime: "ceren", tutar: 200 },
      { kimden: "mehmet", kime: "ali", tutar: 100 },
    ]);
    for (const net of uygula(bakiyeler, sonuc).values()) expect(net).toBe(0);
  });

  it("gelen diziyi değiştirmez", () => {
    const bakiyeler = [
      { id: "a", net: 100 },
      { id: "b", net: -100 },
    ];
    const kopya = structuredClone(bakiyeler);
    odemeleriHesapla(bakiyeler);
    expect(bakiyeler).toEqual(kopya);
  });

  it("toplamı 0 olmayan bakiyeyi reddeder", () => {
    expect(() =>
      odemeleriHesapla([
        { id: "a", net: 100 },
        { id: "b", net: -99 },
      ]),
    ).toThrow("toplamı 0");
  });

  it("kuruş yerine TL (ondalıklı) gönderilirse reddeder", () => {
    expect(() =>
      odemeleriHesapla([
        { id: "a", net: 563.33 },
        { id: "b", net: -563.33 },
      ]),
    ).toThrow("tam sayı");
  });

  it("rastgele 1000 grup: kurallar her zaman geçerli", () => {
    let tohum = 42;
    const rastgele = (n: number) => {
      tohum = (tohum * 1103515245 + 12345) % 2147483648;
      return tohum % n;
    };

    for (let deneme = 0; deneme < 1000; deneme++) {
      const kisiSayisi = 2 + rastgele(9);
      const bakiyeler: Bakiye[] = [];
      let toplam = 0;
      for (let k = 0; k < kisiSayisi - 1; k++) {
        const net = rastgele(200001) - 100000;
        bakiyeler.push({ id: `kisi${k}`, net });
        toplam += net;
      }
      bakiyeler.push({ id: `kisi${kisiSayisi - 1}`, net: -toplam });

      const sonuc = odemeleriHesapla(bakiyeler);

      expect(sonuc.length).toBeLessThanOrEqual(kisiSayisi - 1);
      for (const o of sonuc) {
        expect(Number.isInteger(o.tutar)).toBe(true);
        expect(o.tutar).toBeGreaterThan(0);
        expect(o.kimden).not.toBe(o.kime);
      }
      for (const net of uygula(bakiyeler, sonuc).values()) expect(net).toBe(0);
    }
  });
});
