import Link from "next/link";
import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { GrupOlusturFormu } from "@/components/grup-olustur-formu";

export const metadata: Metadata = { title: "Gruplarım · Kitty" };

export default async function GruplarSayfasi() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  const [{ data: profil }, { data: gruplar }] = await Promise.all([
    supabase.from("profiles").select("ad_soyad").eq("id", user.id).single(),
    supabase
      .from("groups")
      .select("id, ad, group_members(count)")
      .order("created_at", { ascending: false }),
  ]);

  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:max-w-5xl lg:px-8">
      <section>
        <h1 className="text-2xl font-bold">
          Merhaba {profil?.ad_soyad ?? user.email}
        </h1>
        <p className="text-muted-foreground">Gruplarını buradan yönet.</p>
      </section>

      <div id="yeni-grup" className="scroll-mt-20 lg:max-w-md">
        <GrupOlusturFormu />
      </div>

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
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {gruplar.map((g) => (
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
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
