import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const ozellikler = [
  {
    ikon: "👥",
    baslik: "Grup kur",
    aciklama:
      "Ev arkadaşlarını, aileni ya da tatil ekibini davet linkiyle ekle.",
  },
  {
    ikon: "🧾",
    baslik: "Harcamayı gir",
    aciklama:
      "Kim ödedi, kimler arasında bölündü, hangi kategori? Saniyeler içinde.",
  },
  {
    ikon: "⚖️",
    baslik: "Kim kime borçlu?",
    aciklama:
      "Kitty borçları hesaplar ve en az ödemeyle kapatmanın yolunu gösterir.",
  },
  {
    ikon: "📊",
    baslik: "Ay sonu özeti",
    aciklama: "Paranın nereye gittiğini kategori grafiğiyle gör.",
  },
];

export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-8 px-4 py-10">
      <section className="flex flex-col items-center gap-3 text-center">
        <div className="flex size-16 items-center justify-center rounded-2xl bg-teal-700 text-3xl shadow-md">
          🐱
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-teal-700">
          Kitty
        </h1>
        <p className="text-balance text-muted-foreground">
          Ortak harcamaları kolayca takip et. Kim ne ödedi, kim kime borçlu,
          para nereye gitti? Hepsi tek yerde.
        </p>
      </section>

      <div className="flex flex-col gap-3">
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

      <section className="grid gap-3">
        {ozellikler.map((o) => (
          <Card key={o.baslik}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <span aria-hidden>{o.ikon}</span>
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
