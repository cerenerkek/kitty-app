import { ImageResponse } from "next/og";

// iPhone/iPad'de "Ana Ekrana Ekle" denince görünen simge
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleSimgesi() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0f766e",
          fontSize: 120,
        }}
      >
        🐱
      </div>
    ),
    { ...size },
  );
}
