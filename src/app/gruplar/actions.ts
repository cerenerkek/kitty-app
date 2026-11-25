"use server";

import { refresh, revalidatePath } from "next/cache";
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

  revalidatePath("/gruplar", "layout");
  redirect(`/gruplar/${grupId}`);
}

export type DavetSonucu = { token: string } | { hata: string };

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
export type GrupSilDurumu = { hata: string } | undefined;

export async function grupSil(
  _onceki: GrupSilDurumu,
  formData: FormData,
): Promise<GrupSilDurumu> {
  const grupId = String(formData.get("grupId") ?? "");
  if (!z.uuid().safeParse(grupId).success) return { hata: "Geçersiz grup." };

  const supabase = await createClient();

  const { data: yonetici } = await supabase.rpc("grup_yoneticisi_mi", {
    p_group_id: grupId,
  });
  if (!yonetici) return { hata: "Grubu sadece yönetici silebilir." };

  const { data: fisler } = await supabase
    .from("expenses")
    .select("fis_yolu")
    .eq("group_id", grupId)
    .not("fis_yolu", "is", null);
  const yollar = (fisler ?? [])
    .map((f) => f.fis_yolu)
    .filter((y): y is string => Boolean(y));
  if (yollar.length > 0) {
    await supabase.storage.from("fisler").remove(yollar);
  }

  const { error } = await supabase.rpc("grup_sil", { p_grup_id: grupId });
  if (error) {
    return {
      hata:
        error.code === "28000"
          ? "Oturumun sona ermiş, tekrar giriş yap."
          : error.code === "42501"
            ? "Grubu sadece yönetici silebilir."
            : "Grup silinemedi. Lütfen tekrar dene.",
    };
  }

  revalidatePath("/gruplar", "layout");
  redirect("/gruplar");
}

export type UyelikSonucu = { hata: string } | { basarili: true };

function uyelikHatasi(error: { code?: string; message: string }) {
  switch (error.code) {
    case "28000":
      return "Oturumun sona ermiş, tekrar giriş yap.";
    case "42501":
      return "Bunu sadece grup yöneticisi yapabilir.";
    case "P0002":
      return "Grup bulunamadı. Sayfayı yenile.";
    case "22023":
      return error.message;
    default:
      return "İşlem yapılamadı. Lütfen tekrar dene.";
  }
}

export async function gruptanCik(grupId: string): Promise<UyelikSonucu> {
  if (!z.uuid().safeParse(grupId).success) return { hata: "Geçersiz grup." };

  const supabase = await createClient();
  const { error } = await supabase.rpc("gruptan_cik", { p_grup_id: grupId });
  if (error) return { hata: uyelikHatasi(error) };

  revalidatePath("/gruplar", "layout");
  redirect("/gruplar");
}

export async function uyeyiCikar(
  grupId: string,
  kisiId: string,
): Promise<UyelikSonucu> {
  if (!z.uuid().safeParse(grupId).success || !z.uuid().safeParse(kisiId).success) {
    return { hata: "Geçersiz istek." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("uyeyi_cikar", {
    p_grup_id: grupId,
    p_kisi_id: kisiId,
  });
  if (error) return { hata: uyelikHatasi(error) };

  refresh();
  return { basarili: true };
}