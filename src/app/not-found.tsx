import Link from "next/link";
import type { Metadata } from "next";
import { buttonVariants } from "@/components/ui/button";

export const metadata: Metadata = { title: "Sayfa bulunamadı · Kitty" };

export default function BulunamadiSayfasi() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span className="text-6xl" aria-hidden>
        🙀
      </span>
      <h1 className="text-2xl font-bold">Burada bir şey yok</h1>
      <p className="text-muted-foreground">
        Aradığın sayfa bulunamadı. Link hatalı olabilir ya da bu gruba erişimin
        olmayabilir.
      </p>
      <div className="flex gap-2">
        <Link href="/gruplar" className={buttonVariants()}>
          Gruplarıma git
        </Link>
        <Link href="/" className={buttonVariants({ variant: "outline" })}>
          Ana sayfa
        </Link>
      </div>
    </main>
  );
}