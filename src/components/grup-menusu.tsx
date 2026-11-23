import { cache } from "react";
import { connection } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { KenarCubugu } from "@/components/kenar-cubugu";
import { MobilMenu } from "@/components/mobil-menu";

const gruplariGetir = cache(async () => {
  await connection();
  const supabase = await createClient();
  const { data } = await supabase
    .from("groups")
    .select("id, ad")
    .order("created_at", { ascending: false });
  return data ?? [];
});

export async function GrupMenusu() {
  return <KenarCubugu gruplar={await gruplariGetir()} />;
}

export async function MobilGrupMenusu() {
  return <MobilMenu gruplar={await gruplariGetir()} />;
}
