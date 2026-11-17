// Sayfa verisi (oturum + profil) gelene kadar gösterilen iskelet ekran.
// Next.js bu dosyayı sayfanın etrafına otomatik bir <Suspense> olarak sarar.
export default function Yukleniyor() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="h-7 w-24 animate-pulse rounded bg-muted" />
      <div className="space-y-2">
        <div className="h-8 w-56 animate-pulse rounded bg-muted" />
        <div className="h-4 w-40 animate-pulse rounded bg-muted" />
      </div>
      <div className="h-24 w-full animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
