import { describe, expect, it } from "vitest";
import { bugunIstanbul, formatGun } from "./tarih";

describe("formatGun", () => {
  it("Türkçe kısa tarih", () => {
    expect(formatGun("2026-11-19")).toBe("19 Kas");
    expect(formatGun("2027-01-01")).toBe("1 Oca");
  });

  it("ayın son günü bir sonraki aya kaymaz", () => {
    expect(formatGun("2026-10-31")).toBe("31 Eki");
  });
});

describe("bugunIstanbul", () => {
  it("öğlen: UTC ile aynı gün", () => {
    expect(bugunIstanbul(new Date("2026-11-21T12:00:00Z"))).toBe("2026-11-21");
  });

  it("UTC 22:30 → İstanbul'da gece 01:30, yani ertesi gün", () => {
    expect(bugunIstanbul(new Date("2026-11-20T22:30:00Z"))).toBe("2026-11-21");
  });

  it("yılbaşı gecesi: UTC'de hâlâ 31 Aralık, İstanbul'da yeni yıl", () => {
    expect(bugunIstanbul(new Date("2026-12-31T21:30:00Z"))).toBe("2027-01-01");
  });
});
