"use client";

import { useActionState } from "react";
import { Plus } from "lucide-react";
import { odemeKaydet } from "@/app/odemeler/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Kisi = { id: string; ad: string };

const SECIM_STILI =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function OdemeFormu({
  grupId,
  kisiler,
  benimId,
  bugun,
}: {
  grupId: string;
  kisiler: Kisi[];
  benimId: string;
  bugun: string;
}) {
  const [durum, formAction, bekliyor] = useActionState(odemeKaydet, undefined);
  const d = durum?.degerler;

  const ilkDiger = kisiler.find((k) => k.id !== benimId);
  if (!ilkDiger) return null;

  const secenekler = kisiler.map((k) => (
    <option key={k.id} value={k.id}>
      {k.ad}
      {k.id === benimId ? " (sen)" : ""}
    </option>
  ));

  return (
    <details className="rounded-lg border px-3 py-2">
      <summary className="cursor-pointer text-sm font-medium text-marka">
        <Plus className="mr-1 inline size-4 align-[-3px]" aria-hidden />
        Başka bir ödeme kaydet (kısmi ya da farklı tutar)
      </summary>

      <form action={formAction} className="mt-3 flex flex-col gap-3">
        <input type="hidden" name="grupId" value={grupId} />
        <input type="hidden" name="tarih" value={bugun} />

        <div className="grid grid-cols-2 gap-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="odeme-odeyen">Kim ödedi?</Label>
            <select
              id="odeme-odeyen"
              name="odeyen"
              defaultValue={d?.odeyen ?? benimId}
              className={SECIM_STILI}
            >
              {secenekler}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="odeme-alan">Kime?</Label>
            <select
              id="odeme-alan"
              name="alan"
              defaultValue={d?.alan ?? ilkDiger.id}
              className={SECIM_STILI}
            >
              {secenekler}
            </select>
          </div>
        </div>

        <div className="flex items-end gap-2">
          <div className="flex flex-1 flex-col gap-1.5">
            <Label htmlFor="odeme-tutar">Tutar (₺)</Label>
            <Input
              id="odeme-tutar"
              name="tutar"
              inputMode="decimal"
              placeholder="0,00"
              defaultValue={d?.tutar}
              autoComplete="off"
              required
            />
          </div>
          <Button type="submit" disabled={bekliyor}>
            {bekliyor ? "Kaydediliyor..." : "Kaydet"}
          </Button>
        </div>

        {durum?.hata && (
          <p role="alert" className="text-sm text-destructive">
            {durum.hata}
          </p>
        )}
        {durum?.basarili && (
          <p role="status" className="text-sm text-marka">
            Ödeme kaydedildi ✓
          </p>
        )}
      </form>
    </details>
  );
}