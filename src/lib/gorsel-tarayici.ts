import { hedefBoyut } from "@/lib/gorsel";

const HEDEF_EN_BUYUK = 900 * 1024;

export async function fisiKucult(dosya: File): Promise<File> {
  const bitmap = await createImageBitmap(dosya, { imageOrientation: "from-image" });
  const { genislik, yukseklik } = hedefBoyut(bitmap.width, bitmap.height);

  const tuval = document.createElement("canvas");
  tuval.width = genislik;
  tuval.height = yukseklik;
  const ctx = tuval.getContext("2d");
  if (!ctx) throw new Error("Tuval açılamadı");
  ctx.drawImage(bitmap, 0, 0, genislik, yukseklik);
  bitmap.close();

  for (const kalite of [0.82, 0.7, 0.55]) {
    const blob = await new Promise<Blob | null>((coz) =>
      tuval.toBlob(coz, "image/jpeg", kalite),
    );
    if (blob && blob.size <= HEDEF_EN_BUYUK) {
      return new File([blob], "fis.jpg", { type: "image/jpeg" });
    }
  }
  throw new Error("Fotoğraf yeterince küçültülemedi");
}
