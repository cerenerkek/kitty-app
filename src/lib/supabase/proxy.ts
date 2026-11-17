import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const KORUMALI_SAYFALAR = ["/gruplar"];
const GIRIS_SAYFALARI = ["/giris", "/kayit"];

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value),
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  // Oturumu doğrular ve süresi dolmak üzereyse yeniler.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const yol = request.nextUrl.pathname;

  // Giriş yapmamış biri korumalı sayfaya gelirse → /giris
  if (!user && KORUMALI_SAYFALAR.some((s) => yol.startsWith(s))) {
    return yonlendir(request, response, "/giris");
  }

  // Giriş yapmış biri /giris veya /kayit sayfasına gelirse → /gruplar
  if (user && GIRIS_SAYFALARI.some((s) => yol.startsWith(s))) {
    return yonlendir(request, response, "/gruplar");
  }

  return response;
}

// Yönlendirirken yenilenmiş oturum çerezlerini kaybetmemek için kopyalarız.
function yonlendir(
  request: NextRequest,
  response: NextResponse,
  hedef: string,
) {
  const url = request.nextUrl.clone();
  url.pathname = hedef;
  const yonlendirme = NextResponse.redirect(url);
  response.cookies.getAll().forEach((cerez) => yonlendirme.cookies.set(cerez));
  return yonlendirme;
}
