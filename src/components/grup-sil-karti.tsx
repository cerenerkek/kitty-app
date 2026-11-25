"use client";

import { useActionState, useRef, useState } from "react";
import { grupSil } from "@/app/gruplar/actions";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OnayPenceresi } from "@/components/onay-penceresi";

export function GrupSilKarti({
  grupId,
  grupAdi,
  acikBorcVar,
}: {
  grupId: string;
  grupAdi: string;
  acikBorcVar: boolean;
}) {
  const [durum, formAction, bekliyor] = useActionState(grupSil, undefined);
  const [acik, setAcik] = useState(false);
  const form = useRef<HTMLFormElement>(null);

  return (
    <>
      <form
        ref={form}
        action={formAction}
        className="flex flex-col gap-2 rounded-xl border border-destructive/30 bg-card px-4 py-3"
      >
        <input type="hidden" name="grupId" value={grupId} />
        <Button
          type="button"
          variant="destructive"
          disabled={bekliyor}
          onClick={() => setAcik(true)}
        >
          <Trash2 aria-hidden />
          {bekliyor ? "Siliniyor…" : "Grubu sil"}
        </Button>
        {durum?.hata && (
          <p role="alert" className="text-sm text-destructive">
            {durum.hata}
          </p>
        )}
      </form>

      <OnayPenceresi
        acik={acik}
        baslik={`"${grupAdi}" silinsin mi?`}
        onayEtiketi="Grubu sil"
        tehlikeli
        onVazgec={() => setAcik(false)}
        onOnayla={() => {
          setAcik(false);
          form.current?.requestSubmit();
        }}
      >
        <p>
          Bütün harcamalar, ödemeler, fişler ve geçmiş kalıcı olarak silinir.
          Bu işlem geri alınamaz.
        </p>
        {acikBorcVar && (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-destructive">
            Grupta kapanmamış borçlar var. Bunların kaydı da kaybolur.
          </p>
        )}
      </OnayPenceresi>
    </>
  );
}
