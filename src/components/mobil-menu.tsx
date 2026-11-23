"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Menu, X } from "lucide-react";
import { KenarCubugu } from "@/components/kenar-cubugu";

export function MobilMenu({
  gruplar,
}: {
  gruplar: { id: string; ad: string }[];
}) {
  const [acik, setAcik] = useState(false);

  useEffect(() => {
    if (!acik) return;
    const tus = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAcik(false);
    };
    document.addEventListener("keydown", tus);
    const eskiTasma = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", tus);
      document.body.style.overflow = eskiTasma;
    };
  }, [acik]);

  return (
    <div className="lg:hidden">
      <button
        type="button"
        onClick={() => setAcik(true)}
        aria-label="Grup menüsünü aç"
        aria-expanded={acik}
        className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
      >
        <Menu className="size-5" aria-hidden />
      </button>

      {acik &&
        createPortal(
          <div className="fixed inset-0 z-50 lg:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setAcik(false)}
              aria-hidden
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Grup menüsü"
              className="absolute inset-y-0 left-0 flex w-72 max-w-[50vw] flex-col border-r bg-sidebar shadow-xl"
            >
              <div className="flex h-14 items-center justify-between border-b px-4">
                <span className="text-lg font-bold text-marka">🐱 Kitty</span>
                <button
                  type="button"
                  onClick={() => setAcik(false)}
                  aria-label="Menüyü kapat"
                  autoFocus
                  className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
                >
                  <X className="size-5" aria-hidden />
                </button>
              </div>
              <div className="overflow-y-auto">
                <KenarCubugu gruplar={gruplar} onSec={() => setAcik(false)} />
              </div>
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
