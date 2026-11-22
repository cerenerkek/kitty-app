"use client";

import { useState, useTransition } from "react";
import { davetOlustur } from "@/app/gruplar/actions";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function DavetPaylas({
  grupId,
  grupAdi,
}: {
  grupId: string;
  grupAdi: string;
}) {
  const [link, setLink] = useState<string | null>(null);
  const [hata, setHata] = useState<string | null>(null);
  const [kopyalandi, setKopyalandi] = useState(false);
  const [bekliyor, startTransition] = useTransition();

  const mesaj = `"${grupAdi}" grubuna katıl, harcamaları Kitty'de birlikte takip edelim 🐱`;

  function olustur() {
    setHata(null);
    startTransition(async () => {
      const sonuc = await davetOlustur(grupId); // sunucuda çalışır
      if ("hata" in sonuc) setHata(sonuc.hata);
      else setLink(`${window.location.origin}/davet/${sonuc.token}`);
    });
  }

  async function kopyala() {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      setKopyalandi(true);
      setTimeout(() => setKopyalandi(false), 2000);
    } catch {
      setHata("Kopyalanamadı, linki elle seçip kopyala.");
    }
  }

  async function paylas() {
    if (!link) return;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Kitty", text: mesaj, url: link });
      } catch {
        // kullanıcı paylaşım menüsünü kapattı, sorun değil
      }
    } else {
      kopyala(); // bilgisayarda paylaşım menüsü yoksa kopyala
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Arkadaşlarını davet et</CardTitle>
        <CardDescription>Link 7 gün geçerli.</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {!link ? (
          <Button onClick={olustur} disabled={bekliyor}>
            {bekliyor ? "Oluşturuluyor..." : "Davet linki oluştur"}
          </Button>
        ) : (
          <>
            <Input
              value={link}
              readOnly
              aria-label="Davet linki"
              onFocus={(e) => e.currentTarget.select()}
            />
            <div className="grid grid-cols-2 gap-2">
              <a
                href={`https://wa.me/?text=${encodeURIComponent(`${mesaj}\n${link}`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonVariants()}
              >
                WhatsApp&apos;ta paylaş
              </a>
              <Button variant="outline" onClick={kopyala}>
                {kopyalandi ? "Kopyalandı ✓" : "Kopyala"}
              </Button>
            </div>
            <Button variant="ghost" size="sm" onClick={paylas}>
              Diğer uygulamalarla paylaş
            </Button>
          </>
        )}
        {hata && (
          <p role="alert" className="text-sm text-destructive">
            {hata}
          </p>
        )}
      </CardContent>
    </Card>
  );
}
