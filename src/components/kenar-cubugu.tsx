"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus } from "lucide-react";

// Grup menüsü: bilgisayarda solda sabit, telefonda açılır panelin içinde.
// Hangi grubun açık olduğunu adresten anlar.
export function KenarCubugu({
  gruplar,
  onSec,
}: {
  gruplar: { id: string; ad: string }[];
  onSec?: () => void; // telefonda: bir bağlantıya dokununca paneli kapat
}) {
  const yol = usePathname();
  const satir =
    "flex items-center gap-2 truncate rounded-md px-2 py-1.5 text-sm transition";
  const pasif = "text-muted-foreground hover:bg-accent hover:text-foreground";
  const aktif = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";

  return (
    <nav
      aria-label="Gruplarım"
      className="flex flex-col gap-1 p-3"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) onSec?.();
      }}
    >
      <Link
        href="/gruplar"
        aria-current={yol === "/gruplar" ? "page" : undefined}
        className={`${satir} ${yol === "/gruplar" ? aktif : pasif}`}
      >
        <LayoutGrid className="size-4 shrink-0" aria-hidden />
        Tüm gruplar
      </Link>

      <p className="mt-4 px-2 text-xs font-medium text-muted-foreground">
        Gruplarım
      </p>
      {gruplar.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground">
          Henüz grup yok
        </p>
      ) : (
        gruplar.map((g) => {
          const buGrup =
            yol === `/gruplar/${g.id}` || yol.startsWith(`/gruplar/${g.id}/`);
          return (
            <Link
              key={g.id}
              href={`/gruplar/${g.id}`}
              aria-current={buGrup ? "page" : undefined}
              className={`${satir} ${buGrup ? aktif : pasif}`}
            >
              <span className="truncate">{g.ad}</span>
            </Link>
          );
        })
      )}

      <Link
        href="/gruplar#yeni-grup"
        className={`${satir} mt-2 font-medium text-marka hover:bg-accent`}
      >
        <Plus className="size-4 shrink-0" aria-hidden />
        Yeni grup
      </Link>
    </nav>
  );
}
