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
  // Next.js 16: params bir Promise → await ile okunur
  const { id } = await params;
  if (!UUID_KALIBI.test(id)) notFound();

  await connection(); // her istekte üret (bkz. gruplar/page.tsx)
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // 6 sorgu birbirinden bağımsız → hepsini AYNI ANDA gönder.
  // RLS: üyesi olmadığın grupta hepsi boş döner; grup boşsa 404.
  const [
    { data: grup },
    { data: uyeler },
    { data: harcamalar },
    { data: bakiyeVerisi },
    { data: odemeKayitlari },
    { data: gecmis },
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

    // Son 10 değişiklik (ekleme, silme…) — RLS: sadece üyeysen gelir
    supabase
      .from("expense_history")
      .select("id, expense_id, islem, yapan_id, eski, yeni, zaman")
      .eq("group_id", id)
      .order("zaman", { ascending: false })
      .limit(10)
      .overrideTypes<GecmisKaydi[], { merge: false }>(),
  ]);
  if (!grup) notFound();

  // Fişler gizli klasörde: her biri için 1 saat geçerli imzalı link (tek istekte)
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

  // Yönetici, gruptaki her harcamayı silebilir (veritabanı kuralıyla aynı)
  const yoneticiyim =
    uyeler?.some((u) => u.user_id === user.id && u.rol === "admin") ?? false;

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

  // Düzen:
  //   telefon     → tek sütun (order-N sırasıyla: bakiye, form, liste, ödemeler…)
  //   lg (≥1024)  → 2 sütun; geçmiş kartları alt satırda yan yana
  //   xl (≥1280)  → 3 sütun: [bakiye · üyeler · davet] [form · harcamalar] [ödemeler · değişiklikler]
  // Sütun kutuları telefonda "contents": kaybolur, kartlar tek akışta order ile sıralanır.
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
        {/* 1. sütun: kim kime borçlu + grup bilgisi */}
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
          <Card className="order-6 lg:order-none">
            <CardHeader>
              <CardTitle className="text-base">
                Üyeler ({uyeler?.length ?? 0})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2">
                {uyeler?.map((u) => (
                  <li
                    key={u.user_id}
                    className="flex items-center justify-between"
                  >
                    <span>
                      {u.profiles?.ad_soyad ?? "İsimsiz"}
                      {u.user_id === user.id && (
                        <span className="text-muted-foreground"> (sen)</span>
                      )}
                    </span>
                    {u.rol === "admin" && (
                      <span className="rounded-full bg-vurgu px-2 py-0.5 text-xs font-medium text-vurgu-yazi">
                        Yönetici
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
          <div className="order-7 lg:order-none">
            <DavetPaylas grupId={grup.id} grupAdi={grup.ad} />
          </div>
        </div>

        {/* 2. sütun: en sık yapılan iş — harcama ekle ve liste */}
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

        {/* 3. sütun: geçmiş (lg'de alt satırda iki kart yan yana) */}
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
