"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kurusaCevir } from "@/lib/para";
import { KATEGORI_KODLARI } from "@/lib/kategoriler";
import { FIS_EN_BUYUK_BOYUT, fisTuruGecerli, fisYolu } from "@/lib/gorsel";

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
  | {
      hata?: string;
      basarili?: boolean;
      uyari?: string; // harcama eklendi ama fiş yüklenemedi gibi durumlar
      degerler?: HarcamaDegerleri;
    }
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

  // Fiş (isteğe bağlı): tarayıcı küçültse bile sunucuda tekrar kontrol et
  const fis = formData.get("fis");
  const fisVar = fis instanceof File && fis.size > 0;
  if (fisVar && (!fisTuruGecerli(fis.type) || fis.size > FIS_EN_BUYUK_BOYUT)) {
    return { hata: "Fiş JPEG, PNG ya da WebP olmalı ve 1 MB'ı geçmemeli.", degerler };
  }

  const h = sonuc.data;
  const supabase = await createClient();
  const { data: harcamaId, error } = await supabase.rpc("harcama_ekle", {
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

  // Fiş varsa: Storage'a yükle → harcamaya bağla.
  // Bu adım başarısız olursa harcama yine kayıtlı kalır, kullanıcı uyarılır.
  if (fisVar && typeof harcamaId === "string") {
    const yol = fisYolu(h.grupId, harcamaId, crypto.randomUUID(), fis.type);
    const yukleme = await supabase.storage
      .from("fisler")
      .upload(yol, fis, { contentType: fis.type, upsert: false });

    if (yukleme.error) {
      refresh();
      return { basarili: true, uyari: "Harcama eklendi ama fiş yüklenemedi." };
    }

    const { error: baglamaHatasi } = await supabase.rpc("fis_bagla", {
      p_harcama_id: harcamaId,
      p_yol: yol,
    });
    if (baglamaHatasi) {
      await supabase.storage.from("fisler").remove([yol]); // sahipsiz dosya kalmasın
      refresh();
      return { basarili: true, uyari: "Harcama eklendi ama fiş bağlanamadı." };
    }
  }

  // Grup sayfasını yeniden çiz → yeni harcama listede görünsün
  refresh();
  return { basarili: true };
}

export type SilmeSonucu = { hata: string } | { basarili: true };

// Harcamayı siler. Yetki kontrolü veritabanında (harcama_sil):
// sadece ekleyen kişi ya da grup yöneticisi. Silmeden önce geçmişe kopyalanır.
export async function harcamaSil(harcamaId: string): Promise<SilmeSonucu> {
  if (!z.uuid().safeParse(harcamaId).success) return { hata: "Geçersiz harcama." };

  const supabase = await createClient();
  // harcama_sil, silinen harcamanın fiş yolunu döndürür (yoksa null)
  const { data: fisYoluSilinen, error } = await supabase.rpc("harcama_sil", {
    p_harcama_id: harcamaId,
  });

  if (error) {
    const mesaj =
      error.code === "28000"
        ? "Oturumun sona ermiş, tekrar giriş yap."
        : error.code === "42501"
          ? "Bu harcamayı sadece ekleyen kişi ya da grup yöneticisi silebilir."
          : error.code === "P0002"
            ? "Harcama bulunamadı. Sayfayı yenile."
            : "Harcama silinemedi. Lütfen tekrar dene.";
    return { hata: mesaj };
  }

  // Harcamanın fişi varsa dosyayı da sil (başarısız olursa harcama yine silinmiş olur)
  if (typeof fisYoluSilinen === "string" && fisYoluSilinen) {
    await supabase.storage.from("fisler").remove([fisYoluSilinen]);
  }

  refresh(); // bakiyeler, liste, özet ve geçmiş yeniden hesaplanır
  return { basarili: true };
}