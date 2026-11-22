import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { KenarCubugu } from "@/components/kenar-cubugu";
import { MobilMenu } from "@/components/mobil-menu";

// Grup listesi: hem soldaki menü hem telefondaki açılır menü kullanır.
// cache() → aynı istek içinde iki kez çağrılsa da veritabanına BİR kez gidilir.
// RLS sayesinde sadece üyesi olduğun gruplar gelir (ayrıca getUser gerekmez).
const gruplariGetir = cache(async () => {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("id, ad")
    .order("created_at", { ascending: false });
  return data ?? [];
});

// Bilgisayar: soldaki sabit menü
export async function GrupMenusu() {
  return <KenarCubugu gruplar={await gruplariGetir()} />;
}

// Telefon: üst çubuktaki ☰ düğmesi ve açılır panel
export async function MobilGrupMenusu() {
  return <MobilMenu gruplar={await gruplariGetir()} />;
}
