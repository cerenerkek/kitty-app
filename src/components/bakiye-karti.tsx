import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatTL } from "@/lib/para";
import { odemeleriHesapla, type Bakiye, type Odeme } from "@/lib/borclar";
import { OdendiButonu } from "@/components/odendi-butonu";
import { OdemeFormu } from "@/components/odeme-formu";

// +1.126,67 ₺ / −563,33 ₺ biçiminde işaretli tutar
function isaretliTL(kurus: number) {
  if (kurus > 0) return `+${formatTL(kurus)}`;
  if (kurus < 0) return `−${formatTL(-kurus)}`;
  return formatTL(0);
}

export function BakiyeKarti({
  grupId,
  bakiyeler,
  kisiler,
  isimler,
  benimId,
  bugun,
}: {
  grupId: string;
  bakiyeler: Bakiye[];
  kisiler: { id: string; ad: string }[];
  isimler: Map<string, string>;
  benimId: string;
  bugun: string;
}) {
  const ad = (id: string) =>
    id === benimId ? "Sen" : (isimler.get(id) ?? "Eski üye");

  // Algoritma toplam 0 değilse hata fırlatır → sayfa çökmesin, uyarı gösterelim
  let oneriler: Odeme[] | null;
  try {
    oneriler = odemeleriHesapla(bakiyeler);
  } catch {
    oneriler = null;
  }

  const benimNet = bakiyeler.find((b) => b.id === benimId)?.net ?? 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Bakiyeler</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-5">
        {/* 1) Benim durumum: tek cümle */}
        <p className="rounded-lg bg-vurgu px-3 py-2 text-sm text-vurgu-yazi">
          {benimNet > 0 ? (
            <>
              Toplam <b className="text-alacakli">{formatTL(benimNet)}</b>{" "}
              alacaklısın.
            </>
          ) : benimNet < 0 ? (
            <>
              Toplam <b className="text-borclu">{formatTL(-benimNet)}</b>{" "}
              borçlusun.
            </>
          ) : (
            "Kimseye borcun yok, kimsenin de sana borcu yok 🎉"
          )}
        </p>

        {/* 2) Herkesin net bakiyesi */}
        <ul className="flex flex-col gap-2">
          {bakiyeler.map((b) => (
            <li
              key={b.id}
              className="flex items-center justify-between text-sm"
            >
              <span>
                {isimler.get(b.id) ?? "Eski üye"}
                {b.id === benimId && (
                  <span className="text-muted-foreground"> (sen)</span>
                )}
              </span>
              <span
                className={`font-semibold tabular-nums ${
                  b.net > 0
                    ? "text-alacakli"
                    : b.net < 0
                      ? "text-borclu"
                      : "text-muted-foreground"
                }`}
              >
                {isaretliTL(b.net)}
              </span>
            </li>
          ))}
        </ul>

        {/* 3) Önerilen ödemeler */}
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-muted-foreground">
            Önerilen ödemeler
          </h3>

          {oneriler === null ? (
            <p role="alert" className="text-sm text-destructive">
              Bakiyeler hesaplanamadı. Lütfen sayfayı yenile.
            </p>
          ) : oneriler.length === 0 ? (
            <p className="text-sm text-muted-foreground">Herkes ödeşmiş 🎉</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {oneriler.map((o) => {
                const benOdeyecegim = o.kimden === benimId;
                const benAlacagim = o.kime === benimId;
                return (
                  <li
                    key={`${o.kimden}-${o.kime}`}
                    className={`flex items-center justify-between gap-3 rounded-lg border px-3 py-2 text-sm ${
                      benOdeyecegim || benAlacagim
                        ? "border-vurgu-kenar bg-vurgu"
                        : ""
                    }`}
                  >
                    <div className="min-w-0">
                      <p>
                        <b>{ad(o.kimden)}</b> → <b>{ad(o.kime)}</b>
                      </p>
                      <p className="font-semibold tabular-nums">
                        {formatTL(o.tutar)}
                      </p>
                    </div>

                    {/* Buton sadece ödeyen ya da alan kişiye görünür */}
                    {(benOdeyecegim || benAlacagim) && (
                      <OdendiButonu
                        grupId={grupId}
                        kimden={o.kimden}
                        kime={o.kime}
                        tutar={o.tutar}
                        bugun={bugun}
                        etiket={benOdeyecegim ? "Ödedim" : "Aldım"}
                        onayMetni={`${ad(o.kimden)} → ${ad(o.kime)}: ${formatTL(o.tutar)} ödeme olarak kaydedilsin mi? Bu kayıt sonradan silinemez.`}
                      />
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* 4) Kısmi / farklı tutarlı ödeme */}
        <OdemeFormu
          grupId={grupId}
          kisiler={kisiler}
          benimId={benimId}
          bugun={bugun}
        />
      </CardContent>
    </Card>
  );
}
