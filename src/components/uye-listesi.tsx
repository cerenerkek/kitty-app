"use client";

import { useState, useTransition } from "react";
import { gruptanCik, uyeyiCikar } from "@/app/gruplar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnayPenceresi } from "@/components/onay-penceresi";

export type ListeUyesi = { id: string; ad: string; rol: "admin" | "uye" };

type Islem = { tur: "cikar"; uye: ListeUyesi } | { tur: "cik" } | null;

export function UyeListesi({
  grupId,
  uyeler,
  benimId,
  yoneticiyim,
  bakiyeler,
}: {
  grupId: string;
  uyeler: ListeUyesi[];
  benimId: string;
  yoneticiyim: boolean;
  bakiyeler: Record<string, number>;
}) {
  const [islem, setIslem] = useState<Islem>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [bekliyor, baslat] = useTransition();

  const tekYoneticiyim =
    yoneticiyim && uyeler.filter((u) => u.rol === "admin").length === 1;

  function cikarmayiDene(uye: ListeUyesi) {
    setHata(null);
    if ((bakiyeler[uye.id] ?? 0) !== 0) {
      setHata(
        `${uye.ad} adlı kişinin borcu ya da alacağı kapanmadan gruptan çıkarılamaz.`,
      );
      return;
    }
    setIslem({ tur: "cikar", uye });
  }

  function cikmayiDene() {
    setHata(null);
    if (uyeler.length === 1) {
      setHata("Gruptaki tek kişi sensin. Ayrılmak yerine grubu silebilirsin.");
      return;
    }
    if ((bakiyeler[benimId] ?? 0) !== 0) {
      setHata(
        "Gruptan ayrılmadan önce borcunun ya da alacağının kapanması gerekiyor.",
      );
      return;
    }
    setIslem({ tur: "cik" });
  }

  function onayla() {
    const secilen = islem;
    setIslem(null);
    if (!secilen) return;
    baslat(async () => {
      const sonuc =
        secilen.tur === "cik"
          ? await gruptanCik(grupId)
          : await uyeyiCikar(grupId, secilen.uye.id);
      if (sonuc && "hata" in sonuc) setHata(sonuc.hata);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Üyeler ({uyeler.length})</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-2">
          {uyeler.map((u) => (
            <li key={u.id} className="flex items-center justify-between gap-2">
              <span className="min-w-0 truncate">
                {u.ad}
                {u.id === benimId && (
                  <span className="text-muted-foreground"> (sen)</span>
                )}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                {u.rol === "admin" && (
                  <span className="rounded-full bg-vurgu px-2 py-0.5 text-xs font-medium text-vurgu-yazi">
                    Yönetici
                  </span>
                )}
                {yoneticiyim && u.id !== benimId && (
                  <button
                    type="button"
                    onClick={() => cikarmayiDene(u)}
                    disabled={bekliyor}
                    aria-label={`${u.ad} adlı kişiyi gruptan çıkar`}
                    className="rounded-md px-1.5 py-0.5 text-xs text-muted-foreground hover:text-destructive disabled:opacity-50"
                  >
                    Çıkar
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>

        {hata && (
          <p role="alert" className="text-sm text-destructive">
            {hata}
          </p>
        )}

        <div className="border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cikmayiDene}
            disabled={bekliyor}
          >
            {bekliyor ? "İşleniyor…" : "🚪 Gruptan çık"}
          </Button>
        </div>
      </CardContent>

      <OnayPenceresi
        acik={islem !== null}
        baslik={
          islem?.tur === "cikar"
            ? `${islem.uye.ad} gruptan çıkarılsın mı?`
            : "Gruptan çıkılsın mı?"
        }
        onayEtiketi={islem?.tur === "cikar" ? "Çıkar" : "Gruptan çık"}
        tehlikeli
        onVazgec={() => setIslem(null)}
        onOnayla={onayla}
      >
        {islem?.tur === "cikar" ? (
          <p>
            Bu kişi grubun harcamalarını artık göremez. Eski kayıtlarda adı
            &quot;ayrıldı&quot; etiketiyle görünmeye devam eder. Tekrar katılması
            için yeni bir davet linki gerekir.
          </p>
        ) : (
          <>
            <p>
              Grubun harcamalarını artık göremezsin. Tekrar katılmak için yeni
              bir davet linki gerekir.
            </p>
            {tekYoneticiyim && (
              <p>Yöneticiliğin gruptaki en eski üyeye geçer.</p>
            )}
          </>
        )}
      </OnayPenceresi>
    </Card>
  );
}