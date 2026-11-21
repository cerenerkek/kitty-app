# 🐱 Kitty

Ev arkadaşları, aileler ve arkadaş grupları için ortak harcama ve bütçe uygulaması.
Kim ne ödedi, kim kime borçlu, para nereye gitti? Hepsi tek yerde.

**Canlı:** https://kitty-app-gamma.vercel.app

---

## Özellikler

| | Özellik | Açıklama |
|---|---|---|
| 👤 | **Kayıt ve giriş** | E-posta ve şifre ile hesap. Giriş yapmadan korumalı sayfalar açılmaz. |
| 👥 | **Gruplar ve davet** | Grup kur, 7 gün geçerli davet linkini WhatsApp'tan paylaş, arkadaşın linkle katılsın. |
| 🧾 | **Harcama ekleme** | Tutar, açıklama, kategori, tarih, kim ödedi, kimler arasında bölünecek. Eşit bölüşüm kuruşu kuruşuna yapılır. |
| ⚖️ | **Bakiyeler** | Herkesin net durumu (+ alacaklı, − borçlu) ve borçları **en az sayıda ödemeyle** kapatan öneriler. |
| 💸 | **Ödeme kaydı** | "Ödedim / Aldım" butonu ya da kısmi ödeme formu. Ödeme geçmişi listelenir. |
| 📊 | **Aylık özet** | Kategori bazında grafik, "Grup toplamı / Benim payım" seçimi, ay ay geçiş. |
| 📱 | **Mobil uyumlu** | Telefon için tasarlandı: virgüllü sayı klavyesi, yerel tarih seçici, tek sütun düzen. |

---

## Teknolojiler

| Katman | Teknoloji | Neden |
|---|---|---|
| Arayüz + sunucu | **Next.js 16** (App Router, React 19, TypeScript) | Arayüz ve sunucu kodu tek projede. Server Components ile veri sunucuda çekilir, tarayıcıya sadece gerekli JavaScript gider. |
| Stil | **Tailwind CSS 4** + **shadcn/ui** | Hızlı, tutarlı ve mobil uyumlu bileşenler. |
| Veritabanı + kimlik | **Supabase** (PostgreSQL + Auth) | Gerçek bir SQL veritabanı, satır düzeyinde güvenlik (RLS) ve hazır kimlik doğrulama. |
| Doğrulama | **Zod** | Formdan gelen verinin biçimini sunucuda kontrol eder. |
| Grafik | **Recharts** | React ile bileşen olarak tarif edilen SVG grafikler. |
| Test | **Vitest** | Saf fonksiyonların (para, borç algoritması, tarih) otomatik testleri. |
| Yayın | **Vercel** (Frankfurt bölgesi) | Her `git push` otomatik derlenip yayınlanır. Fonksiyonlar veritabanıyla aynı şehirde çalışır. |

---

## Mimari

```
Tarayıcı (telefon / bilgisayar)
   │  sayfa isteği, form gönderimi
   ▼
Next.js sunucusu (Vercel, Frankfurt)
   ├─ proxy.ts          → giriş yapmamışsa /giris'e yönlendirir
   ├─ Server Components → sayfayı sunucuda hazırlar, veriyi çeker
   └─ Server Actions    → formları alır, Zod ile doğrular
   │  Supabase REST API (kullanıcının oturum bileti ile)
   ▼
Supabase PostgreSQL (Frankfurt)
   ├─ GRANT + RLS       → kim hangi satırı görebilir / yazabilir
   ├─ RPC fonksiyonları → kontrollü yazma (tek transaction)
   └─ CHECK kısıtları   → saçma veri kaydedilemez
```

**Tarayıcı veritabanıyla doğrudan konuşmaz.** Her istek Next.js sunucusu üzerinden geçer. Oturum çerezde durur, veri Supabase'tedir. Sunucu hiçbir durum tutmaz (serverless).

### Veri modeli

```
profiles ─┬─ group_members ─── groups ─┬─ invites       (davet linkleri)
          │                            ├─ expenses ──── expense_splits   (harcama ve kişi başı pay)
          │                            └─ settlements   (borç ödemeleri)
```

---

## Önemli teknik kararlar

1. **Para kuruş cinsinden tam sayı olarak tutulur.** `450,50 ₺` → `45050`. Ondalıklı sayılarda yuvarlama hatası olur: `parseFloat("4.35") * 100` = `434.99999999999994`.
2. **Eşit bölüşümde kuruş kaybolmaz.** 100 ₺ / 3 kişi → 33,34 + 33,33 + 33,33. Artan kuruşlar ilk kişilere dağıtılır, payların toplamı her zaman tutara eşittir.
3. **Bakiye saklanmaz, hesaplanır.** Sadece gerçek olaylar saklanır (harcama, pay, ödeme). Bakiye her açılışta bunlardan türetilir, bu yüzden veriler hiçbir zaman çelişmez.
4. **Toplama SQL'de, eşleştirme TypeScript'te.** `grup_bakiyeleri` kişi başı net tutarı verir. "Kim kime ne kadar ödesin" algoritması (`src/lib/borclar.ts`) saf bir fonksiyon olduğu için test edilebilir. En fazla (kişi − 1) ödeme önerir.
5. **Kullanıcı tablolara doğrudan yazamaz.** Yazma işleri `security definer` fonksiyonlarından geçer: üyelik, ödeyen ve borçluların grupta olması, tarih gibi kontrolleri yapar ve işi tek bir transaction içinde bitirir. Okuyan fonksiyonlar ise `security invoker` olduğu için RLS otomatik olarak uygulanır.
6. **Tarihler saatsiz gün olarak tutulur** (`date`, `"YYYY-MM-DD"`). "Bugün" İstanbul saatine göre hesaplanır. Ay sınırlarında saat dilimi kayması olmaz.
7. **Üyesi olmadığın grup "yok" görünür (404).** "Erişim reddedildi" demek, grubun var olduğunu ele verirdi.
8. **Borç ödemeleri aylık özete dahil değildir.** Onlar harcama değil, para transferi. Dahil edilseydi harcamalar iki kez sayılırdı.

---

## Güvenlik

| Katman | Koruma |
|---|---|
| Tarayıcı | Form kuralları (zorunlu alanlar, en büyük tarih, onay penceresi). Sadece kolaylık içindir. |
| Proxy | Giriş yapmamış kullanıcı korumalı sayfalara giremez. `?sonraki=` yönlendirmesi açık yönlendirmeye karşı korunur. |
| Sunucu | Zod ile biçim doğrulama. Hata mesajlarında teknik ayrıntı gösterilmez. |
| Veritabanı | 7 tablonun hepsinde **RLS açık**. Anonim kullanıcının hiçbir tablo izni yok. Giriş yapan kullanıcı sadece kendi gruplarının satırlarını **okuyabilir**. Yazma işleri kontrollü fonksiyonlardan geçer. Bütün fonksiyonlarda `search_path = ''`. |

**Denetim sonuçları:**
- Anonim kullanıcı olarak 7 tablo ve 10 fonksiyonda 31 deneme yapıldı, hepsi beklendiği gibi engellendi.
- İki ve üç kullanıcıyı taklit eden SQL senaryo testleri yazıldı: başka gruba harcama ekleme, grupta olmayan birini borçlu yapma, başkasının ödemesini kaydetme, tablolara doğrudan yazma, kayıt silme ve benzeri. Hepsi reddedildi.
- Git geçmişinde anahtar ya da `.env` dosyası yok.

---

## Testler

```bash
npm test
```

| Dosya | Ne test ediliyor | Test |
|---|---|---|
| `src/lib/borclar.test.ts` | Borç sadeleştirme algoritması: temel durumlar, gerçek veri ve **1000 rastgele grup** (her seferinde: en fazla kişi − 1 ödeme, herkes 0'a iniyor) | 9 |
| `src/lib/para.test.ts` | `"450,50"` → `45050` dönüşümü, geçersiz girişler, **gidiş-dönüş** (14.000+ tutar) | 5 |
| `src/lib/ay.test.ts` | Ay çözümleme, yıl değişimi, 1200 ay ileri-geri | 9 |
| `src/lib/tarih.test.ts` | Türkçe tarih ve İstanbul saat dilimi (UTC 22:30 → ertesi gün, yılbaşı gecesi) | 5 |

**Toplam: 28 test.**

---

## Proje yapısı

```
src/
├── app/                      sayfalar (klasör = adres)
│   ├── page.tsx              ana sayfa
│   ├── kayit/, giris/        kayıt ve giriş
│   ├── gruplar/              grup listesi
│   │   └── [id]/             grup sayfası (bakiye, harcama, ödeme)
│   │       └── ozet/         aylık özet
│   ├── davet/[token]/        davet linki
│   ├── auth/, harcamalar/, odemeler/   Server Actions (actions.ts)
│   ├── not-found.tsx, error.tsx        Türkçe 404 ve hata sayfaları
│   └── icon.tsx, opengraph-image.tsx   simge ve link önizlemesi
├── components/               arayüz bileşenleri (formlar, listeler, grafik)
├── lib/                      saf yardımcılar ve testleri (para, borçlar, ay, tarih)
│   └── supabase/             Supabase istemcileri
└── proxy.ts                  oturum kontrolü ve yönlendirme
supabase/migrations/          veritabanı şeması (sırayla çalıştırılır)
```

---

## Yerelde çalıştırma

1. Bağımlılıkları kur:
   ```bash
   npm install
   ```
2. Bir Supabase projesi aç. `supabase/migrations/` içindeki SQL dosyalarını **dosya adı sırasıyla** Supabase SQL Editor'da çalıştır.
3. Proje kökünde `.env.local` dosyası oluştur (Supabase → Project Settings → API):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=...
   ```
4. Çalıştır:
   ```bash
   npm run dev
   ```
   → http://localhost:3000

---

## Bilinen sınırlar ve geliştirilebilecekler

- **Harcama düzenleme ve silme yok.** Bakiyeler hesaplandığı için eklemek kolay, ama yeni bir fonksiyon ve test gerektiriyor.
- **Sadece eşit bölüşüm var.** Yüzdeyle ya da tutarla bölüşüm `expense_splits` tablosuna uygun, arayüzü eklenmedi.
- **Tek para birimi (₺).**
- **Supabase tip üretimi** (`supabase gen types`) kullanılmadı. Sorgu sonuçlarının tipleri elle tanımlandı.
- **Süresi dolan davet linkleri silinmiyor**, sadece geçersiz oluyor. `pg_cron` ile temizlenebilir.

## Üretime çıkmadan önce yapılacaklar

- [ ] E-posta doğrulamasını aç (SMTP ayarı ile).
- [ ] Sızdırılmış şifre korumasını aç (Supabase ücretli plan).
- [ ] Hata kayıtları için bir izleme servisi bağla.
