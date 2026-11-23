"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Tema = "acik" | "koyu";

const ANAHTAR = "kitty-tema";
const OLAY = "kitty-tema-degisti";
const SISTEM_KOYU = "(prefers-color-scheme: dark)";

function oku(): Tema {
  try {
    const kayitli = localStorage.getItem(ANAHTAR);
    if (kayitli === "acik" || kayitli === "koyu") return kayitli;
  } catch {
  }
  return window.matchMedia(SISTEM_KOYU).matches ? "koyu" : "acik";
}

function abone(bildir: () => void) {
  const sorgu = window.matchMedia(SISTEM_KOYU);
  window.addEventListener("storage", bildir);
  window.addEventListener(OLAY, bildir);
  sorgu.addEventListener("change", bildir);
  return () => {
    window.removeEventListener("storage", bildir);
    window.removeEventListener(OLAY, bildir);
    sorgu.removeEventListener("change", bildir);
  };
}

export function TemaDugmesi() {
  const tema = useSyncExternalStore(abone, oku, () => "acik" as Tema);
  const yeni: Tema = tema === "koyu" ? "acik" : "koyu";

  function degistir() {
    try {
      localStorage.setItem(ANAHTAR, yeni);
    } catch {
    }
    document.documentElement.classList.toggle("dark", yeni === "koyu");
    window.dispatchEvent(new Event(OLAY));
  }

  const Simge = tema === "koyu" ? Moon : Sun;
  const etiket = yeni === "koyu" ? "Koyu temaya geç" : "Açık temaya geç";

  return (
    <button
      type="button"
      onClick={degistir}
      aria-label={etiket}
      title={etiket}
      className="inline-flex size-8 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <Simge className="size-4" aria-hidden />
    </button>
  );
}
