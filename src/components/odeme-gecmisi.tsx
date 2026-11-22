import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTL } from "@/lib/para";
import { formatGun } from "@/lib/tarih";

export type OdemeKaydi = {
  id: string;
  odeyen_id: string;
  alan_id: string;
  tutar_kurus: number;
  tarih: string;
};

export function OdemeGecmisi({
  odemeler,
  isimler,
  benimId,
}: {
  odemeler: OdemeKaydi[];
  isimler: Map<string, string>;
  benimId: string;
}) {
  const ad = (id: string) =>
    id === benimId ? "Sen" : (isimler.get(id) ?? "Eski üye");

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Ödeme geçmişi</CardTitle>
      </CardHeader>
      <CardContent>
        {odemeler.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Henüz ödeme kaydı yok.
          </p>
        ) : (
          <ul className="flex flex-col divide-y lg:max-h-[24rem] lg:overflow-y-auto lg:pr-1">
            {odemeler.map((o) => (
              <li
                key={o.id}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span role="img" aria-label="Ödeme" className="text-2xl">
                  💸
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm">
                    <b>{ad(o.odeyen_id)}</b> → <b>{ad(o.alan_id)}</b>
                  </p>
                  <p className="text-xs text-muted-foreground">
                    ödedi · {formatGun(o.tarih)}
                  </p>
                </div>
                <p className="font-semibold tabular-nums">
                  {formatTL(o.tutar_kurus)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}