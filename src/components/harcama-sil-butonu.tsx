"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { harcamaSil } from "@/app/harcamalar/actions";
import { OnayPenceresi } from "@/components/onay-penceresi";

export function HarcamaSilButonu({
  harcamaId,
  aciklama,
  tutarMetni,
  sonraGit,
}: {
  harcamaId: string;
  aciklama: string;
  tutarMetni: string;
  sonraGit?: string;
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);
  const [acik, setAcik] = useState(false);

  function sil() {
    setAcik(false);
    setHata(null);
    baslat(async () => {
      const sonuc = await harcamaSil(harcamaId);
      if ("hata" in sonuc) setHata(sonuc.hata);
      else if (sonraGit) router.push(sonraGit);
    });
  }

  return (
    <div className="flex flex-col items-end">
      <button
        type="button"
        onClick={() => setAcik(true)}
        disabled={bekliyor}
        aria-label={`"${aciklama}" harcamasını sil`}
        title="Harcamayı sil"
        className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
      >
        <Trash2
          className={`size-4 ${bekliyor ? "animate-pulse" : ""}`}
          aria-hidden
        />
      </button>
      {hata && (
        <p role="alert" className="max-w-40 text-right text-xs text-destructive">
          {hata}
        </p>
      )}

      <OnayPenceresi
        acik={acik}
        baslik="Harcama silinsin mi?"
        onayEtiketi="Sil"
        tehlikeli
        onVazgec={() => setAcik(false)}
        onOnayla={sil}
      >
        <p>
          <span className="font-medium text-foreground">{aciklama}</span> ·{" "}
          {tutarMetni}
        </p>
        <p>
          Bakiyeler yeniden hesaplanır. Silme işlemi değişiklik geçmişinde
          görünür.
        </p>
      </OnayPenceresi>
    </div>
  );
}
