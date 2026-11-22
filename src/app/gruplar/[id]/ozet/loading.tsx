export default function OzetYukleniyor() {
  return (
    <main className="mx-auto flex w-full max-w-md flex-col gap-6 px-4 py-8 lg:max-w-5xl lg:px-8">
      <div className="h-4 w-24 animate-pulse rounded bg-muted" />
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      <div className="h-5 w-full animate-pulse rounded bg-muted" />
      <div className="grid grid-cols-2 gap-3">
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
      </div>
      <div className="flex flex-col gap-6 lg:grid lg:grid-cols-2">
        <div className="h-56 w-full animate-pulse rounded-xl bg-muted" />
        <div className="hidden h-56 w-full animate-pulse rounded-xl bg-muted lg:block" />
      </div>
    </main>
  );
}
