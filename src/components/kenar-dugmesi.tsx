"use client";

import { useSyncExternalStore } from "react";
import { PanelLeftClose, PanelLeftOpen } from "lucide-react";

const ANAHTAR = "kitty-kenar";
const OLAY = "kitty-kenar-degisti";

function darMi() {
  return document.documentElement.dataset.kenar === "dar";
}

function abone(bildir: () => void) {
  window.addEventListener(OLAY, bildir);
  return () => window.removeEventListener(OLAY, bildir);
}

export function KenarDugmesi() {
  const dar = useSyncExternalStore(abone, darMi, () => false);
  const etiket = dar ? "Kenar çubuğunu genişlet" : "Kenar çubuğunu daralt";
  const Simge = dar ? PanelLeftOpen : PanelLeftClose;

  function degistir() {
    const yeni = !dar;
    if (yeni) document.documentElement.dataset.kenar = "dar";
    else delete document.documentElement.dataset.kenar;
    try {
      localStorage.setItem(ANAHTAR, yeni ? "dar" : "genis");
    } catch {
    }
    window.dispatchEvent(new Event(OLAY));
  }

  return (
    <button
      type="button"
      onClick={degistir}
      aria-label={etiket}
      aria-expanded={!dar}
      title={etiket}
      className="inline-flex size-8 shrink-0 items-center justify-center rounded-md text-muted-foreground transition hover:bg-accent hover:text-foreground"
    >
      <Simge className="size-4" aria-hidden />
    </button>
  );
}
