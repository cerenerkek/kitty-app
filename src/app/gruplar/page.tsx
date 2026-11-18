import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GrupOlusturFormu } from "@/components/grup-olustur-formu";

export const metadata: Metadata = { title: "Gruplarım · Kitty" };

export default async function GruplarSayfasi() {
  // Bu sayfa her istekte yeniden üretilir (oturum + Supabase'in saat kontrolü).
  // connection() olmadan Next.js 16 "Date.now() while prerendering" uyarısı verir.
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // İki sorguyu aynı anda çalıştır (daha hızlı)
  const [{ data: profil }, { data: gruplar }] = await Promise.all([
    supabase.from("profiles").select("ad_soyad").eq("id", user.id).single(),
    // RLS sayesinde sadece üyesi olduğum gruplar gelir; group_members(count) = üye sayısı
    supabase
      .from("groups")
      .select("id, ad, group_members(count)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <header className="flex items-center justify-between">
        <span className="text-xl font-bold text-teal-700">🐱 Kitty</span>
        <form action={cikisYap}>
          <Button type="submit" variant="ghost" size="sm">
            Çıkış yap
          </Button>
        </form>
      </header>

      <section>
        <h1 className="text-2xl font-bold">
          Merhaba {profil?.ad_soyad ?? user.email} 
        </h1>
        <p className="text-muted-foreground">Gruplarını buradan yönet.</p>
      </section>

      <GrupOlusturFormu />

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold text-muted-foreground">
          Gruplarım
        </h2>

        {!gruplar?.length ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Henüz bir grubun yok</CardTitle>
              <CardDescription>
                Yukarıdan ilk grubunu kur ya da bir davet linkine tıkla.
              </CardDescription>
            </CardHeader>
          </Card>
        ) : (
          gruplar.map((g) => (
            <Link
              key={g.id}
              href={`/gruplar/${g.id}`}
              className="block rounded-xl transition hover:opacity-80"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{g.ad}</CardTitle>
                  <CardDescription>
                    {g.group_members[0]?.count ?? 0} üye
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))
        )}
      </section>
    </main>
  );
}
