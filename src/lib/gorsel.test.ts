import { describe, expect, it } from "vitest";
import { fisTuruGecerli, fisYolu, hedefBoyut } from "./gorsel";

describe("hedefBoyut", () => {
  it("yatay fotoğrafı uzun kenarı 1600 olacak şekilde küçültür", () => {
    expect(hedefBoyut(4000, 3000)).toEqual({ genislik: 1600, yukseklik: 1200 });
  });

  it("dikey fotoğraf (fişler genelde dikey)", () => {
    expect(hedefBoyut(3024, 4032)).toEqual({ genislik: 1200, yukseklik: 1600 });
  });

  it("zaten küçük görseli büyütmez", () => {
    expect(hedefBoyut(800, 600)).toEqual({ genislik: 800, yukseklik: 600 });
  });

  it("tam sınırdaki görsel aynı kalır", () => {
    expect(hedefBoyut(1600, 900)).toEqual({ genislik: 1600, yukseklik: 900 });
  });

  it("çok ince uzun görselde kenar 1 pikselin altına düşmez", () => {
    expect(hedefBoyut(10000, 2)).toEqual({ genislik: 1600, yukseklik: 1 });
  });

  it("oran her zaman korunur (rastgele 500 boyut)", () => {
    let tohum = 7;
    const rastgele = (n: number) => {
      tohum = (tohum * 1103515245 + 12345) % 2147483648;
      return 1 + (tohum % n);
    };
    for (let i = 0; i < 500; i++) {
      const g = rastgele(8000);
      const y = rastgele(8000);
      const s = hedefBoyut(g, y);
      expect(Math.max(s.genislik, s.yukseklik)).toBeLessThanOrEqual(1600);
      const oran = Math.min(1, 1600 / Math.max(g, y));
      expect(Math.abs(s.genislik - g * oran)).toBeLessThanOrEqual(1);
      expect(Math.abs(s.yukseklik - y * oran)).toBeLessThanOrEqual(1);
    }
  });

  it("geçersiz boyutu reddeder", () => {
    expect(() => hedefBoyut(0, 100)).toThrow();
  });
});

describe("fisTuruGecerli", () => {
  it("sadece JPEG, PNG ve WebP", () => {
    expect(fisTuruGecerli("image/jpeg")).toBe(true);
    expect(fisTuruGecerli("image/png")).toBe(true);
    expect(fisTuruGecerli("image/webp")).toBe(true);
    expect(fisTuruGecerli("image/gif")).toBe(false);
    expect(fisTuruGecerli("application/pdf")).toBe(false);
    expect(fisTuruGecerli("image/svg+xml")).toBe(false);
  });
});

describe("fisYolu", () => {
  it("ilk klasör grup, ikinci klasör harcama", () => {
    expect(fisYolu("g1", "h1", "d1", "image/jpeg")).toBe("g1/h1/d1.jpg");
    expect(fisYolu("g1", "h1", "d1", "image/png")).toBe("g1/h1/d1.png");
    expect(fisYolu("g1", "h1", "d1", "image/webp")).toBe("g1/h1/d1.webp");
  });
});
