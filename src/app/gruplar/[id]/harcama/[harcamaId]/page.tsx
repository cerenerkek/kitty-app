import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HarcamaFormu } from "@/components/harcama-formu";
import { HarcamaSilButonu } from "@/components/harcama-sil-butonu";
import {
  DegisiklikGecmisi,
  type GecmisKaydi,
} from "@/components/degisiklik-gecmisi";
import { formatTL, kurusuMetneCevir } from "@/lib/para";
import { kategoriBilgisi } from "@/lib/kategoriler";
import { bugunIstanbul, formatGun } from "@/lib/tarih";

export const metadata: Metadata = { title: "Harcama · Kitty" };

const UUID_KALIBI =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type Uye = {
  user_id: string;
  rol: "admin" | "uye";
  profiles: { ad_soyad: string } | null;
};

type HarcamaDetayi = {
  id: string;
  aciklama: string;
  tutar_kurus: number;
  kategori: string;
  tarih: string;
  odeyen_id: string;
  olusturan_id: string | null;
  fis_yolu: string | null;
  expense_splits: { user_id: string; pay_kurus: number }[];
};

export default async function HarcamaDetaySayfasi({
  params,
}: {
  params: Promise<{ id: string; harcamaId: string }>;
}) {
  const { id, harcamaId } = await params;
  if (!UUID_KALIBI.test(id) || !UUID_KALIBI.test(harcamaId)) notFound();

  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // 3 bağımsız sorgu aynı anda. RLS: üyesi değilsen hepsi boş → 404
  const [{ data: harcama }, { data: uyeler }, { data: gecmis }] =
    await Promise.all([
      supabase
        .from("expenses")
        .select(
          "id, aciklama, tutar_kurus, kategori, tarih, odeyen_id, olusturan_id, fis_yolu, expense_splits(user_id, pay_kurus)",
        )
        .eq("id", harcamaId)
        .eq("group_id", id) // adresteki grup ile harcamanın grubu uyuşmalı
        .maybeSingle()
        .overrideTypes<HarcamaDetayi, { merge: false }>(),

      supabase
        .from("group_members")
        .select("user_id, rol, profiles(ad_soyad)")
        .eq("group_id", id)
        .order("katilma_tarihi")
        .overrideTypes<Uye[], { merge: false }>(),

      supabase
        .from("expense_history")
        .select("id, expense_id, islem, yapan_id, eski, yeni, zaman")
        .eq("group_id", id)
        .eq("expense_id", harcamaId)
        .order("zaman", { ascending: false })
        .overrideTypes<GecmisKaydi[], { merge: false }>(),
    ]);
  if (!harcama) notFound();

  const kisiler = (uyeler ?? []).map((u) => ({
    id: u.user_id,
    ad: u.profiles?.ad_soyad ?? "İsimsiz",
  }));
  const isimler = new Map(kisiler.map((k) => [k.id, k.ad]));
  const ad = (kisiId: string) =>
    kisiId === user.id ? "Sen" : (isimler.get(kisiId) ?? "Eski üye");

  // Veritabanı kuralıyla aynı: ekleyen kişi ya da yönetici değiştirebilir
  const yoneticiyim =
    uyeler?.some((u) => u.user_id === user.id && u.rol === "admin") ?? false;
  const degistirebilirim = harcama.olusturan_id === user.id || yoneticiyim;

  // Fiş: gizli klasörden 1 saatlik imzalı link
  let fisLinki: string | null = null;
  if (harcama.fis_yolu) {
    const { data } = await supabase.storage
      .from("fisler")
      .createSignedUrl(harcama.fis_yolu, 60 * 60);
    fisLinki = data?.signedUrl ?? null;
  }

  const kategori = kategoriBilgisi(harcama.kategori);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:max-w-5xl lg:px-8">
      <Link href={`/gruplar/${id}`} className="text-sm text-muted-foreground">
        ← Gruba dön
      </Link>

      <h1 className="text-2xl font-bold">
        {kategori.emoji} {harcama.aciklama}
      </h1>

      {/* Telefon: özet → düzenleme → geçmiş. Bilgisayar: solda özet + geçmiş, sağda düzenleme */}
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 lg:items-start">
        <div className="contents lg:flex lg:flex-col lg:gap-6">
          <div className="order-1 lg:order-none">
            {/* Özet */}
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl tabular-nums">
                  {formatTL(harcama.tutar_kurus)}
                </CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col gap-3 text-sm">
                <p className="text-muted-foreground">
                  {ad(harcama.odeyen_id)} ödedi · {kategori.ad} ·{" "}
                  {formatGun(harcama.tarih)}
                </p>
                <ul className="flex flex-col gap-1">
                  {harcama.expense_splits.map((s) => (
                    <li key={s.user_id} className="flex justify-between">
                      <span>{ad(s.user_id)}</span>
                      <span className="tabular-nums">
                        {formatTL(s.pay_kurus)}
                      </span>
                    </li>
                  ))}
                </ul>
                {fisLinki && (
                  <a
                    href={fisLinki}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-fit"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- 1 saatlik imzalı link, optimize edilecek bir şey yok */}
                    <img
                      src={fisLinki}
                      alt={`"${harcama.aciklama}" harcamasının fişi`}
                      className="max-h-64 rounded-md border object-contain"
                    />
                  </a>
                )}
              </CardContent>
            </Card>
          </div>
          <div className="order-3 lg:order-none">
            <DegisiklikGecmisi
              kayitlar={gecmis ?? []}
              isimler={isimler}
              benimId={user.id}
              baslik="Bu harcamanın geçmişi"
            />
          </div>
        </div>
        <div className="order-2 flex flex-col gap-6 lg:order-none">
          {degistirebilirim ? (
            <>
              <HarcamaFormu
                grupId={id}
                kisiler={kisiler}
                benimId={user.id}
                bugun={bugunIstanbul()}
                mevcutFisVar={Boolean(harcama.fis_yolu)}
                duzenlenen={{
                  id: harcama.id,
                  aciklama: harcama.aciklama,
                  tutar: kurusuMetneCevir(harcama.tutar_kurus),
                  kategori: harcama.kategori,
                  tarih: harcama.tarih,
                  odeyen: harcama.odeyen_id,
                  bolunenler: harcama.expense_splits.map((s) => s.user_id),
                }}
              />
              <div className="flex justify-end">
                <HarcamaSilButonu
                  harcamaId={harcama.id}
                  aciklama={harcama.aciklama}
                  tutarMetni={formatTL(harcama.tutar_kurus)}
                  sonraGit={`/gruplar/${id}`}
                />
              </div>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              Bu harcamayı sadece ekleyen kişi ya da grup yöneticisi
              değiştirebilir.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
