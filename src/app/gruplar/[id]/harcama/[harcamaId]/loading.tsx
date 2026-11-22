export default function HarcamaYukleniyor() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:max-w-5xl lg:px-8">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-48 animate-pulse rounded bg-muted" />
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2">
        <div className="h-40 w-full animate-pulse rounded-xl bg-muted" />
        <div className="h-72 w-full animate-pulse rounded-xl bg-muted" />
      </div>
    </main>
  );
}
