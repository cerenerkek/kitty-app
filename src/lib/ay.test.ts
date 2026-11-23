import { describe, expect, it } from "vitest";
import { ayAdi, ayCozumle, ayinIlkGunu, ayKaydir, buAy } from "./ay";

describe("buAy", () => {
  it("tarihten ayı alır", () => {
    expect(buAy("2026-11-21")).toBe("2026-11");
  });
});

describe("ayCozumle", () => {
  const varsayilan = "2026-11";

  it("geçerli ay aynen döner", () => {
    expect(ayCozumle("2026-11", varsayilan)).toBe("2026-11");
    expect(ayCozumle("2025-01", varsayilan)).toBe("2025-01");
  });

  it("geçersiz değerler → varsayılan ay", () => {
    for (const d of [
      undefined, "", "abc", "2026-13", "2026-00", "2026-1",
      "26-11", "2026/11", "2026-11-01", "1999-12", "2101-01",
      ["2026-10"], 202611,
    ]) {
      expect(ayCozumle(d, varsayilan)).toBe(varsayilan);
    }
  });
});

describe("ayKaydir", () => {
  it("aynı yıl içinde", () => {
    expect(ayKaydir("2026-11", 1)).toBe("2026-12");
    expect(ayKaydir("2026-11", -1)).toBe("2026-10");
  });

  it("yıl değişimi", () => {
    expect(ayKaydir("2026-12", 1)).toBe("2027-01");
    expect(ayKaydir("2026-01", -1)).toBe("2025-12");
  });

  it("çok aylık kaydırma", () => {
    expect(ayKaydir("2026-11", 12)).toBe("2027-11");
    expect(ayKaydir("2026-11", -23)).toBe("2024-12");
  });

  it("ileri sonra geri → aynı ay (2000–2099 arası her ay)", () => {
    for (let yil = 2000; yil < 2100; yil++) {
      for (let ay = 1; ay <= 12; ay++) {
        const a = `${yil}-${String(ay).padStart(2, "0")}`;
        expect(ayKaydir(ayKaydir(a, 1), -1)).toBe(a);
        expect(ayCozumle(ayKaydir(a, 1), "x")).not.toBe("x");
      }
    }
  });
});

describe("ayinIlkGunu ve ayAdi", () => {
  it("veritabanına giden gün", () => {
    expect(ayinIlkGunu("2026-11")).toBe("2026-11-01");
  });

  it("Türkçe ay adları", () => {
    expect(ayAdi("2026-11")).toBe("Kasım 2026");
    expect(ayAdi("2027-01")).toBe("Ocak 2027");
    expect(ayAdi("2026-08")).toBe("Ağustos 2026");
  });
});