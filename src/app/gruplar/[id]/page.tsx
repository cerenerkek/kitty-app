import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DavetPaylas } from "@/components/davet-paylas";

export const metadata: Metadata = { title: "Grup · Kitty" };

const UUID_KALIBI =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Üye satırının şekli: her üyenin TEK bir profili var (dizi değil)
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

  // RLS: üyesi değilsen grup hiç yokmuş gibi görünür → 404
  const { data: grup } = await supabase
    .from("groups")
    .select("id, ad")
    .eq("id", id)
    .maybeSingle();
  if (!grup) notFound();

  // Üyeler + adları (profiles tablosuyla birleştirme)
  const { data: uyeler } = await supabase
    .from("group_members")
    .select("user_id, rol, profiles(ad_soyad)")
    .eq("group_id", id)
    .order("katilma_tarihi")
    .overrideTypes<Uye[], { merge: false }>();

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <Link href="/gruplar" className="text-sm text-muted-foreground">
        ← Gruplarım
      </Link>

      <h1 className="text-2xl font-bold">{grup.ad}</h1>

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

      <p className="text-sm text-muted-foreground">Harcamalar yarın burada.</p>
    </main>
  );
}
