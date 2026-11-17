import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Sunucuda çalışan kodlar (sayfalar, actions) için Supabase bağlantısı.
// Oturum bilgisi tarayıcının çerezlerinden (cookie) okunur.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Sayfa (Server Component) içinden çağrılınca çerez yazılamaz.
            // Sorun değil: oturumu proxy zaten yeniliyor.
          }
        },
      },
    },
  );
}
