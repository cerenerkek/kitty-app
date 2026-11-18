"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export type GrupFormDurumu = { hata: string; ad?: string } | undefined;

const grupSemasi = z.object({
  ad: z
    .string()
    .trim()
    .min(2, "Grup adı en az 2 karakter olmalı")
    .max(50, "Grup adı en fazla 50 karakter olabilir"),
});

export async function grupOlustur(
  _onceki: GrupFormDurumu,
  formData: FormData,
): Promise<GrupFormDurumu> {
  const ad = String(formData.get("ad") ?? "");

  const sonuc = grupSemasi.safeParse({ ad });
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, ad };

  // Veritabanı fonksiyonu: grubu kurar + bizi admin yapar (tek transaction)
  const supabase = await createClient();
  const { data: grupId, error } = await supabase.rpc("grup_olustur", {
    p_ad: sonuc.data.ad,
  });

  if (error || !grupId) {
    return {
      hata:
        error?.code === "28000"
          ? "Oturumun sona ermiş, tekrar giriş yap."
          : "Grup oluşturulamadı. Lütfen tekrar dene.",
      ad,
    };
  }

  redirect(`/gruplar/${grupId}`);
}

export type DavetSonucu = { token: string } | { hata: string };

// Davet linki oluşturur; RLS sadece grup üyesinin oluşturmasına izin verir
export async function davetOlustur(grupId: string): Promise<DavetSonucu> {
  if (!z.uuid().safeParse(grupId).success) return { hata: "Geçersiz grup." };

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invites")
    .insert({ group_id: grupId })
    .select("token")
    .single();

  if (error || !data) return { hata: "Davet linki oluşturulamadı." };
  return { token: data.token };
}