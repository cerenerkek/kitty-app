import Link from "next/link";
import { ChartPie, Receipt, Scale, Users } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { TemaDugmesi } from "@/components/tema-dugmesi";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ozellikler = [
  {
    ikon: Users,
    baslik: "Grup kur",
    aciklama:
      "Ev arkadaşlarını, aileni ya da tatil ekibini davet linkiyle ekle.",
  },
  {
    ikon: Receipt,
    baslik: "Harcamayı gir",
    aciklama:
      "Kim ödedi, kimler arasında bölündü, hangi kategori? Saniyeler içinde.",
  },
  {
    ikon: Scale,
    baslik: "Kim kime borçlu?",
    aciklama:
      "Kitty borçları hesaplar ve en az ödemeyle kapatmanın yolunu gösterir.",
  },
  {
    ikon: ChartPie,
    baslik: "Ay sonu özeti",
    aciklama: "Paranın nereye gittiğini kategori grafiğiyle gör.",
  },
];

export default function Home() {
  return (
    <main className="relative mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center gap-8 px-4 py-10 lg:grid lg:max-w-6xl lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-8">
      <div className="absolute top-4 right-4">
        <TemaDugmesi />
      </div>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col items-center gap-3 text-center lg:items-start lg:text-left">
          <div className="flex size-16 items-center justify-center rounded-2xl bg-primary text-3xl shadow-md">
            🐱
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-marka">
            Kitty
          </h1>
          <p className="text-balance text-muted-foreground">
            Ortak harcamaları kolayca takip et. Kim ne ödedi, kim kime borçlu,
            para nereye gitti? Hepsi tek yerde.
          </p>
        </section>

        <div className="flex flex-col gap-3 lg:flex-row">
          <Link href="/kayit" className={buttonVariants({ size: "lg" })}>
            Kayıt ol
          </Link>
          <Link
            href="/giris"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Giriş yap
          </Link>
        </div>
      </div>

      <section className="grid gap-3 sm:grid-cols-2">
        {ozellikler.map((o) => (
          <Card key={o.baslik}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="flex size-8 items-center justify-center rounded-lg bg-vurgu text-vurgu-yazi">
                  <o.ikon className="size-4" aria-hidden />
                </span>
                {o.baslik}
              </CardTitle>
              <CardDescription>{o.aciklama}</CardDescription>
            </CardHeader>
          </Card>
        ))}
      </section>
    </main>
  );
}
