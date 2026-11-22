"use client";

import { useActionState, useRef, useState } from "react";
import { harcamaEkle } from "@/app/harcamalar/actions";
import { KATEGORILER } from "@/lib/kategoriler";
import { FIS_EN_BUYUK_BOYUT, fisTuruGecerli } from "@/lib/gorsel";
import { fisiKucult } from "@/lib/gorsel-tarayici";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Kisi = { id: string; ad: string };

// Açılır menüler Input ile aynı görünsün diye
const SECIM_STILI =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-base outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:text-sm";

export function HarcamaFormu({
  grupId,
  kisiler,
  benimId,
  bugun,
}: {
  grupId: string;
  kisiler: Kisi[];
  benimId: string;
  bugun: string; // "2026-11-19" (sunucu İstanbul saatine göre hesaplar)
}) {
  const [durum, formAction, bekliyor] = useActionState(harcamaEkle, undefined);

  // Hata varsa kullanıcının yazdıkları, yoksa varsayılanlar
  const d = durum?.degerler;
  const seciliKisiler = d?.bolunenler ?? kisiler.map((k) => k.id);

  // "Herkes / Temizle" butonları için forma erişim
  const formRef = useRef<HTMLFormElement>(null);

  function kisileriSec(secilsinMi: boolean) {
    formRef.current
      ?.querySelectorAll<HTMLInputElement>('input[name="bolunenler"]')
      .forEach((kutu) => {
        kutu.checked = secilsinMi;
      });
  }

  // Fiş fotoğrafı: seçilince telefonda küçültülür, input'taki dosya küçüğüyle değiştirilir
  const [kucultuluyor, setKucultuluyor] = useState(false);
  const [onizleme, setOnizleme] = useState<string | null>(null);
  const [fisHata, setFisHata] = useState<string | null>(null);

  async function fisSecildi(e: React.ChangeEvent<HTMLInputElement>) {
    const input = e.currentTarget; // await'ten önce sakla
    const dosya = input.files?.[0];
    setFisHata(null);
    setOnizleme(null);
    if (!dosya) return;

    setKucultuluyor(true);
    try {
      const kucuk = await fisiKucult(dosya);
      const aktarim = new DataTransfer();
      aktarim.items.add(kucuk);
      input.files = aktarim.files; // form artık küçük dosyayı gönderecek
      setOnizleme(URL.createObjectURL(kucuk));
    } catch {
      // Küçültülemedi: zaten uygun türde ve küçükse olduğu gibi gönder
      if (fisTuruGecerli(dosya.type) && dosya.size <= FIS_EN_BUYUK_BOYUT - 100 * 1024) {
        setOnizleme(URL.createObjectURL(dosya));
      } else {
        input.value = "";
        setFisHata("Bu fotoğraf kullanılamadı. Başka bir fotoğraf (JPEG/PNG) seç.");
      }
    } finally {
      setKucultuluyor(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Harcama ekle</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          ref={formRef}
          action={formAction}
          // Başarılı gönderimden sonra React formu sıfırlar → önizlemeyi de temizle
          onReset={() => {
            setOnizleme(null);
            setFisHata(null);
          }}
          className="flex flex-col gap-4"
        >
          <input type="hidden" name="grupId" value={grupId} />

          {/* Açıklama + Tutar */}
          <div className="grid grid-cols-[1fr_8rem] gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="aciklama">Açıklama</Label>
              <Input
                id="aciklama"
                name="aciklama"
                placeholder="Ör. Market"
                defaultValue={d?.aciklama}
                maxLength={80}
                autoComplete="off"
                required
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tutar">Tutar (₺)</Label>
              <Input
                id="tutar"
                name="tutar"
                inputMode="decimal"
                placeholder="0,00"
                defaultValue={d?.tutar}
                autoComplete="off"
                required
              />
            </div>
          </div>

          {/* Kategori + Tarih */}
          <div className="grid grid-cols-2 gap-2">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="kategori">Kategori</Label>
              <select
                id="kategori"
                name="kategori"
                defaultValue={d?.kategori ?? "market"}
                className={SECIM_STILI}
              >
                {KATEGORILER.map((k) => (
                  <option key={k.kod} value={k.kod}>
                    {k.emoji} {k.ad}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="tarih">Tarih</Label>
              <Input
                id="tarih"
                name="tarih"
                type="date"
                defaultValue={d?.tarih ?? bugun}
                max={bugun}
                required
              />
            </div>
          </div>

          {/* Kim ödedi */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="odeyen">Kim ödedi?</Label>
            <select
              id="odeyen"
              name="odeyen"
              defaultValue={d?.odeyen ?? benimId}
              className={SECIM_STILI}
            >
              {kisiler.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.ad}
                  {k.id === benimId ? " (sen)" : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Kimler arasında bölünsün */}
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-1.5 flex w-full items-center justify-between gap-2 text-sm font-medium">
              <span>Kimler arasında eşit bölünsün?</span>
              <span className="flex shrink-0 gap-1">
                <button
                  type="button"
                  onClick={() => kisileriSec(true)}
                  className="rounded-md border px-2 py-0.5 text-xs font-normal"
                >
                  Herkes
                </button>
                <button
                  type="button"
                  onClick={() => kisileriSec(false)}
                  className="rounded-md border px-2 py-0.5 text-xs font-normal"
                >
                  Temizle
                </button>
              </span>
            </legend>
            {kisiler.map((k) => (
              <label key={k.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  name="bolunenler"
                  value={k.id}
                  defaultChecked={seciliKisiler.includes(k.id)}
                  className="size-4 accent-teal-700"
                />
                {k.ad}
                {k.id === benimId && (
                  <span className="text-muted-foreground">(sen)</span>
                )}
              </label>
            ))}
          </fieldset>

          {/* Fiş fotoğrafı (isteğe bağlı) */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="fis">📷 Fiş fotoğrafı (isteğe bağlı)</Label>
            <input
              id="fis"
              name="fis"
              type="file"
              accept="image/*"
              onChange={fisSecildi}
              className="text-sm file:mr-3 file:rounded-md file:border file:bg-transparent file:px-2.5 file:py-1 file:text-sm"
            />
            {kucultuluyor && (
              <p className="text-xs text-muted-foreground">Fotoğraf küçültülüyor…</p>
            )}
            {onizleme && (
              // eslint-disable-next-line @next/next/no-img-element -- yerel önizleme (blob:), optimize edilecek bir şey yok
              <img
                src={onizleme}
                alt="Seçilen fişin önizlemesi"
                className="h-24 w-fit rounded-md border object-contain"
              />
            )}
            {fisHata && (
              <p role="alert" className="text-xs text-red-700">
                {fisHata}
              </p>
            )}
          </div>

          {durum?.hata && (
            <p role="alert" className="text-sm text-red-700">
              {durum.hata}
            </p>
          )}
          {durum?.basarili && (
            <p role="status" className="text-sm text-teal-700">
              Harcama eklendi ✓
            </p>
          )}
          {durum?.uyari && (
            <p role="alert" className="text-sm text-amber-700">
              {durum.uyari}
            </p>
          )}

          <Button type="submit" size="lg" disabled={bekliyor || kucultuluyor}>
            {bekliyor ? "Ekleniyor..." : "Harcamayı ekle"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}