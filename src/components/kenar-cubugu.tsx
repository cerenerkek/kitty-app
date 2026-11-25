"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Plus } from "lucide-react";

export function KenarCubugu({
  gruplar,
  onSec,
}: {
  gruplar: { id: string; ad: string }[];
  onSec?: () => void;
}) {
  const yol = usePathname();
  const satir =
    "flex items-center gap-2 rounded-md px-2 py-1.5 text-sm transition dar:justify-center dar:px-0";
  const pasif = "text-muted-foreground hover:bg-accent hover:text-foreground";
  const aktif = "bg-sidebar-accent font-medium text-sidebar-accent-foreground";
  const yazi = "truncate dar:sr-only";

  return (
    <nav
      aria-label="Gruplarım"
      className="flex flex-col gap-1 p-3 dar:px-2"
      onClick={(e) => {
        if ((e.target as HTMLElement).closest("a")) onSec?.();
      }}
    >
      <Link
        href="/gruplar"
        title="Tüm gruplar"
        aria-current={yol === "/gruplar" ? "page" : undefined}
        className={`${satir} ${yol === "/gruplar" ? aktif : pasif}`}
      >
        <LayoutGrid className="size-4 shrink-0" aria-hidden />
        <span className={yazi}>Tüm gruplar</span>
      </Link>

      <p className="mt-4 px-2 text-xs font-medium text-muted-foreground dar:hidden">
        Gruplarım
      </p>
      {gruplar.length === 0 ? (
        <p className="px-2 py-1.5 text-sm text-muted-foreground dar:hidden">
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
              title={g.ad}
              aria-current={buGrup ? "page" : undefined}
              className={`${satir} ${buGrup ? aktif : pasif} dar:hidden`}
            >
              <span className="truncate">{g.ad}</span>
            </Link>
          );
        })
      )}

      <Link
        href="/gruplar#yeni-grup"
        title="Yeni grup"
        className={`${satir} mt-2 font-medium text-marka hover:bg-accent`}
      >
        <Plus className="size-4 shrink-0" aria-hidden />
        <span className={yazi}>Yeni grup</span>
      </Link>
    </nav>
  );
}
