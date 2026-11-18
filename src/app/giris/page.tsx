import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { GirisFormu } from "@/components/giris-formu";

export const metadata: Metadata = { title: "Giriş yap · Kitty" };

export default function GirisSayfasi() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-6 px-4 py-10">
      <div className="text-center">
        <Link href="/" className="text-4xl" aria-label="Ana sayfa">
          🐱
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-teal-700">
          Tekrar hoş geldin
        </h1>
        <p className="text-sm text-muted-foreground">Hesabına giriş yap.</p>
      </div>

      <Suspense fallback={<div className="h-56" />}>
        <GirisFormu />
      </Suspense>

      <p className="text-center text-sm text-muted-foreground">
        Hesabın yok mu?{" "}
        <Link href="/kayit" className="font-medium text-teal-700 underline">
          Kayıt ol
        </Link>
      </p>
    </main>
  );
}
