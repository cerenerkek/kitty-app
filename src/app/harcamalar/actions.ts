"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kurusaCevir } from "@/lib/para";
import { KATEGORI_KODLARI } from "@/lib/kategoriler";

// Hata olursa formun yeniden doldurulması için kullanıcının yazdıkları geri döner
export type HarcamaDegerleri = {
  aciklama: string;
  tutar: string;
  kategori: string;
  tarih: string;
  odeyen: string;
  bolunenler: string[];
};

export type HarcamaFormDurumu =
  | { hata?: string; basarili?: boolean; degerler?: HarcamaDegerleri }
  | undefined;

const harcamaSemasi = z.object({
  grupId: z.uuid("Geçersiz grup."),
  aciklama: z
    .string()
    .trim()
    .min(1, "Açıklama yaz (ör. Market)")
    .max(80, "Açıklama en fazla 80 karakter olabilir"),
  tutarKurus: z
    .number({ error: "Geçerli bir tutar gir (ör. 450,50)" })
    .int()
    .min(1, "Tutar 0'dan büyük olmalı")
    .max(100_000_000, "Tutar en fazla 1.000.000 ₺ olabilir"),
  odeyenId: z.uuid("Kimin ödediğini seç"),
  kategori: z.enum(KATEGORI_KODLARI, { error: "Kategori seç" }),
  tarih: z.iso.date("Geçerli bir tarih seç"),
  bolunenler: z.array(z.uuid()).min(1, "En az bir kişi seç"),
});

export async function harcamaEkle(
  _onceki: HarcamaFormDurumu,
  formData: FormData,
): Promise<HarcamaFormDurumu> {
  const degerler: HarcamaDegerleri = {
    aciklama: String(formData.get("aciklama") ?? ""),
    tutar: String(formData.get("tutar") ?? ""),
    kategori: String(formData.get("kategori") ?? ""),
    tarih: String(formData.get("tarih") ?? ""),
    odeyen: String(formData.get("odeyen") ?? ""),
    // Checkbox'lar: aynı isimle birden çok değer gelir → getAll
    bolunenler: formData.getAll("bolunenler").map(String),
  };

  const sonuc = harcamaSemasi.safeParse({
    grupId: String(formData.get("grupId") ?? ""),
    aciklama: degerler.aciklama,
    tutarKurus: kurusaCevir(degerler.tutar),
    odeyenId: degerler.odeyen,
    kategori: degerler.kategori,
    tarih: degerler.tarih,
    bolunenler: degerler.bolunenler,
  });
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, degerler };

  const h = sonuc.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("harcama_ekle", {
    p_grup_id: h.grupId,
    p_aciklama: h.aciklama,
    p_tutar_kurus: h.tutarKurus,
    p_odeyen_id: h.odeyenId,
    p_kategori: h.kategori,
    p_tarih: h.tarih,
    p_bolunenler: h.bolunenler,
  });

  if (error) {
    // Veritabanı fonksiyonundaki errcode'lar → Türkçe mesaj
    const mesaj =
      error.code === "28000"
        ? "Oturumun sona ermiş, tekrar giriş yap."
        : error.code === "42501"
          ? "Bu grubun üyesi değilsin."
          : error.code === "22023"
            ? error.message // fonksiyonda kendi yazdığımız Türkçe mesajlar
            : "Harcama eklenemedi. Lütfen tekrar dene.";
    return { hata: mesaj, degerler };
  }

  // Grup sayfasını yeniden çiz → yeni harcama listede görünsün
  refresh();
  return { basarili: true };
}