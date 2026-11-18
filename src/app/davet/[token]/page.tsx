import Link from "next/link";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DavetKatilFormu } from "@/components/davet-katil-formu";

export const metadata: Metadata = { title: "Davet · Kitty" };

type DavetBilgisi = {
  grup_id: string;
  grup_adi: string;
  davet_eden: string | null;
  uye_sayisi: number;
  zaten_uye: boolean;
};

const TOKEN_KALIBI = /^[0-9a-f]{32}$/;

export default async function DavetSayfasi({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  await connection(); // her istekte üret (bkz. gruplar/page.tsx)
  const supabase = await createClient();

  // Bozuk biçimli token için veritabanına hiç gitme
  let davet: DavetBilgisi | null = null;
  if (TOKEN_KALIBI.test(token)) {
    // Fonksiyon tablo döndürür (0 veya 1 satır). Tip tanımı olmadığı için
    // TypeScript'e sonucun bir DavetBilgisi dizisi olduğunu biz söylüyoruz.
    const { data } = await supabase.rpc("davet_bilgisi", { p_token: token });
    davet = (data as DavetBilgisi[] | null)?.[0] ?? null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const sonraki = encodeURIComponent(`/davet/${token}`);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <Link href="/" className="text-center text-5xl" aria-label="Ana sayfa">
        🐱
      </Link>

      {!davet ? (
        <Card>
          <CardHeader className="text-center">
            <CardTitle>Davet geçersiz</CardTitle>
            <CardDescription>
              Bu linkin süresi dolmuş ya da link hatalı. Grubundaki birinden yeni
              bir link iste.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/" className={`${buttonVariants({ variant: "outline" })} w-full`}>
              Ana sayfaya dön
            </Link>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="text-center">
            <CardDescription>
              {davet.davet_eden ?? "Bir arkadaşın"} seni davet ediyor
            </CardDescription>
            <CardTitle className="text-2xl text-teal-700">{davet.grup_adi}</CardTitle>
            <CardDescription>{davet.uye_sayisi} üye</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {davet.zaten_uye ? (
              <>
                <p className="text-center text-sm">Zaten bu grubun üyesisin 🎉</p>
                <Link href={`/gruplar/${davet.grup_id}`} className={buttonVariants({ size: "lg" })}>
                  Gruba git
                </Link>
              </>
            ) : user ? (
              <DavetKatilFormu token={token} />
            ) : (
              <>
                <Link href={`/kayit?sonraki=${sonraki}`} className={buttonVariants({ size: "lg" })}>
                  Kayıt ol ve katıl
                </Link>
                <Link
                  href={`/giris?sonraki=${sonraki}`}
                  className={buttonVariants({ size: "lg", variant: "outline" })}
                >
                  Hesabım var, giriş yap
                </Link>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </main>
  );
}