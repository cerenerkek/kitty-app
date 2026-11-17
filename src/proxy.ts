import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/proxy";

// Next.js 16'da "middleware"in yeni adı "proxy".
// Her sayfa isteğinden ÖNCE çalışır.
export async function proxy(request: NextRequest) {
  return await updateSession(request);
}

export const config = {
  // Resimler ve Next.js'in iç dosyaları hariç tüm isteklerde çalış
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
