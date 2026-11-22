// Grup sayfası yüklenirken: sayfanın düzenine benzeyen iskelet (telefon tek sütun, bilgisayar 3 sütun)
export default function GrupYukleniyor() {
  const kutu = "animate-pulse rounded-xl bg-muted";
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:max-w-none lg:px-6">
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_minmax(0,1fr)]">
        <div className="flex flex-col gap-6">
          <div className={`h-64 ${kutu}`} />
          <div className="hidden h-32 lg:block animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="flex flex-col gap-6">
          <div className={`h-96 ${kutu}`} />
          <div className="hidden h-48 lg:block animate-pulse rounded-xl bg-muted" />
        </div>
        <div className="hidden flex-col gap-6 xl:flex">
          <div className={`h-40 ${kutu}`} />
          <div className={`h-56 ${kutu}`} />
        </div>
      </div>
    </main>
  );
}
