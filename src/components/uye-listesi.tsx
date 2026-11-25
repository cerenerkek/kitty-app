"use client";

import { useState, useTransition } from "react";
import { DoorOpen, Trash2 } from "lucide-react";
import { gruptanCik, uyeyiCikar } from "@/app/gruplar/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OnayPenceresi } from "@/components/onay-penceresi";

export type ListeUyesi = { id: string; ad: string; rol: "admin" | "uye" };

type Islem = { tur: "cikar"; uye: ListeUyesi } | { tur: "cik" } | null;

type Uyari = { baslik: string; mesaj: string } | null;

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
  const [uyari, setUyari] = useState<Uyari>(null);
  const [bekliyor, baslat] = useTransition();

  const tekYoneticiyim =
    yoneticiyim && uyeler.filter((u) => u.rol === "admin").length === 1;

  function cikarmayiDene(uye: ListeUyesi) {
    if ((bakiyeler[uye.id] ?? 0) !== 0) {
      setUyari({
        baslik: `${uye.ad} çıkarılamaz`,
        mesaj: "Bu kişinin borcu ya da alacağı var. Önce borç kapanmalı, bakiyesi 0 olunca gruptan çıkarabilirsin.",
      });
      return;
    }
    setIslem({ tur: "cikar", uye });
  }

  function cikmayiDene() {
    if (uyeler.length === 1) {
      setUyari({
        baslik: "Gruptan ayrılamazsın",
        mesaj: "Gruptaki tek kişi sensin. Ayrılmak yerine grubu silebilirsin.",
      });
      return;
    }
    if ((bakiyeler[benimId] ?? 0) !== 0) {
      setUyari({
        baslik: "Gruptan ayrılamazsın",
        mesaj: "Önce borcunun ya da alacağının kapanması gerekiyor. Bakiyen 0 olunca gruptan çıkabilirsin.",
      });
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
      if (sonuc && "hata" in sonuc) {
        setUyari({ baslik: "İşlem yapılamadı", mesaj: sonuc.hata });
      }
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
                    title="Gruptan çıkar"
                    className="inline-flex size-8 items-center justify-center rounded-md text-destructive transition hover:bg-destructive/10 disabled:opacity-50"
                  >
                    <Trash2 className="size-4" aria-hidden />
                  </button>
                )}
              </span>
            </li>
          ))}
        </ul>

        <div className="border-t pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={cikmayiDene}
            disabled={bekliyor}
          >
            <DoorOpen aria-hidden />
            {bekliyor ? "İşleniyor…" : "Gruptan çık"}
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

      <OnayPenceresi
        acik={uyari !== null}
        baslik={uyari?.baslik ?? ""}
        bilgi
        onVazgec={() => setUyari(null)}
      >
        <p>{uyari?.mesaj}</p>
      </OnayPenceresi>
    </Card>
  );
}