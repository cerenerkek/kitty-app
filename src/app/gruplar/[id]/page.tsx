import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DavetPaylas } from "@/components/davet-paylas";
import { HarcamaFormu } from "@/components/harcama-formu";
import { HarcamaListesi, type Harcama } from "@/components/harcama-listesi";
import { BakiyeKarti } from "@/components/bakiye-karti";
import { OdemeGecmisi, type OdemeKaydi } from "@/components/odeme-gecmisi";
import { buttonVariants } from "@/components/ui/button";
import { bugunIstanbul } from "@/lib/tarih";

export const metadata: Metadata = { title: "Grup · Kitty" };

const UUID_KALIBI =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Uye = {
  user_id: string;
  rol: "admin" | "uye";
  profiles: { ad_soyad: string } | null;
};

export default async function GrupDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  // Next.js 16: params bir Promise → await ile okunur
  const { id } = await params;
  if (!UUID_KALIBI.test(id)) notFound();

  await connection(); // her istekte üret (bkz. gruplar/page.tsx)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // 5 sorgu birbirinden bağımsız → hepsini AYNI ANDA gönder.
  // RLS: üyesi olmadığın grupta hepsi boş döner; grup boşsa 404.
  const [
    { data: grup },
    { data: uyeler },
    { data: harcamalar },
    { data: bakiyeVerisi },
    { data: odemeKayitlari },
  ] = await Promise.all([
    supabase.from("groups").select("id, ad").eq("id", id).maybeSingle(),

    supabase
      .from("group_members")
      .select("user_id, rol, profiles(ad_soyad)")
      .eq("group_id", id)
      .order("katilma_tarihi")
      .overrideTypes<Uye[], { merge: false }>(),

    supabase
      .from("expenses")
      .select(
        "id, aciklama, tutar_kurus, kategori, tarih, odeyen_id, expense_splits(user_id, pay_kurus)",
      )
      .eq("group_id", id)
      .order("tarih", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(50)
      .overrideTypes<Harcama[], { merge: false }>(),

    supabase.rpc("grup_bakiyeleri", { p_grup_id: id }),

    supabase
      .from("settlements")
      .select("id, odeyen_id, alan_id, tutar_kurus, tarih")
      .eq("group_id", id)
      .order("tarih", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(20)
      .overrideTypes<OdemeKaydi[], { merge: false }>(),
  ]);
  if (!grup) notFound();

  // Form için sade kişi listesi ve id → ad sözlüğü
  const kisiler = (uyeler ?? []).map((u) => ({
    id: u.user_id,
    ad: u.profiles?.ad_soyad ?? "İsimsiz",
  }));
  const isimler = new Map(kisiler.map((k) => [k.id, k.ad]));

  // Veritabanı biçimi → algoritmanın biçimi
  const bakiyeler = (
    (bakiyeVerisi ?? []) as { uye_id: string; net_kurus: number }[]
  ).map((b) => ({ id: b.uye_id, net: Number(b.net_kurus) }));

  const bugun = bugunIstanbul();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <Link href="/gruplar" className="text-sm text-muted-foreground">
        ← Gruplarım
      </Link>

      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">{grup.ad}</h1>
        <Link
          href={`/gruplar/${grup.id}/ozet`}
          className={buttonVariants({ variant: "outline", size: "sm" })}
        >
          📊 Aylık özet
        </Link>
      </div>

      <BakiyeKarti
        grupId={grup.id}
        bakiyeler={bakiyeler}
        kisiler={kisiler}
        isimler={isimler}
        benimId={user.id}
        bugun={bugun}
      />
      <HarcamaFormu
        grupId={grup.id}
        kisiler={kisiler}
        benimId={user.id}
        bugun={bugun}
      />
      <HarcamaListesi
        harcamalar={harcamalar ?? []}
        isimler={isimler}
        benimId={user.id}
      />
      <OdemeGecmisi
        odemeler={odemeKayitlari ?? []}
        isimler={isimler}
        benimId={user.id}
      />
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Üyeler ({uyeler?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="flex flex-col gap-2">
            {uyeler?.map((u) => (
              <li key={u.user_id} className="flex items-center justify-between">
                <span>
                  {u.profiles?.ad_soyad ?? "İsimsiz"}
                  {u.user_id === user.id && (
                    <span className="text-muted-foreground"> (sen)</span>
                  )}
                </span>
                {u.rol === "admin" && (
                  <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs font-medium text-teal-700">
                    Yönetici
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <DavetPaylas grupId={grup.id} grupAdi={grup.ad} />
    </main>
  );
}
