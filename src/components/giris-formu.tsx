"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { girisYap } from "@/app/auth/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GirisFormu() {
  const [durum, formAction, bekliyor] = useActionState(girisYap, undefined);
  const sonraki = useSearchParams().get("sonraki") ?? "";

  return (
    <form action={formAction} className="flex flex-col gap-4">
      <input type="hidden" name="sonraki" value={sonraki} />
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
          autoComplete="current-password"
          required
        />
      </div>

      {durum?.hata && (
        <p
          role="alert"
          className="rounded-md bg-destructive/10 p-3 text-sm text-destructive"
        >
          {durum.hata}
        </p>
      )}

      <Button type="submit" size="lg" disabled={bekliyor}>
        {bekliyor ? "Giriş yapılıyor..." : "Giriş yap"}
      </Button>
    </form>
  );
}
