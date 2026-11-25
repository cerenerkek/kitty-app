"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

export function OnayPenceresi({
  acik,
  baslik,
  children,
  onayEtiketi,
  tehlikeli = false,
  bilgi = false,
  onOnayla,
  onVazgec,
}: {
  acik: boolean;
  baslik: string;
  children: ReactNode;
  onayEtiketi?: string;
  tehlikeli?: boolean;
  bilgi?: boolean;
  onOnayla?: () => void;
  onVazgec: () => void;
}) {
  const pencere = useRef<HTMLDialogElement>(null);
  const baslikId = useId();

  useEffect(() => {
    const d = pencere.current;
    if (!d) return;
    if (acik && !d.open) d.showModal();
    if (!acik && d.open) d.close();
  }, [acik]);

  return (
    <dialog
      ref={pencere}
      onCancel={(e) => {
        e.preventDefault();
        onVazgec();
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onVazgec();
      }}
      aria-labelledby={baslikId}
      className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-xl border bg-card p-0 text-card-foreground shadow-xl backdrop:bg-black/50 backdrop:backdrop-blur-[2px]"
    >
      <div className="flex flex-col gap-4 p-5">
        <div className="flex flex-col gap-2">
          <h2 id={baslikId} className="text-base font-semibold">
            {baslik}
          </h2>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            {children}
          </div>
        </div>
        {bilgi ? (
          <div className="flex justify-end">
            <Button type="button" onClick={onVazgec} autoFocus>
              Tamam
            </Button>
          </div>
        ) : (
          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button type="button" variant="outline" onClick={onVazgec} autoFocus>
              Vazgeç
            </Button>
            <Button
              type="button"
              variant={tehlikeli ? "destructive" : "default"}
              onClick={onOnayla}
              className={tehlikeli ? "bg-destructive text-white hover:bg-destructive/90 dark:bg-destructive dark:text-neutral-950 dark:hover:bg-destructive/90" : undefined}
            >
              {onayEtiketi}
            </Button>
          </div>
        )}
      </div>
    </dialog>
  );
}
