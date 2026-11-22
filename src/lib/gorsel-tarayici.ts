// Sadece TARAYICIDA çalışır (canvas kullanır). Sunucuda import etme.
import { hedefBoyut } from "@/lib/gorsel";

// Server Action isteğinin sınırı 1 MB; formun diğer alanlarına da yer kalsın.
const HEDEF_EN_BUYUK = 900 * 1024;

// Telefon fotoğrafını küçültür ve JPEG'e çevirir.
// Görseli yeniden çizmek, içindeki EXIF bilgilerini (çekildiği konum dahil) de siler.
export async function fisiKucult(dosya: File): Promise<File> {
  // imageOrientation: telefonun "yan çekildi" bilgisini uygula → fiş dik dursun
  const bitmap = await createImageBitmap(dosya, { imageOrientation: "from-image" });
  const { genislik, yukseklik } = hedefBoyut(bitmap.width, bitmap.height);

  const tuval = document.createElement("canvas");
  tuval.width = genislik;
  tuval.height = yukseklik;
  const ctx = tuval.getContext("2d");
  if (!ctx) throw new Error("Tuval açılamadı");
  ctx.drawImage(bitmap, 0, 0, genislik, yukseklik);
  bitmap.close();

  // Önce iyi kaliteyle dene; sınırı aşarsa kaliteyi düşür
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
