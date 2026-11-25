import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { UyeListesi } from "@/components/uye-listesi";
import { DavetPaylas } from "@/components/davet-paylas";
import { GrupSilKarti } from "@/components/grup-sil-karti";
import { HarcamaFormu } from "@/components/harcama-formu";
import { HarcamaListesi, type Harcama } from "@/components/harcama-listesi";
import { BakiyeKarti } from "@/components/bakiye-karti";
import { OdemeGecmisi, type OdemeKaydi } from "@/components/odeme-gecmisi";
import {
  DegisiklikGecmisi,
  type GecmisKaydi,
} from "@/components/degisiklik-gecmisi";
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
  const { id } = await params;
  if (!UUID_KALIBI.test(id)) notFound();

  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const [
    { data: grup },
    { data: uyeler },
    { data: harcamalar },
    { data: bakiyeVerisi },
    { data: odemeKayitlari },
    { data: gecmis },
    { data: eskiUyeler },
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
        "id, aciklama, tutar_kurus, kategori, tarih, odeyen_id, olusturan_id, fis_yolu, expense_splits(user_id, pay_kurus)",
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

    supabase
      .from("expense_history")
      .select("id, expense_id, islem, yapan_id, eski, yeni, zaman")
      .eq("group_id", id)
      .order("zaman", { ascending: false })
      .limit(10)
      .overrideTypes<GecmisKaydi[], { merge: false }>(),

    supabase.rpc("eski_uye_adlari", { p_grup_id: id }),
  ]);
  if (!grup) notFound();

  const fisYollari = (harcamalar ?? [])
    .map((h) => h.fis_yolu)
    .filter((y): y is string => Boolean(y));
  const fisLinkleri = new Map<string, string>();
  if (fisYollari.length > 0) {
    const { data: imzali } = await supabase.storage
      .from("fisler")
      .createSignedUrls(fisYollari, 60 * 60);
    for (const s of imzali ?? []) {
      if (s.path && s.signedUrl) fisLinkleri.set(s.path, s.signedUrl);
    }
  }

  const yoneticiyim =
    uyeler?.some((u) => u.user_id === user.id && u.rol === "admin") ?? false;

  const kisiler = (uyeler ?? []).map((u) => ({
    id: u.user_id,
    ad: u.profiles?.ad_soyad ?? "İsimsiz",
  }));
  const isimler = new Map(kisiler.map((k) => [k.id, k.ad]));
  for (const e of (eskiUyeler ?? []) as {
    kisi_id: string;
    ad_soyad: string;
  }[]) {
    isimler.set(e.kisi_id, `${e.ad_soyad} (ayrıldı)`);
  }

  const bakiyeler = (
    (bakiyeVerisi ?? []) as { uye_id: string; net_kurus: number }[]
  ).map((b) => ({ id: b.uye_id, net: Number(b.net_kurus) }));

  const bugun = bugunIstanbul();

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:max-w-none lg:px-6">
      <Link href="/gruplar" className="text-sm text-muted-foreground lg:hidden">
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

      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">
            <BakiyeKarti
              grupId={grup.id}
              bakiyeler={bakiyeler}
              kisiler={kisiler}
              isimler={isimler}
              benimId={user.id}
              bugun={bugun}
            />
          </div>
          <div className="order-6 lg:order-none">
            <UyeListesi
              grupId={grup.id}
              uyeler={kisiler.map((k) => ({
                ...k,
                rol: uyeler?.find((u) => u.user_id === k.id)?.rol ?? "uye",
              }))}
              benimId={user.id}
              yoneticiyim={yoneticiyim}
              bakiyeler={Object.fromEntries(
                bakiyeler.map((b) => [b.id, b.net]),
              )}
            />
          </div>
          <div className="order-7 lg:order-none">
            <DavetPaylas grupId={grup.id} grupAdi={grup.ad} />
          </div>
          {yoneticiyim && (
            <div className="order-8 lg:order-none">
              <GrupSilKarti
                grupId={grup.id}
                grupAdi={grup.ad}
                acikBorcVar={bakiyeler.some((b) => b.net !== 0)}
              />
            </div>
          )}
        </div>

        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-2 lg:order-none">
            <HarcamaFormu
              grupId={grup.id}
              kisiler={kisiler}
              benimId={user.id}
              bugun={bugun}
            />
          </div>
          <div className="order-3 lg:order-none">
            <HarcamaListesi
              grupId={grup.id}
              harcamalar={harcamalar ?? []}
              isimler={isimler}
              benimId={user.id}
              yoneticiyim={yoneticiyim}
              fisLinkleri={fisLinkleri}
            />
          </div>
        </div>

        <div className="contents lg:col-span-2 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 xl:col-span-1 xl:flex xl:flex-col">
          <div className="order-4 lg:order-none">
            <OdemeGecmisi
              odemeler={odemeKayitlari ?? []}
              isimler={isimler}
              benimId={user.id}
            />
          </div>
          <div className="order-5 lg:order-none">
            <DegisiklikGecmisi
              kayitlar={gecmis ?? []}
              isimler={isimler}
              benimId={user.id}
            />
          </div>
        </div>
      </div>
    </main>
  );
}
