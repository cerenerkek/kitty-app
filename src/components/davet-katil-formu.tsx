"use client";

import { useActionState } from "react";
import { davetKatil } from "@/app/davet/actions";
import { Button } from "@/components/ui/button";

export function DavetKatilFormu({ token }: { token: string }) {
  const [durum, formAction, bekliyor] = useActionState(davetKatil, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <input type="hidden" name="token" value={token} />
      <Button type="submit" size="lg" disabled={bekliyor}>
        {bekliyor ? "Katılıyorsun..." : "Gruba katıl"}
      </Button>
      {durum?.hata && (
        <p role="alert" className="text-center text-sm text-destructive">
          {durum.hata}
        </p>
      )}
    </form>
  );
}