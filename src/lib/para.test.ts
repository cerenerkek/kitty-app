import { describe, expect, it } from "vitest";
import { formatTL, kurusaCevir, kurusuMetneCevir } from "./para";

describe("kurusaCevir", () => {
  it("geçerli girişler", () => {
    expect(kurusaCevir("450,50")).toBe(45050);
    expect(kurusaCevir("450.50")).toBe(45050);
    expect(kurusaCevir("450,5")).toBe(45050);
    expect(kurusaCevir("4,35")).toBe(435); // parseFloat burada 434,99.. verirdi
    expect(kurusaCevir("0,01")).toBe(1);
  });

  it("geçersiz girişler → null", () => {
    for (const g of ["", "abc", "-5", "1.250,00", "4,355", "1e3", "12345678"]) {
      expect(kurusaCevir(g)).toBeNull();
    }
  });
});

describe("kurusuMetneCevir", () => {
  it("biçim", () => {
    expect(kurusuMetneCevir(56334)).toBe("563,34");
    expect(kurusuMetneCevir(5)).toBe("0,05");
    expect(kurusuMetneCevir(100000)).toBe("1000,00");
  });

  it("gidiş-dönüş: kuruş → metin → kuruş aynı sayıyı verir", () => {
    for (let k = 1; k <= 100000; k += 7) {
      expect(kurusaCevir(kurusuMetneCevir(k))).toBe(k);
    }
  });
});

describe("formatTL", () => {
  it("Türkçe para biçimi", () => {
    expect(formatTL(112667)).toBe("₺1.126,67");
    expect(formatTL(1)).toBe("₺0,01");
  });
});