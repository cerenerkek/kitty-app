"use server";

import { refresh } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { kurusaCevir } from "@/lib/para";

export type OdemeDegerleri = { odeyen: string; alan: string; tutar: string };

export type OdemeFormDurumu =
  | { hata?: string; basarili?: boolean; degerler?: OdemeDegerleri }
  | undefined;

const odemeSemasi = z
  .object({
    grupId: z.uuid("Geçersiz grup."),
    odeyenId: z.uuid("Kimin ödediğini seç"),
    alanId: z.uuid("Kime ödendiğini seç"),
    tutarKurus: z
      .number({ error: "Geçerli bir tutar gir (ör. 250,00)" })
      .int()
      .min(1, "Tutar 0'dan büyük olmalı")
      .max(100_000_000, "Tutar en fazla 1.000.000 ₺ olabilir"),
    tarih: z.iso.date("Geçerli bir tarih seç"),
  })
  .refine((d) => d.odeyenId !== d.alanId, {
    message: "Kişi kendine ödeme yapamaz",
  });

export async function odemeKaydet(
  _onceki: OdemeFormDurumu,
  formData: FormData,
): Promise<OdemeFormDurumu> {
  const degerler: OdemeDegerleri = {
    odeyen: String(formData.get("odeyen") ?? ""),
    alan: String(formData.get("alan") ?? ""),
    tutar: String(formData.get("tutar") ?? ""),
  };

  const sonuc = odemeSemasi.safeParse({
    grupId: String(formData.get("grupId") ?? ""),
    odeyenId: degerler.odeyen,
    alanId: degerler.alan,
    tutarKurus: kurusaCevir(degerler.tutar),
    tarih: String(formData.get("tarih") ?? ""),
  });
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, degerler };

  const o = sonuc.data;
  const supabase = await createClient();
  const { error } = await supabase.rpc("odeme_kaydet", {
    p_grup_id: o.grupId,
    p_odeyen_id: o.odeyenId,
    p_alan_id: o.alanId,
    p_tutar_kurus: o.tutarKurus,
    p_tarih: o.tarih,
  });

  if (error) {
    const mesaj =
      error.code === "28000"
        ? "Oturumun sona ermiş, tekrar giriş yap."
        : error.code === "42501"
          ? "Bu grubun üyesi değilsin."
          : error.code === "22023"
            ? error.message
            : "Ödeme kaydedilemedi. Lütfen tekrar dene.";
    return { hata: mesaj, degerler };
  }

  refresh();
  return { basarili: true };
}