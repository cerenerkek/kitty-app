"use client";

import { useActionState, useRef, useState } from "react";
import { odemeKaydet } from "@/app/odemeler/actions";
import { kurusuMetneCevir } from "@/lib/para";
import { Button } from "@/components/ui/button";
import { OnayPenceresi } from "@/components/onay-penceresi";

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
  tutar: number;
  bugun: string;
  etiket: string;
  onayMetni: string;
}) {
  const [durum, formAction, bekliyor] = useActionState(odemeKaydet, undefined);
  const [acik, setAcik] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={form}
        action={formAction}
        className="flex flex-col items-end gap-1"
      >
        <input type="hidden" name="grupId" value={grupId} />
        <input type="hidden" name="odeyen" value={kimden} />
        <input type="hidden" name="alan" value={kime} />
        <input type="hidden" name="tutar" value={kurusuMetneCevir(tutar)} />
        <input type="hidden" name="tarih" value={bugun} />
        <Button
          type="button"
          size="sm"
          disabled={bekliyor}
          onClick={() => setAcik(true)}
        >
          {bekliyor ? "Kaydediliyor..." : etiket}
        </Button>
        {durum?.hata && (
          <p role="alert" className="text-xs text-destructive">
            {durum.hata}
          </p>
        )}
      </form>

      <OnayPenceresi
        acik={acik}
        baslik="Ödeme kaydedilsin mi?"
        onayEtiketi={etiket}
        onVazgec={() => setAcik(false)}
        onOnayla={() => {
          setAcik(false);
          form.current?.requestSubmit();
        }}
      >
        <p>{onayMetni}</p>
      </OnayPenceresi>
    </>
  );
}
