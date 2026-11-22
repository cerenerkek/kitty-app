import Link from "next/link";
import { LogOut } from "lucide-react";
import { cikisYap } from "@/app/auth/actions";
import { TemaDugmesi } from "@/components/tema-dugmesi";

// Giriş yapılmış bütün sayfalarda en üstte duran çubuk (telefon ve bilgisayar)
export function UstCubuk({ solMenu }: { solMenu?: React.ReactNode }) {
  return (
    <header className="sticky top-0 z-20 border-b bg-card/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1600px] items-center justify-between px-4 lg:px-6">
        <div className="flex items-center gap-2">
          {/* Telefonda ☰ grup menüsü (bilgisayarda gizli) */}
          {solMenu}
          <Link
            href="/gruplar"
            className="flex items-center gap-2 text-lg font-bold text-marka"
          >
            <span aria-hidden>🐱</span> Kitty
          </Link>
        </div>
        <div className="flex items-center gap-1">
          <TemaDugmesi />
          <form action={cikisYap}>
            <button
              type="submit"
              className="inline-flex h-8 items-center gap-1.5 rounded-md px-2 text-sm text-muted-foreground transition hover:bg-accent hover:text-foreground"
            >
              <LogOut className="size-4" aria-hidden />
              <span className="hidden sm:inline">Çıkış yap</span>
              <span className="sr-only sm:hidden">Çıkış yap</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
