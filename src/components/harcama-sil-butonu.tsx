"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { harcamaSil } from "@/app/harcamalar/actions";

export function HarcamaSilButonu({
  harcamaId,
  aciklama,
  tutarMetni,
  sonraGit,
}: {
  harcamaId: string;
  aciklama: string;
  tutarMetni: string; // "₺1.000,00"
  sonraGit?: string; // silindikten sonra gidilecek sayfa (detay sayfasından silerken)
}) {
  const router = useRouter();
  const [bekliyor, baslat] = useTransition();
  const [hata, setHata] = useState<string | null>(null);

  function sil() {
    // Silme geri alınamaz → onay iste
    const onay = window.confirm(
      `"${aciklama}" (${tutarMetni}) silinsin mi?\n\n` +
        "Bakiyeler yeniden hesaplanır. Silme işlemi değişiklik geçmişinde görünür.",
    );
    if (!onay) return;

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
        onClick={sil}
        disabled={bekliyor}
        aria-label={`"${aciklama}" harcamasını sil`}
        className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
      >
        {bekliyor ? "Siliniyor…" : "🗑️ Sil"}
      </button>
      {hata && (
        <p role="alert" className="max-w-40 text-right text-xs text-destructive">
          {hata}
        </p>
      )}
    </div>
  );
}
