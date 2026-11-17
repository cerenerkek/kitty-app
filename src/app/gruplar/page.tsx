import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { cikisYap } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export const metadata: Metadata = { title: "Gruplarım · Kitty" };

export default async function GruplarSayfasi() {
  const supabase = await createClient();

  // İkinci güvenlik kontrolü (ilki proxy'de)
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/giris");

  // Veritabanından profil okuma; RLS sayesinde sadece kendi satırı gelir
  const { data: profil } = await supabase
    .from("profiles")
    .select("ad_soyad")
    .eq("id", user.id)
    .single();

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
          Merhaba {profil?.ad_soyad ?? user.email} 👋
        </h1>
        <p className="text-muted-foreground">Gruplarını burada göreceksin.</p>
      </section>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Henüz bir grubun yok</CardTitle>
          <CardDescription>
            Grup kurma ve davet etme özelliği yarın geliyor.
          </CardDescription>
        </CardHeader>
      </Card>
    </main>
  );
}
