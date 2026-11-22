import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTL } from "@/lib/para";
import { kategoriBilgisi } from "@/lib/kategoriler";
import { formatGun } from "@/lib/tarih";
import { HarcamaSilButonu } from "@/components/harcama-sil-butonu";

export type Harcama = {
  id: string;
  aciklama: string;
  tutar_kurus: number;
  kategori: string;
  tarih: string; // "2026-11-19"
  odeyen_id: string;
  olusturan_id: string | null;
  fis_yolu: string | null;
  expense_splits: { user_id: string; pay_kurus: number }[];
};

export function HarcamaListesi({
  harcamalar,
  isimler,
  benimId,
  yoneticiyim,
  fisLinkleri,
}: {
  harcamalar: Harcama[];
  isimler: Map<string, string>;
  benimId: string;
  yoneticiyim: boolean;
  fisLinkleri: Map<string, string>; // fiş yolu → 1 saatlik imzalı link
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Harcamalar</CardTitle>
      </CardHeader>
      <CardContent>
        {harcamalar.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz harcama yok. İlkini yukarıdan ekle.
          </p>
        ) : (
          <ul className="flex flex-col divide-y">
            {harcamalar.map((h) => {
              const kategori = kategoriBilgisi(h.kategori);
              const odeyenMetni =
                h.odeyen_id === benimId
                  ? "Sen ödedin"
                  : `${isimler.get(h.odeyen_id) ?? "Eski üye"} ödedi`;
              const benimPayim = h.expense_splits.find(
                (s) => s.user_id === benimId,
              )?.pay_kurus;
              // Veritabanı kuralıyla aynı: ekleyen kişi ya da yönetici silebilir
              const silebilirim = h.olusturan_id === benimId || yoneticiyim;
              const fisLinki = h.fis_yolu ? fisLinkleri.get(h.fis_yolu) : undefined;

              return (
                <li
                  key={h.id}
                  className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    role="img"
                    aria-label={kategori.ad}
                    className="text-2xl"
                  >
                    {kategori.emoji}
                  </span>

                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{h.aciklama}</p>
                    <p className="text-xs text-muted-foreground">
                      {odeyenMetni} · {h.expense_splits.length} kişi ·{" "}
                      {formatGun(h.tarih)}
                      {fisLinki && (
                        <>
                          {" · "}
                          <a
                            href={fisLinki}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-teal-700 underline"
                          >
                            📎 Fiş
                          </a>
                        </>
                      )}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold tabular-nums">
                      {formatTL(h.tutar_kurus)}
                    </p>
                    {benimPayim !== undefined && (
                      <p className="text-xs text-muted-foreground tabular-nums">
                        Payın {formatTL(benimPayim)}
                      </p>
                    )}
                    {silebilirim && (
                      <HarcamaSilButonu
                        harcamaId={h.id}
                        aciklama={h.aciklama}
                        tutarMetni={formatTL(h.tutar_kurus)}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
