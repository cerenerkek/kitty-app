import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTL } from "@/lib/para";
import { kategoriBilgisi } from "@/lib/kategoriler";
import { formatGun } from "@/lib/tarih";

export type Harcama = {
  id: string;
  aciklama: string;
  tutar_kurus: number;
  kategori: string;
  tarih: string; // "2026-11-19"
  odeyen_id: string;
  expense_splits: { user_id: string; pay_kurus: number }[];
};

export function HarcamaListesi({
  harcamalar,
  isimler,
  benimId,
}: {
  harcamalar: Harcama[];
  isimler: Map<string, string>;
  benimId: string;
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
