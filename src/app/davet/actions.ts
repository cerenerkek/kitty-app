"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type KatilDurumu = { hata: string } | undefined;

const TOKEN_KALIBI = /^[0-9a-f]{32}$/;

export async function davetKatil(
  _onceki: KatilDurumu,
  formData: FormData,
): Promise<KatilDurumu> {
  const token = String(formData.get("token") ?? "");
  if (!TOKEN_KALIBI.test(token)) return { hata: "Davet linki geçersiz." };

  const supabase = await createClient();
  const { data: grupId, error } = await supabase.rpc("davete_katil", {
    p_token: token,
  });

  if (error || !grupId) {
    if (error?.code === "P0002")
      return { hata: "Davet geçersiz veya süresi dolmuş." };
    if (error?.code === "28000")
      return { hata: "Katılmak için önce giriş yapmalısın." };
    return { hata: "Gruba katılamadın. Lütfen tekrar dene." };
  }

  revalidatePath("/gruplar", "layout");
  redirect(`/gruplar/${grupId}`);
}
