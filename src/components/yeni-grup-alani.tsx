"use client";

import { useEffect, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { GrupOlusturFormu } from "@/components/grup-olustur-formu";

const KIMLIK = "yeni-grup";

/** Yeni grup formunu bir düğmenin arkasında tutar; #yeni-grup bağlantısıyla gelindiğinde açılır. */
export function YeniGrupAlani({ baslangictaAcik }: { baslangictaAcik: boolean }) {
  const [acik, setAcik] = useState(baslangictaAcik);

  useEffect(() => {
    const kontrol = () => {
      if (window.location.hash === `#${KIMLIK}`) setAcik(true);
    };
    kontrol();
    window.addEventListener("hashchange", kontrol);
    return () => window.removeEventListener("hashchange", kontrol);
  }, []);

  return (
    <div id={KIMLIK} className="scroll-mt-20">
      {acik ? (
        <Card className="lg:max-w-md">
          <CardContent className="relative">
            {!baslangictaAcik && (
              <button
                type="button"
                onClick={() => {
                  setAcik(false);
                  if (window.location.hash === `#${KIMLIK}`)
                    history.replaceState(null, "", window.location.pathname);
                }}
                aria-label="Formu kapat"
                className="absolute top-0 right-3 inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
              >
                <X className="size-4" aria-hidden />
              </button>
            )}
            <GrupOlusturFormu otomatikOdak={!baslangictaAcik} />
          </CardContent>
        </Card>
      ) : (
        <Button type="button" onClick={() => setAcik(true)}>
          <Plus aria-hidden />
          Yeni grup
        </Button>
      )}
    </div>
  );
}
