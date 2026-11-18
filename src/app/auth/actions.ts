"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { guvenliHedef } from "@/lib/yonlendirme";

export type FormDurumu =
  | { hata: string; degerler?: { adSoyad?: string; email?: string } }
  | undefined;

const kayitSemasi = z.object({
  adSoyad: z
    .string()
    .trim()
    .min(2, "Ad soyad en az 2 karakter olmalı")
    .max(60, "Ad soyad en fazla 60 karakter olabilir"),
  email: z.email("Geçerli bir e-posta adresi gir"),
  sifre: z.string().min(8, "Şifre en az 8 karakter olmalı"),
});

const girisSemasi = z.object({
  email: z.email("Geçerli bir e-posta adresi gir"),
  sifre: z.string().min(1, "Şifreni gir"),
});

// Supabase'in İngilizce hata kodlarını Türkçe mesajlara çevirir
function hataMesaji(kod?: string) {
  switch (kod) {
    case "user_already_exists":
    case "email_exists":
      return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
    case "invalid_credentials":
      return "E-posta veya şifre hatalı.";
    case "weak_password":
      return "Şifre çok zayıf, daha güçlü bir şifre seç.";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "Çok fazla deneme yapıldı. Birkaç dakika sonra tekrar dene.";
    default:
      return "Bir şeyler ters gitti. Lütfen tekrar dene.";
  }
}

export async function kayitOl(
  _onceki: FormDurumu,
  formData: FormData,
): Promise<FormDurumu> {
  const girdi = {
    adSoyad: String(formData.get("adSoyad") ?? ""),
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    sifre: String(formData.get("sifre") ?? ""),
  };
  const degerler = { adSoyad: girdi.adSoyad, email: girdi.email };

  // 1) Doğrulama (her zaman SUNUCUDA)
  const sonuc = kayitSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, degerler };

  // 2) Supabase'e kayıt; ad soyad trigger'a "metadata" olarak gider
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: sonuc.data.email,
    password: sonuc.data.sifre,
    options: { data: { ad_soyad: sonuc.data.adSoyad } },
  });
  if (error) return { hata: hataMesaji(error.code), degerler };

  // 3) Başarılı → korumalı sayfaya
    redirect(guvenliHedef(formData.get("sonraki")));
}

export async function girisYap(
  _onceki: FormDurumu,
  formData: FormData,
): Promise<FormDurumu> {
  const girdi = {
    email: String(formData.get("email") ?? "")
      .trim()
      .toLowerCase(),
    sifre: String(formData.get("sifre") ?? ""),
  };
  const degerler = { email: girdi.email };

  const sonuc = girisSemasi.safeParse(girdi);
  if (!sonuc.success) return { hata: sonuc.error.issues[0].message, degerler };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: sonuc.data.email,
    password: sonuc.data.sifre,
  });
  if (error) return { hata: hataMesaji(error.code), degerler };

    redirect(guvenliHedef(formData.get("sonraki")));
}

export async function cikisYap() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
