import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  KategoriGrafigi,
  type KategoriOzeti,
} from "@/components/kategori-grafigi";
import { formatTL } from "@/lib/para";
import { kategoriBilgisi } from "@/lib/kategoriler";
import { ayAdi, ayCozumle, ayinIlkGunu, ayKaydir, buAy } from "@/lib/ay";
import { bugunIstanbul } from "@/lib/tarih";

export const metadata: Metadata = { title: "Aylık özet · Kitty" };

const UUID_KALIBI =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// aylik_ozet fonksiyonunun döndürdüğü satır
type OzetSatiri = {
  kategori: string;
  toplam_kurus: number;
  benim_payim_kurus: number;
  adet: number;
};

export default async function AylikOzetSayfasi({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ ay?: string | string[] }>;
}) {
  // Next.js 16: params ve searchParams Promise → await ile okunur
  const { id } = await params;
  if (!UUID_KALIBI.test(id)) notFound();
  const { ay: ayParametresi } = await searchParams;

  await connection();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // RLS: üyesi değilsen grup görünmez → 404
  const { data: grup } = await supabase
    .from("groups")
    .select("id, ad")
    .eq("id", id)
    .maybeSingle();
  if (!grup) notFound();

  // Hangi ay? Adresteki ?ay= geçersizse ya da yoksa → bu ay (İstanbul saatine göre)
  const bugun = bugunIstanbul();
  const simdikiAy = buAy(bugun);
  const ay = ayCozumle(ayParametresi, simdikiAy);
  const oncekiAy = ayKaydir(ay, -1);
  const sonrakiAy = ayKaydir(ay, 1);
  const sonrakiGosterilsin = sonrakiAy <= simdikiAy; // gelecek aya gitme

  // Kategori özeti (veritabanı toplar, RLS: sadece üyeysen gelir)
  const { data } = await supabase.rpc("aylik_ozet", {
    p_grup_id: id,
    p_ay: ayinIlkGunu(ay),
  });
  const veriler: KategoriOzeti[] = ((data ?? []) as OzetSatiri[]).map((s) => ({
    kategori: s.kategori,
    toplam: Number(s.toplam_kurus),
    benimPayim: Number(s.benim_payim_kurus),
    adet: Number(s.adet),
  }));

  const grupToplami = veriler.reduce((t, v) => t + v.toplam, 0);
  const benimToplamim = veriler.reduce((t, v) => t + v.benimPayim, 0);
  const harcamaSayisi = veriler.reduce((t, v) => t + v.adet, 0);

  const ozetAdresi = (a: string) => `/gruplar/${id}/ozet?ay=${a}`;

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <Link href={`/gruplar/${id}`} className="text-sm text-muted-foreground">
        ← {grup.ad}
      </Link>

      <h1 className="text-2xl font-bold">Aylık özet</h1>

      {/* Ay seçimi */}
      <nav aria-label="Ay seçimi" className="flex items-center justify-between text-sm">
        <Link href={ozetAdresi(oncekiAy)} className="text-muted-foreground">
          ‹ {ayAdi(oncekiAy)}
        </Link>
        <span className="text-base font-semibold">{ayAdi(ay)}</span>
        {sonrakiGosterilsin ? (
          <Link href={ozetAdresi(sonrakiAy)} className="text-muted-foreground">
            {ayAdi(sonrakiAy)} ›
          </Link>
        ) : (
          <span className="w-24" aria-hidden />
        )}
      </nav>

      {/* İki ana rakam */}
      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Grubun harcaması</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatTL(grupToplami)}
          </p>
          <p className="text-xs text-muted-foreground">{harcamaSayisi} harcama</p>
        </div>
        <div className="rounded-xl border p-4">
          <p className="text-xs text-muted-foreground">Senin payın</p>
          <p className="mt-1 text-xl font-bold tabular-nums">
            {formatTL(benimToplamim)}
          </p>
          <p className="text-xs text-muted-foreground">bu harcamalardan</p>
        </div>
      </section>

      {veriler.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Bu ay harcama yok</CardTitle>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            {ayAdi(ay)} için kayıtlı harcama bulunmuyor. Önceki aylara oklarla
            bakabilirsin.
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Grafik */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Kategorilere göre</CardTitle>
            </CardHeader>
            <CardContent>
              <KategoriGrafigi veriler={veriler} />
            </CardContent>
          </Card>

          {/* Aynı veri tablo olarak: kesin rakamlar + yüzde + adet */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Ayrıntı</CardTitle>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Kategori</th>
                    <th className="pb-2 text-right font-medium">Grup</th>
                    <th className="pb-2 text-right font-medium">Payın</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {veriler.map((v) => {
                    const k = kategoriBilgisi(v.kategori);
                    const yuzde = Math.round((v.toplam * 100) / grupToplami);
                    return (
                      <tr key={v.kategori}>
                        <td className="py-2">
                          {k.emoji} {k.ad}
                          <span className="block text-xs text-muted-foreground">
                            {v.adet} harcama · %{yuzde}
                          </span>
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatTL(v.toplam)}
                        </td>
                        <td className="py-2 text-right tabular-nums">
                          {formatTL(v.benimPayim)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </CardContent>
          </Card>
        </>
      )}

      <p className="text-xs text-muted-foreground">
        Borç ödemeleri harcama sayılmaz, bu özete dahil değildir.
      </p>
    </main>
  );
}