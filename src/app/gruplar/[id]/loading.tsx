// Grup detayı yüklenirken gösterilen iskelet.
// Gruplar listesinden bir gruba tıklayınca ekran anında değişir,
// grup bilgisi ve üyeler arkadan akarak gelir.
export default function GrupYukleniyor() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col gap-6 px-4 py-8">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
      <div className="h-36 w-full animate-pulse rounded-xl bg-muted" />
    </main>
  );
}
