"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Button, buttonVariants } from "@/components/ui/button";

export default function HataSayfasi({
  error,
  retry,
}: {
  error: unknown;
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const hataKodu =
    error instanceof Error && "digest" in error
      ? String((error as Error & { digest?: string }).digest ?? "")
      : "";

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col items-center justify-center gap-4 px-4 py-10 text-center">
      <span className="text-6xl" aria-hidden>
        😿
      </span>
      <h1 className="text-2xl font-bold">Bir şeyler ters gitti</h1>
      <p className="text-muted-foreground">
        Beklenmeyen bir hata oluştu. Verilerin güvende. Tekrar denemek genellikle
        işe yarar.
      </p>
      <div className="flex gap-2">
        <Button onClick={() => retry()}>Tekrar dene</Button>
        <Link href="/gruplar" className={buttonVariants({ variant: "outline" })}>
          Gruplarıma dön
        </Link>
      </div>
      {hataKodu && (
        <p className="text-xs text-muted-foreground">Hata kodu: {hataKodu}</p>
      )}
    </main>
  );
}