import Link from "next/link";
import type { Metadata } from "next";
import { KayitFormu } from "@/components/kayit-formu";
import { Suspense } from "react";

export const metadata: Metadata = { title: "Kayıt ol · Kitty" };

export default function KayitSayfasi() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <Link href="/" className="text-4xl" aria-label="Ana sayfa">
          🐱
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-marka">Kitty&apos;ye katıl</h1>
        <p className="text-sm text-muted-foreground">
          Grubunu kur, harcamaları birlikte takip et.
        </p>
      </div>

            <Suspense fallback={<div className="h-80" />}>
        <KayitFormu />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Zaten hesabın var mı?{" "}
        <Link href="/giris" className="font-medium text-marka underline">
          Giriş yap
        </Link>
      </p>
    </main>
  );
}