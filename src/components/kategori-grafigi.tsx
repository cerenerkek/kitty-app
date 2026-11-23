"use client";

import { useState } from "react";
import {
  Bar,
  BarChart,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatTL } from "@/lib/para";
import { kategoriBilgisi } from "@/lib/kategoriler";

export type KategoriOzeti = {
  kategori: string;
  toplam: number;
  benimPayim: number;
  adet: number;
};

type Olcu = "grup" | "benim";

const CUBUK_RENGI = "var(--grafik)";
const YAZI_RENGI = "var(--foreground)";
const VURGU_ZEMINI = "var(--muted)";

export function KategoriGrafigi({ veriler }: { veriler: KategoriOzeti[] }) {
  const [olcu, setOlcu] = useState<Olcu>("grup");
  const olcuAdi = olcu === "grup" ? "Grup toplamı" : "Benim payım";

  const satirlar = veriler
    .map((v) => {
      const k = kategoriBilgisi(v.kategori);
      return {
        ad: `${k.emoji} ${k.ad}`,
        tutar: olcu === "grup" ? v.toplam : v.benimPayim,
      };
    })
    .sort((a, b) => b.tutar - a.tutar);

  return (
    <div className="flex flex-col gap-3">
      <div
        role="group"
        aria-label="Gösterilen tutar"
        className="inline-flex self-start rounded-lg border p-0.5"
      >
        {(["grup", "benim"] as const).map((o) => (
          <button
            key={o}
            type="button"
            aria-pressed={olcu === o}
            onClick={() => setOlcu(o)}
            className={`rounded-md px-3 py-1 text-sm transition ${
              olcu === o
                ? "bg-foreground text-background"
                : "text-muted-foreground"
            }`}
          >
            {o === "grup" ? "Grup toplamı" : "Benim payım"}
          </button>
        ))}
      </div>

      <div className="w-full" style={{ height: satirlar.length * 44 + 16 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={satirlar}
            layout="vertical"
            margin={{ top: 8, right: 88, bottom: 8, left: 0 }}
          >
            <XAxis type="number" hide domain={[0, "dataMax"]} />
            <YAxis
              type="category"
              dataKey="ad"
              width={104}
              tickLine={false}
              axisLine={false}
              tick={{ fontSize: 13, fill: YAZI_RENGI }}
            />
            <Tooltip
              cursor={{ fill: VURGU_ZEMINI }}
              formatter={(deger) => [formatTL(Number(deger)), olcuAdi]}
              contentStyle={{
                background: "var(--popover)",
                border: "1px solid var(--border)",
                borderRadius: 8,
                color: "var(--popover-foreground)",
              }}
              itemStyle={{ color: "var(--popover-foreground)" }}
              labelStyle={{ color: "var(--muted-foreground)" }}
            />
            <Bar
              dataKey="tutar"
              fill={CUBUK_RENGI}
              barSize={20}
              radius={[0, 4, 4, 0]}
            >
              <LabelList
                dataKey="tutar"
                position="right"
                formatter={(deger) => formatTL(Number(deger))}
                style={{ fontSize: 12, fill: YAZI_RENGI }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
