"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
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
      uyari?: string; // harcama kaydedildi ama fiş yüklenemedi gibi durumlar
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

type Supabase = Awaited<ReturnType<typeof createClient>>;

// ---------------------------------------------------------------------------
// Ekleme ve düzenlemenin ortak parçaları (dışa aktarılmıyor)
// ---------------------------------------------------------------------------

// Formu oku + Zod ile doğrula + fiş dosyasını kontrol et
function formuOku(formData: FormData) {
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

  // Fiş (isteğe bağlı): tarayıcı küçültse bile sunucuda tekrar kontrol et
  const dosya = formData.get("fis");
  const fis = dosya instanceof File && dosya.size > 0 ? dosya : null;
  const fisHatasi =
    fis && (!fisTuruGecerli(fis.type) || fis.size > FIS_EN_BUYUK_BOYUT)
      ? "Fiş JPEG, PNG ya da WebP olmalı ve 1 MB'ı geçmemeli."
      : null;

  return { degerler, sonuc, fis, fisHatasi };
}

// Fişi Storage'a yükle → harcamaya bağla → varsa eski fişi sil.
// Başarısızsa uyarı metni döner (harcama yine kayıtlı kalır).
async function fisiYukle(
  supabase: Supabase,
  grupId: string,
  harcamaId: string,
  fis: File,
): Promise<string | null> {
  const yol = fisYolu(grupId, harcamaId, crypto.randomUUID(), fis.type);
  const yukleme = await supabase.storage
    .from("fisler")
    .upload(yol, fis, { contentType: fis.type, upsert: false });
  if (yukleme.error) return "Harcama kaydedildi ama fiş yüklenemedi.";

  // fis_bagla, harcamanın ESKİ fişinin yolunu döndürür (yoksa null)
  const { data: eskiYol, error } = await supabase.rpc("fis_bagla", {
    p_harcama_id: harcamaId,
    p_yol: yol,
  });
  if (error) {
    await supabase.storage.from("fisler").remove([yol]); // sahipsiz dosya kalmasın
    return "Harcama kaydedildi ama fiş bağlanamadı.";
  }
  if (typeof eskiYol === "string" && eskiYol) {
    await supabase.storage.from("fisler").remove([eskiYol]); // yerine yenisi geldi
  }
  return null;
}

// ---------------------------------------------------------------------------
// Harcama ekleme
// ---------------------------------------------------------------------------
export async function harcamaEkle(
  _onceki: HarcamaFormDurumu,
  formData: FormData,
): Promise<HarcamaFormDurumu> {
  const { degerler, sonuc, fis, fisHatasi } = formuOku(formData);
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, degerler };
  if (fisHatasi) return { hata: fisHatasi, degerler };

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

  const uyari =
    fis && typeof harcamaId === "string"
      ? await fisiYukle(supabase, h.grupId, harcamaId, fis)
      : null;

  // Grup sayfasını yeniden çiz → yeni harcama listede görünsün
  refresh();
  return uyari ? { basarili: true, uyari } : { basarili: true };
}

// ---------------------------------------------------------------------------
// Harcama düzenleme
// ---------------------------------------------------------------------------
export async function harcamaDuzenle(
  _onceki: HarcamaFormDurumu,
  formData: FormData,
): Promise<HarcamaFormDurumu> {
  const harcamaId = String(formData.get("harcamaId") ?? "");
  const { degerler, sonuc, fis, fisHatasi } = formuOku(formData);
  if (!z.uuid().safeParse(harcamaId).success) return { hata: "Geçersiz harcama.", degerler };
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, degerler };
  if (fisHatasi) return { hata: fisHatasi, degerler };

  const h = sonuc.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("harcama_duzenle", {
    p_harcama_id: harcamaId,
    p_aciklama: h.aciklama,
    p_tutar_kurus: h.tutarKurus,
    p_odeyen_id: h.odeyenId,
    p_kategori: h.kategori,
    p_tarih: h.tarih,
    p_bolunenler: h.bolunenler,
  });

  if (error) {
    const mesaj =
      error.code === "28000"
        ? "Oturumun sona ermiş, tekrar giriş yap."
        : error.code === "42501"
          ? "Bu harcamayı sadece ekleyen kişi ya da grup yöneticisi düzenleyebilir."
          : error.code === "P0002"
            ? "Harcama bulunamadı. Silinmiş olabilir."
            : error.code === "22023"
              ? error.message
              : "Değişiklikler kaydedilemedi. Lütfen tekrar dene.";
    return { hata: mesaj, degerler };
  }

  const uyari = fis ? await fisiYukle(supabase, h.grupId, harcamaId, fis) : null;
  if (uyari) {
    refresh();
    return { basarili: true, uyari };
  }

  // Kaydedildi → grup sayfasına dön (bakiyeler yeni haliyle hesaplanmış olur)
  redirect(`/gruplar/${h.grupId}`);
}

// ---------------------------------------------------------------------------
// Harcama silme
// ---------------------------------------------------------------------------
export type SilmeSonucu = { hata: string } | { basarili: true };

// Yetki kontrolü veritabanında (harcama_sil): sadece ekleyen kişi ya da
// grup yöneticisi. Silmeden önce geçmişe kopyalanır.
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
