"use client";

import { useActionState } from "react";
import { grupOlustur } from "@/app/gruplar/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function GrupOlusturFormu() {
  const [durum, formAction, bekliyor] = useActionState(grupOlustur, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <Label htmlFor="ad">Yeni grup kur</Label>
      <div className="flex gap-2">
        <Input
          id="ad"
          name="ad"
          placeholder="Ör. Ev Arkadaşları"
          defaultValue={durum?.ad}
          maxLength={50}
          autoComplete="off"
          required
        />
        <Button type="submit" disabled={bekliyor}>
          {bekliyor ? "Kuruluyor..." : "Grup kur"}
        </Button>
      </div>
      {durum?.hata && (
        <p role="alert" className="text-sm text-red-700">
          {durum.hata}
        </p>
      )}
    </form>
  );
}
