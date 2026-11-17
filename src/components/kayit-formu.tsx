"use client";

import { useActionState } from "react";
import { kayitOl } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function KayitFormu() {
  // durum: sunucudan dönen hata · formAction: formu gönderen fonksiyon · bekliyor: istek sürüyor mu
  const [durum, formAction, bekliyor] = useActionState(kayitOl, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <div className="grid gap-2">
        <Label htmlFor="adSoyad">Ad soyad</Label>
        <Input
          id="adSoyad"
          name="adSoyad"
          autoComplete="name"
          defaultValue={durum?.degerler?.adSoyad}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">E-posta</Label>
        <Input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          defaultValue={durum?.degerler?.email}
          required
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="sifre">Şifre</Label>
        <Input
          id="sifre"
          name="sifre"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">En az 8 karakter</p>
      </div>

      {durum?.hata && (
        <p
          role="alert"
          className="rounded-md bg-red-50 p-3 text-sm text-red-700"
        >
          {durum.hata}
        </p>
      )}

      <Button type="submit" size="lg" disabled={bekliyor}>
        {bekliyor ? "Hesap oluşturuluyor..." : "Kayıt ol"}
      </Button>
    </form>
  );
}
