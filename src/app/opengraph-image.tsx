import { ImageResponse } from "next/og";

export const alt = "Kitty – Ortak harcama uygulaması";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OnizlemeGorseli() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 16,
          background: "#313076",
          color: "white",
        }}
      >
        <div style={{ fontSize: 180 }}>🐱</div>
        <div style={{ fontSize: 110, fontWeight: 700 }}>Kitty</div>
        <div style={{ fontSize: 48, opacity: 0.9 }}>Ortak harcama, kolay hesap</div>
      </div>
    ),
    { ...size },
  );
}
