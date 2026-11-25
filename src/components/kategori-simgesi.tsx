import {
  Bus,
  Ellipsis,
  House,
  PartyPopper,
  ReceiptText,
  ShoppingCart,
  UtensilsCrossed,
  type LucideIcon,
} from "lucide-react";
import { kategoriBilgisi, type KategoriKodu } from "@/lib/kategoriler";

type Gorunum = {
  Simge: LucideIcon;
  
  renk: string;

  dolgu: string;
};

export const KATEGORI_GORUNUMLERI: Record<KategoriKodu, Gorunum> = {
  market: {
    Simge: ShoppingCart,
    renk: "bg-emerald-100 text-emerald-700 dark:bg-emerald-600 dark:text-emerald-100",
    dolgu: "fill-emerald-100 dark:fill-emerald-950",
  },
  fatura: {
    Simge: ReceiptText,
    renk: "bg-amber-100 text-amber-700 dark:bg-amber-600 dark:text-amber-100",
    dolgu: "fill-amber-100 dark:fill-amber-950",
  },
  kira: {
    Simge: House,
    renk: "bg-sky-100 text-sky-700 dark:bg-sky-600 dark:text-sky-100",
    dolgu: "fill-sky-100 dark:fill-sky-950",
  },
  ulasim: {
    Simge: Bus,
    renk: "bg-indigo-100 text-indigo-700 dark:bg-indigo-600 dark:text-indigo-100",
    dolgu: "fill-indigo-100 dark:fill-indigo-950",
  },
  yemek: {
    Simge: UtensilsCrossed,
    renk: "bg-red-100 text-red-700 dark:bg-red-500 dark:text-red-100",
    dolgu: "fill-red-100 dark:fill-red-950",
  },
  eglence: {
    Simge: PartyPopper,
    renk: "bg-pink-100 text-pink-700 dark:bg-pink-600 dark:text-pink-100",
    dolgu: "fill-pink-100 dark:fill-pink-950",
  },
  diger: {
    Simge: Ellipsis,
    renk: "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-100",
    dolgu: "fill-slate-100 dark:fill-slate-800",
  },
};

export function kategoriGorunumu(kod: string) {
  return KATEGORI_GORUNUMLERI[kategoriBilgisi(kod).kod];
}

export function KategoriSimgesi({
  kod,
  boyut = "md",
}: {
  kod: string;
  boyut?: "sm" | "md" | "lg";
}) {
  const { ad } = kategoriBilgisi(kod);
  const { Simge, renk } = kategoriGorunumu(kod);
  const kutu = { sm: "size-7", md: "size-9", lg: "size-11" }[boyut];
  const ic = { sm: "size-3.5", md: "size-4", lg: "size-5" }[boyut];
  return (
    <span
      role="img"
      aria-label={ad}
      title={ad}
      className={`inline-flex shrink-0 items-center justify-center rounded-full ${kutu} ${renk}`}
    >
      <Simge className={ic} aria-hidden />
    </span>
  );
}
