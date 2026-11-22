"use client";

import { useActionState } from "react";
import { odemeKaydet } from "@/app/odemeler/actions";
import { kurusuMetneCevir } from "@/lib/para";
import { Button } from "@/components/ui/button";

export function OdendiButonu({
  grupId,
  kimden,
  kime,
  tutar,
  bugun,
  etiket,
  onayMetni,
}: {
  grupId: string;
  kimden: string;
  kime: string;
  tutar: number; // kuruş
  bugun: string;
  etiket: string; // "Ödedim" ya da "Aldım"
  onayMetni: string;
}) {
  const [durum, formAction, bekliyor] = useActionState(odemeKaydet, undefined);

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        // Ödeme kaydı silinemiyor → yanlışlıkla dokunmaya karşı onay iste
        if (!window.confirm(onayMetni)) e.preventDefault();
      }}
      className="flex flex-col items-end gap-1"
    >
      <input type="hidden" name="grupId" value={grupId} />
      <input type="hidden" name="odeyen" value={kimden} />
      <input type="hidden" name="alan" value={kime} />
      <input type="hidden" name="tutar" value={kurusuMetneCevir(tutar)} />
      <input type="hidden" name="tarih" value={bugun} />
      <Button type="submit" size="sm" disabled={bekliyor}>
        {bekliyor ? "Kaydediliyor..." : etiket}
      </Button>
      {durum?.hata && (
        <p role="alert" className="text-xs text-destructive">
          {durum.hata}
        </p>
      )}
    </form>
  );
}
