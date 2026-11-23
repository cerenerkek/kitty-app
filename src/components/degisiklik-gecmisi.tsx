import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTL } from "@/lib/para";
import { formatAn } from "@/lib/tarih";

type HarcamaGoruntusu = { aciklama: string; tutar_kurus: number };

export type GecmisKaydi = {
  id: number;
  expense_id: string;
  islem: "eklendi" | "duzenlendi" | "silindi" | "fis_eklendi" | "fis_kaldirildi";
  yapan_id: string | null;
  eski: HarcamaGoruntusu | null;
  yeni: HarcamaGoruntusu | null;
  zaman: string;
};

const FIILLER: Record<GecmisKaydi["islem"], [string, string]> = {
  eklendi: ["harcama ekledi", "harcama ekledin"],
  duzenlendi: ["harcamayı düzenledi", "harcamayı düzenledin"],
  silindi: ["harcamayı sildi", "harcamayı sildin"],
  fis_eklendi: ["fiş ekledi", "fiş ekledin"],
  fis_kaldirildi: ["fişi kaldırdı", "fişi kaldırdın"],
};

const SIMGELER: Record<GecmisKaydi["islem"], string> = {
  eklendi: "➕",
  duzenlendi: "✏️",
  silindi: "🗑️",
  fis_eklendi: "📎",
  fis_kaldirildi: "📎",
};

export function DegisiklikGecmisi({
  kayitlar,
  isimler,
  benimId,
  baslik = "Son değişiklikler",
}: {
  kayitlar: GecmisKaydi[];
  isimler: Map<string, string>;
  benimId: string;
  baslik?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{baslik}</CardTitle>
      </CardHeader>
      <CardContent>
        {kayitlar.length === 0 ? (
          <p className="text-sm text-muted-foreground">Henüz değişiklik yok.</p>
        ) : (
          <ul className="flex flex-col divide-y lg:max-h-[24rem] lg:overflow-y-auto lg:pr-1">
            {kayitlar.map((k) => {
              const benMiyim = k.yapan_id === benimId;
              const kim = benMiyim
                ? "Sen"
                : k.yapan_id
                  ? (isimler.get(k.yapan_id) ?? "Eski üye")
                  : "Bilinmeyen";
              const fiil = FIILLER[k.islem][benMiyim ? 1 : 0];

              const harcama = k.yeni ?? k.eski;
              const tutarDegisti =
                k.islem === "duzenlendi" &&
                k.eski &&
                k.yeni &&
                k.eski.tutar_kurus !== k.yeni.tutar_kurus;

              return (
                <li
                  key={k.id}
                  className="flex items-start gap-3 py-2.5 text-sm first:pt-0 last:pb-0"
                >
                  <span aria-hidden className="pt-0.5">
                    {SIMGELER[k.islem]}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p>
                      <b>{kim}</b> {fiil}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {harcama ? `"${harcama.aciklama}" · ` : ""}
                      {tutarDegisti
                        ? `${formatTL(k.eski!.tutar_kurus)} → ${formatTL(k.yeni!.tutar_kurus)}`
                        : harcama
                          ? formatTL(harcama.tutar_kurus)
                          : ""}
                      {" · "}
                      {formatAn(k.zaman)}
                    </p>
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
